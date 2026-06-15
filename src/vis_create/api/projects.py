"""
项目API路由

包含项目CRUD、素材管理、角色管理、剧本管理等端点
文件存储使用 MinIO 对象存储
"""

import json
import uuid
import os
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config.settings import Settings
from ..database.connection import get_db
from ..services.storage import upload_file, delete_file, get_presigned_url
from ..models.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from ..models.asset import (
    Asset,
    AssetResponse,
    AssetListResponse,
    AssetSource,
)
from ..models.character import (
    Character,
    CharacterCreate,
    CharacterUpdate,
    CharacterResponse,
    CharacterListResponse,
    CharacterLockAvatar,
)
from ..models.artwork import Artwork
from ..models.scene import (
    Scene,
    SceneCreate,
    SceneUpdate,
    SceneResponse,
    SceneListResponse,
)
from ..models.script import (
    Script,
    ScriptCreate,
    ScriptUpdate,
    ScriptResponse,
    ScriptListResponse,
    Chapter,
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
    ChapterListResponse,
)

router = APIRouter()


# ──────────────────────────────────────────────
# 项目 CRUD
# ──────────────────────────────────────────────


@router.get("", response_model=ProjectListResponse)
def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """获取项目列表"""
    query = db.query(Project)
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
    total = query.count()
    projects = (
        query.order_by(Project.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return ProjectListResponse(
        data=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """获取项目详情"""
    project = db.query(Project).filter(Project.id == uuid.UUID(project_id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    """创建项目"""
    project = Project(name=data.name, description=data.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    """更新项目"""
    project = db.query(Project).filter(Project.id == uuid.UUID(project_id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """删除项目及其关联数据"""
    project = db.query(Project).filter(Project.id == uuid.UUID(project_id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pid = uuid.UUID(project_id)

    # 删除 MinIO 中的素材文件
    assets = db.query(Asset).filter(Asset.project_id == pid).all()
    for asset in assets:
        delete_file(asset.file_path)

    # 删除 MinIO 中的角色头像
    characters = db.query(Character).filter(Character.project_id == pid).all()
    for char in characters:
        if char.avatar_path:
            delete_file(char.avatar_path)

    # 级联删除关联数据
    db.query(Chapter).filter(
        Chapter.script_id.in_(db.query(Script.id).filter(Script.project_id == pid))
    ).delete(synchronize_session=False)
    db.query(Script).filter(Script.project_id == pid).delete(synchronize_session=False)
    db.query(Character).filter(Character.project_id == pid).delete(
        synchronize_session=False
    )
    db.query(Asset).filter(Asset.project_id == pid).delete(synchronize_session=False)
    db.delete(project)
    db.commit()


# ──────────────────────────────────────────────
# 素材管理
# ──────────────────────────────────────────────


@router.get("/{project_id}/assets", response_model=AssetListResponse)
def list_assets(project_id: str, db: Session = Depends(get_db)):
    """获取项目素材列表（返回预签名URL）"""
    pid = uuid.UUID(project_id)
    assets = (
        db.query(Asset)
        .filter(Asset.project_id == pid)
        .order_by(Asset.created_at.desc())
        .all()
    )
    result = []
    for asset in assets:
        resp = AssetResponse.model_validate(asset)
        # 用预签名URL替换对象名
        resp.file_path = get_presigned_url(asset.file_path)
        if asset.thumbnail_path:
            resp.thumbnail_path = get_presigned_url(asset.thumbnail_path)
        result.append(resp)
    return AssetListResponse(data=result, total=len(result))


@router.post("/{project_id}/assets", response_model=AssetResponse, status_code=201)
async def upload_asset(
    project_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """上传素材到项目（存储到 MinIO）"""
    pid = uuid.UUID(project_id)
    project = db.query(Project).filter(Project.id == pid).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    content_type = file.content_type or "application/octet-stream"
    if content_type.startswith("video"):
        file_type = "video"
    else:
        file_type = "image"

    ext = os.path.splitext(file.filename or "file")[1]
    file_data = await file.read()

    # 上传到 MinIO
    object_name = upload_file(
        file_data=file_data,
        content_type=content_type,
        prefix=f"projects/{project_id}/assets/",
        extension=ext,
    )

    asset = Asset(
        project_id=pid,
        name=name or (file.filename or "untitled"),
        type=file_type,
        file_path=object_name,  # 存储 MinIO 对象名
        source=AssetSource.UPLOADED,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    resp = AssetResponse.model_validate(asset)
    resp.file_path = get_presigned_url(object_name)
    return resp


@router.delete("/{project_id}/assets/{asset_id}", status_code=204)
def delete_asset(project_id: str, asset_id: str, db: Session = Depends(get_db)):
    """删除素材（同时删除 MinIO 文件）"""
    asset = (
        db.query(Asset)
        .filter(
            Asset.id == uuid.UUID(asset_id),
            Asset.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    delete_file(asset.file_path)
    db.delete(asset)
    db.commit()


# ──────────────────────────────────────────────
# 角色管理
# ──────────────────────────────────────────────


@router.get("/{project_id}/characters", response_model=CharacterListResponse)
def list_characters(project_id: str, db: Session = Depends(get_db)):
    """获取项目角色列表（头像和参考图返回预签名URL）"""
    pid = uuid.UUID(project_id)
    characters = (
        db.query(Character)
        .filter(Character.project_id == pid)
        .order_by(Character.created_at.desc())
        .all()
    )
    result = []
    for char in characters:
        resp = CharacterResponse.model_validate(char)
        if char.avatar_path:
            resp.avatar_path = get_presigned_url(char.avatar_path)
        if char.reference_images:
            resp.reference_images = [
                get_presigned_url(img) for img in char.reference_images
            ]
        result.append(resp)
    return CharacterListResponse(data=result, total=len(result))


@router.post(
    "/{project_id}/characters", response_model=CharacterResponse, status_code=201
)
def create_character(
    project_id: str, data: CharacterCreate, db: Session = Depends(get_db)
):
    """创建角色"""
    pid = uuid.UUID(project_id)
    project = db.query(Project).filter(Project.id == pid).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    character = Character(
        project_id=pid,
        name=data.name,
        age=data.age,
        personality=data.personality,
        description=data.description,
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return CharacterResponse.model_validate(character)


@router.put("/{project_id}/characters/{character_id}", response_model=CharacterResponse)
def update_character(
    project_id: str,
    character_id: str,
    data: CharacterUpdate,
    db: Session = Depends(get_db),
):
    """更新角色"""
    character = (
        db.query(Character)
        .filter(
            Character.id == uuid.UUID(character_id),
            Character.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(character, key, value)
    db.commit()
    db.refresh(character)
    return CharacterResponse.model_validate(character)


@router.post(
    "/{project_id}/characters/{character_id}/avatar",
    response_model=CharacterResponse,
)
async def upload_character_avatar(
    project_id: str,
    character_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """上传角色形象（存储到 MinIO）"""
    character = (
        db.query(Character)
        .filter(
            Character.id == uuid.UUID(character_id),
            Character.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    ext = os.path.splitext(file.filename or "avatar.png")[1]
    content_type = file.content_type or "image/png"
    file_data = await file.read()

    # 上传到 MinIO
    object_name = upload_file(
        file_data=file_data,
        content_type=content_type,
        prefix=f"projects/{project_id}/avatars/",
        extension=ext,
    )

    # 删除旧头像
    if character.avatar_path:
        delete_file(character.avatar_path)

    character.avatar_path = object_name
    db.commit()
    db.refresh(character)

    resp = CharacterResponse.model_validate(character)
    resp.avatar_path = get_presigned_url(object_name)
    return resp


@router.delete("/{project_id}/characters/{character_id}", status_code=204)
def delete_character(project_id: str, character_id: str, db: Session = Depends(get_db)):
    """删除角色"""
    character = (
        db.query(Character)
        .filter(
            Character.id == uuid.UUID(character_id),
            Character.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    if character.avatar_path:
        delete_file(character.avatar_path)
    db.delete(character)
    db.commit()


@router.post(
    "/{project_id}/characters/{character_id}/reference-images",
    response_model=CharacterResponse,
)
async def upload_character_reference_image(
    project_id: str,
    character_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """上传角色参考图（用于角色一致性生成）"""
    character = (
        db.query(Character)
        .filter(
            Character.id == uuid.UUID(character_id),
            Character.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    ext = os.path.splitext(file.filename or "ref.png")[1]
    content_type = file.content_type or "image/png"
    file_data = await file.read()

    # 上传到 MinIO
    object_name = upload_file(
        file_data=file_data,
        content_type=content_type,
        prefix=f"projects/{project_id}/characters/{character_id}/references/",
        extension=ext,
    )

    # 添加到参考图列表
    if character.reference_images is None:
        character.reference_images = []
    character.reference_images.append(object_name)
    db.commit()
    db.refresh(character)

    resp = CharacterResponse.model_validate(character)
    # 转换为预签名URL
    resp.reference_images = [
        get_presigned_url(img) for img in character.reference_images
    ]
    if resp.avatar_path:
        resp.avatar_path = get_presigned_url(resp.avatar_path)
    return resp


@router.delete(
    "/{project_id}/characters/{character_id}/reference-images/{image_index}",
    status_code=204,
)
def delete_character_reference_image(
    project_id: str,
    character_id: str,
    image_index: int,
    db: Session = Depends(get_db),
):
    """删除角色参考图"""
    character = (
        db.query(Character)
        .filter(
            Character.id == uuid.UUID(character_id),
            Character.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    if not character.reference_images or image_index >= len(character.reference_images):
        raise HTTPException(status_code=404, detail="Reference image not found")

    # 删除MinIO文件
    delete_file(character.reference_images[image_index])

    # 从列表中移除
    character.reference_images.pop(image_index)
    db.commit()


@router.post(
    "/{project_id}/characters/{character_id}/lock-avatar",
    response_model=CharacterResponse,
)
def lock_character_avatar(
    project_id: str,
    character_id: str,
    data: CharacterLockAvatar,
    db: Session = Depends(get_db),
):
    """锁定角色形象（将某个作品设为角色的固定形象）"""
    character = (
        db.query(Character)
        .filter(
            Character.id == uuid.UUID(character_id),
            Character.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # 验证作品存在且属于该项目
    artwork = (
        db.query(Artwork)
        .filter(
            Artwork.id == uuid.UUID(data.artwork_id),
            Artwork.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found in this project")

    # 锁定形象
    character.locked_avatar_id = artwork.id
    character.avatar_path = artwork.file_path

    # 自动添加到参考图列表（如果不存在）
    if character.reference_images is None:
        character.reference_images = []
    if artwork.file_path not in character.reference_images:
        character.reference_images.append(artwork.file_path)

    db.commit()
    db.refresh(character)

    resp = CharacterResponse.model_validate(character)
    resp.reference_images = [
        get_presigned_url(img) for img in character.reference_images
    ]
    if resp.avatar_path:
        resp.avatar_path = get_presigned_url(resp.avatar_path)
    return resp


# ──────────────────────────────────────────────
# 剧本管理
# ──────────────────────────────────────────────


@router.get("/{project_id}/scripts", response_model=ScriptListResponse)
def list_scripts(project_id: str, db: Session = Depends(get_db)):
    """获取项目剧本列表"""
    pid = uuid.UUID(project_id)
    scripts = (
        db.query(Script)
        .filter(Script.project_id == pid)
        .order_by(Script.created_at.desc())
        .all()
    )
    return ScriptListResponse(
        data=[ScriptResponse.model_validate(s) for s in scripts],
        total=len(scripts),
    )


@router.post("/{project_id}/scripts", response_model=ScriptResponse, status_code=201)
def create_script(project_id: str, data: ScriptCreate, db: Session = Depends(get_db)):
    """创建剧本"""
    pid = uuid.UUID(project_id)
    project = db.query(Project).filter(Project.id == pid).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    script = Script(project_id=pid, title=data.title, description=data.description)
    db.add(script)
    db.commit()
    db.refresh(script)
    return ScriptResponse.model_validate(script)


@router.put("/{project_id}/scripts/{script_id}", response_model=ScriptResponse)
def update_script(
    project_id: str,
    script_id: str,
    data: ScriptUpdate,
    db: Session = Depends(get_db),
):
    """更新剧本"""
    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(script, key, value)
    db.commit()
    db.refresh(script)
    return ScriptResponse.model_validate(script)


@router.delete("/{project_id}/scripts/{script_id}", status_code=204)
def delete_script(project_id: str, script_id: str, db: Session = Depends(get_db)):
    """删除剧本及其章节"""
    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    db.query(Chapter).filter(Chapter.script_id == script.id).delete(
        synchronize_session=False
    )
    db.delete(script)
    db.commit()


# ──────────────────────────────────────────────
# 章节管理
# ──────────────────────────────────────────────


@router.get(
    "/{project_id}/scripts/{script_id}/chapters",
    response_model=ChapterListResponse,
)
def list_chapters(project_id: str, script_id: str, db: Session = Depends(get_db)):
    """获取剧本章节列表"""
    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    chapters = (
        db.query(Chapter)
        .filter(Chapter.script_id == script.id)
        .order_by(Chapter.sort_order, Chapter.created_at)
        .all()
    )
    return ChapterListResponse(
        data=[ChapterResponse.model_validate(c) for c in chapters],
        total=len(chapters),
    )


@router.post(
    "/{project_id}/scripts/{script_id}/chapters",
    response_model=ChapterResponse,
    status_code=201,
)
def create_chapter(
    project_id: str,
    script_id: str,
    data: ChapterCreate,
    db: Session = Depends(get_db),
):
    """创建章节"""
    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    chapter = Chapter(
        script_id=script.id,
        title=data.title,
        content=data.content or "",
        sort_order=data.sort_order or 0,
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return ChapterResponse.model_validate(chapter)


@router.put(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}",
    response_model=ChapterResponse,
)
def update_chapter(
    project_id: str,
    script_id: str,
    chapter_id: str,
    data: ChapterUpdate,
    db: Session = Depends(get_db),
):
    """更新章节"""
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chapter, key, value)
    db.commit()
    db.refresh(chapter)
    return ChapterResponse.model_validate(chapter)


@router.delete(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}",
    status_code=204,
)
def delete_chapter(
    project_id: str,
    script_id: str,
    chapter_id: str,
    db: Session = Depends(get_db),
):
    """删除章节"""
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    db.delete(chapter)
    db.commit()


# ──────────────────────────────────────────────
# 场景（分镜）管理
# ──────────────────────────────────────────────


@router.get(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}/scenes",
    response_model=SceneListResponse,
)
def list_scenes(
    project_id: str,
    script_id: str,
    chapter_id: str,
    db: Session = Depends(get_db),
):
    """获取章节场景列表"""
    # 验证章节存在且属于该项目
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    scenes = (
        db.query(Scene)
        .filter(Scene.chapter_id == chapter.id)
        .order_by(Scene.sort_order, Scene.created_at)
        .all()
    )
    return SceneListResponse(
        data=[SceneResponse.model_validate(s) for s in scenes],
        total=len(scenes),
    )


class SceneBreakdownRequest(BaseModel):
    """AI拆解分镜请求"""

    chapter_content: Optional[str] = None
    max_scenes: int = 10


class SceneBreakdownResult(BaseModel):
    """AI拆解分镜结果"""

    scenes: list[SceneCreate]


@router.post(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}/scenes/breakdown",
    response_model=SceneBreakdownResult,
)
async def breakdown_chapter_to_scenes(
    project_id: str,
    script_id: str,
    chapter_id: str,
    data: SceneBreakdownRequest,
    db: Session = Depends(get_db),
):
    """AI自动将章节内容拆解为分镜"""
    import httpx
    from ..models.model_provider import Model, ModelProvider

    # 验证章节存在且属于该项目
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    # 获取章节内容
    content = data.chapter_content or chapter.content
    if not content or len(content.strip()) < 10:
        raise HTTPException(status_code=400, detail="章节内容太短，无法拆解")

    # 获取文本生成模型配置
    settings = Settings()

    # 优先从模型设置中获取 text_generation 类型的模型
    text_model = (
        db.query(Model)
        .filter(
            Model.model_type == "text_generation",
            Model.is_enabled == True,
        )
        .first()
    )

    # 获取模型配置
    api_key = None
    base_url = None
    model_name = None

    if text_model:
        # 使用配置的文本模型
        provider = (
            db.query(ModelProvider)
            .filter(ModelProvider.id == text_model.provider_id)
            .first()
        )

        if provider:
            api_key = provider.api_key or settings.openai_api_key
            base_url = provider.base_url
            model_name = text_model.name

            # 解析模型配置
            model_config = {}
            if text_model.config:
                try:
                    model_config = (
                        json.loads(text_model.config)
                        if isinstance(text_model.config, str)
                        else text_model.config
                    )
                except:
                    pass

    # 回退到 .env 配置
    if not api_key:
        api_key = settings.openai_api_key
        if not api_key:
            raise HTTPException(
                status_code=500, detail="未配置文本模型或OpenAI API密钥"
            )

    if not base_url:
        base_url = "https://api.openai.com/v1"

    if not model_name:
        model_name = settings.openai_model

    # 构建提示词
    prompt = f"""请将以下文本内容拆解为{data.max_scenes}个以内的分镜（镜头）。

每个分镜应该是一个独立的画面描述，包含：
1. 标题：简短的画面描述
2. 画面描述：详细的画面内容
3. 镜头类型：选择一个（extreme_close_up特写/close_up近景/medium_shot中景/full_shot全景/long_shot远景/birds_eye鸟瞰/low_angle仰拍/high_angle俯拍/dutch_angle倾斜）
4. 台词/旁白：文本中的对话或旁白（如果有）
5. 氛围：画面的整体氛围

文本内容：
{content[:2000]}

请以JSON格式返回，格式如下：
{{
  "scenes": [
    {{
      "title": "分镜标题",
      "description": "画面描述",
      "shot_type": "镜头类型",
      "dialogue": "台词（可选）",
      "mood": "氛围（可选）",
      "background_description": "背景描述（可选）"
    }}
  ]
}}"""

    try:
        async with httpx.AsyncClient() as client:
            # 构建请求头
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }

            # 构建请求体
            request_body = {
                "model": model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一个专业的分镜师，擅长将文本转化为视觉分镜。请直接返回JSON格式，不要有其他文字。",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
            }

            # 如果是 OpenAI 兼容 API，直接调用
            api_url = f"{base_url.rstrip('/')}/chat/completions"

            response = await client.post(
                api_url,
                headers=headers,
                json=request_body,
                timeout=60.0,
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, detail=f"AI服务调用失败: {response.text}"
                )

            result = response.json()
            content_text = result["choices"][0]["message"]["content"]

            # 解析JSON
            # 尝试提取JSON部分（可能被markdown代码块包裹）
            if "```json" in content_text:
                content_text = content_text.split("```json")[1].split("```")[0]
            elif "```" in content_text:
                content_text = content_text.split("```")[1].split("```")[0]

            parsed = json.loads(content_text.strip())
            scenes_data = parsed.get("scenes", [])

            # 转换为 SceneCreate 对象
            scenes = []
            for i, scene in enumerate(scenes_data[: data.max_scenes]):
                scenes.append(
                    SceneCreate(
                        title=scene.get("title", f"分镜{i + 1}"),
                        description=scene.get("description", ""),
                        shot_type=scene.get("shot_type", "medium_shot"),
                        dialogue=scene.get("dialogue"),
                        mood=scene.get("mood"),
                        background_description=scene.get("background_description"),
                        sort_order=i + 1,
                    )
                )

            return SceneBreakdownResult(scenes=scenes)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI返回格式错误: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI拆解失败: {str(e)}")


@router.post(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}/scenes",
    response_model=SceneResponse,
    status_code=201,
)
def create_scene(
    project_id: str,
    script_id: str,
    chapter_id: str,
    data: SceneCreate,
    db: Session = Depends(get_db),
):
    """创建场景"""
    # 验证章节存在且属于该项目
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    scene = Scene(
        chapter_id=chapter.id,
        title=data.title,
        description=data.description,
        sort_order=data.sort_order or 0,
        shot_type=data.shot_type,
        camera_movement=data.camera_movement,
        character_ids=data.character_ids,
        background_description=data.background_description,
        mood=data.mood,
        dialogue=data.dialogue,
    )
    db.add(scene)
    db.commit()
    db.refresh(scene)
    return SceneResponse.model_validate(scene)


@router.get(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}/scenes/{scene_id}",
    response_model=SceneResponse,
)
def get_scene(
    project_id: str,
    script_id: str,
    chapter_id: str,
    scene_id: str,
    db: Session = Depends(get_db),
):
    """获取场景详情"""
    scene = db.query(Scene).filter(Scene.id == uuid.UUID(scene_id)).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # 验证归属关系
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter or scene.chapter_id != chapter.id:
        raise HTTPException(status_code=404, detail="Scene not found in this chapter")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    return SceneResponse.model_validate(scene)


@router.put(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}/scenes/{scene_id}",
    response_model=SceneResponse,
)
def update_scene(
    project_id: str,
    script_id: str,
    chapter_id: str,
    scene_id: str,
    data: SceneUpdate,
    db: Session = Depends(get_db),
):
    """更新场景"""
    scene = db.query(Scene).filter(Scene.id == uuid.UUID(scene_id)).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # 验证归属关系
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter or scene.chapter_id != chapter.id:
        raise HTTPException(status_code=404, detail="Scene not found in this chapter")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(scene, key, value)
    db.commit()
    db.refresh(scene)
    return SceneResponse.model_validate(scene)


@router.delete(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}/scenes/{scene_id}",
    status_code=204,
)
def delete_scene(
    project_id: str,
    script_id: str,
    chapter_id: str,
    scene_id: str,
    db: Session = Depends(get_db),
):
    """删除场景"""
    scene = db.query(Scene).filter(Scene.id == uuid.UUID(scene_id)).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # 验证归属关系
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter or scene.chapter_id != chapter.id:
        raise HTTPException(status_code=404, detail="Scene not found in this chapter")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    db.delete(scene)
    db.commit()


@router.post(
    "/{project_id}/scripts/{script_id}/chapters/{chapter_id}/scenes/{scene_id}/generate-artwork",
    response_model=SceneResponse,
)
def generate_scene_artwork(
    project_id: str,
    script_id: str,
    chapter_id: str,
    scene_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """为场景生成作品（基于场景描述和角色信息）"""
    scene = db.query(Scene).filter(Scene.id == uuid.UUID(scene_id)).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # 验证归属关系
    chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
    if not chapter or scene.chapter_id != chapter.id:
        raise HTTPException(status_code=404, detail="Scene not found in this chapter")

    script = (
        db.query(Script)
        .filter(
            Script.id == uuid.UUID(script_id),
            Script.project_id == uuid.UUID(project_id),
        )
        .first()
    )
    if not script or chapter.script_id != script.id:
        raise HTTPException(status_code=404, detail="Chapter not found in this script")

    # 获取场景关联的角色信息
    character_descriptions = []
    reference_images = []
    if scene.character_ids:
        characters = (
            db.query(Character)
            .filter(Character.id.in_([uuid.UUID(cid) for cid in scene.character_ids]))
            .all()
        )
        for char in characters:
            desc_parts = [char.name]
            if char.age:
                desc_parts.append(f"{char.age}岁")
            if char.personality:
                desc_parts.append(char.personality)
            if char.visual_features:
                desc_parts.append(char.visual_features)
            character_descriptions.append(", ".join(desc_parts))
            if char.reference_images:
                reference_images.extend(char.reference_images)

    # 构建提示词
    prompt_parts = []
    if scene.description:
        prompt_parts.append(scene.description)
    if scene.background_description:
        prompt_parts.append(scene.background_description)
    if scene.mood:
        prompt_parts.append(f"mood: {scene.mood}")
    if scene.shot_type:
        prompt_parts.append(f"shot: {scene.shot_type}")
    if character_descriptions:
        prompt_parts.append(f"characters: {'; '.join(character_descriptions)}")
    if scene.dialogue:
        prompt_parts.append(f"dialogue: {scene.dialogue}")

    enhanced_prompt = ", ".join(prompt_parts)

    # 创建生成任务
    from ..models.task import Task, TaskStatus
    from ..models.creation_params import CreationParameters

    task = Task(
        type="image",
        prompt=enhanced_prompt,
        parameters={
            "scene_id": str(scene.id),
            "chapter_id": str(chapter_id),
            "character_ids": scene.character_ids or [],
            "reference_images": reference_images[:3],  # 最多3张参考图
        },
        project_id=uuid.UUID(project_id),
        status=TaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 启动后台任务
    from ..api.tasks import _process_task

    background_tasks.add_task(_process_task, task.id)

    # 更新场景的作品ID（异步生成，这里先返回场景信息）
    db.refresh(scene)
    return SceneResponse.model_validate(scene)
