"""
任务API路由
"""

import json
import os
import uuid
import asyncio
import logging
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config.settings import Settings
from ..database.connection import get_db, get_session_factory
from ..generators.comfyui import ComfyUIGenerator
from ..generators.image import ImageGenerator
from ..models.artwork import Artwork
from ..models.character import Character
from ..models.model_provider import Model, ModelProvider
from ..models.scene import Scene
from ..prompts.prompt_builder import PromptBuilder
from ..services.storage import upload_file, get_public_url
from ..models.task import (
    Task,
    TaskCreate,
    TaskResponse,
    TaskListResponse,
    TaskStatus,
    TaskProgressEvent,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _convert_video_params(size: str) -> tuple[str, str]:
    """将前端的尺寸参数转换为视频生成器的 resolution 和 ratio

    Args:
        size: 前端尺寸参数，如 "16:9", "9:16", "1:1" 等

    Returns:
        tuple: (resolution, ratio)
    """
    # 尺寸到分辨率和宽高比的映射
    size_map = {
        "16:9": ("720P", "16:9"),
        "9:16": ("720P", "9:16"),
        "1:1": ("720P", "1:1"),
        "4:3": ("720P", "4:3"),
        "3:4": ("720P", "3:4"),
        "21:9": ("720P", "21:9"),
    }
    return size_map.get(size, ("720P", "16:9"))


async def _process_task(task_id: uuid.UUID) -> None:
    """后台处理任务（异步版本）"""
    logger.info("Background task started for %s", task_id)
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            logger.error("Task %s not found", task_id)
            return

        from datetime import datetime, timezone

        task.status = TaskStatus.PROCESSING
        task.started_at = datetime.now(timezone.utc)
        task.progress = 10.0
        db.commit()
        logger.info("Task %s status -> processing", task_id)

        settings = Settings()
        params = task.parameters or {}

        # 使用 PromptBuilder 构建完整的提示词
        prompt_builder = PromptBuilder()
        enhanced_prompt = prompt_builder.build(
            user_prompt=task.prompt,
            parameters=params,
        )
        logger.info("Enhanced prompt: %s", enhanced_prompt[:200])

        if task.type == "image":
            # 根据 model_id 查找模型和提供商
            model_id = params.get("model_id")
            generator_result = None

            if model_id:
                model = db.query(Model).filter(Model.id == uuid.UUID(model_id)).first()
                if model:
                    provider = (
                        db.query(ModelProvider)
                        .filter(ModelProvider.id == model.provider_id)
                        .first()
                    )
                    if provider:
                        logger.info(
                            "Using model %s from provider %s",
                            model.name,
                            provider.name,
                        )
                        model_config = {}
                        if model.config:
                            try:
                                model_config = (
                                    json.loads(model.config)
                                    if isinstance(model.config, str)
                                    else model.config
                                )
                            except (json.JSONDecodeError, TypeError):
                                pass

                        if provider.name == "comfyui":
                            generator_result = (
                                "comfyui",
                                model.name,
                                provider,
                                model_config,
                            )
                        else:
                            generator_result = ("openai", None, provider, model_config)

            # 更新进度（API调用前）
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task or task.status == TaskStatus.FAILED:
                db.close()
                return
            task.progress = 40.0
            db.commit()

            # 调用对应的生成器
            if generator_result and generator_result[0] == "comfyui":
                _, model_name, provider, model_config = generator_result
                async with ComfyUIGenerator(
                    base_url=provider.base_url or "http://localhost:8188",
                    api_key=provider.api_key,
                ) as comfyui_gen:
                    result = await comfyui_gen.generate(
                        prompt=enhanced_prompt,
                        model_name=model_name,
                        output_dir=settings.output_dir,
                        style=params.get("style", "realistic"),
                        size=params.get("size", "1024x1024"),
                        config=model_config,
                    )
            else:
                # 默认使用 OpenAI
                async with ImageGenerator(settings) as openai_gen:
                    # 获取参考图URL
                    reference_image_url = params.get("referenceImageUrl")
                    result = await openai_gen.generate_async(
                        prompt=enhanced_prompt,
                        output_dir=settings.output_dir,
                        style=params.get("style", "realistic"),
                        size=params.get("size", "1024x1024"),
                        reference_image_url=reference_image_url,
                    )

            # 检查任务是否被取消
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task or task.status == TaskStatus.FAILED:
                db.close()
                return

            if result.success:
                task.progress = 100.0
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.now(timezone.utc)
                params = task.parameters or {}
                params["output_file"] = result.file_path
                task.parameters = params

                # 上传到 MinIO
                prefix = "videos/" if task.type == "video" else "images/"
                object_name = upload_file(result.file_path, prefix=prefix)
                file_url = get_public_url(object_name)
                logger.info(
                    "Task %s completed, uploaded to MinIO: %s", task_id, file_url
                )

                # 提取关联信息
                character_id = params.get("character_id")
                chapter_id = params.get("chapter_id")
                scene_id = params.get("scene_id")

                # 创建作品记录
                artwork = Artwork(
                    title=task.prompt[:100],
                    type=task.type,
                    file_path=file_url,
                    prompt=task.prompt,
                    style=params.get("style"),
                    parameters=params,
                    project_id=task.project_id,
                    character_id=uuid.UUID(character_id) if character_id else None,
                    chapter_id=uuid.UUID(chapter_id) if chapter_id else None,
                    scene_id=uuid.UUID(scene_id) if scene_id else None,
                )
                db.add(artwork)
                db.flush()  # 获取artwork ID

                # 如果有关联场景，更新场景的artwork_id
                if scene_id:
                    scene = (
                        db.query(Scene).filter(Scene.id == uuid.UUID(scene_id)).first()
                    )
                    if scene:
                        scene.artwork_id = artwork.id
                        logger.info(
                            "Updated scene %s with artwork %s", scene_id, artwork.id
                        )

                # 如果有关联角色，更新角色的参考图（如果是第一次生成）
                if character_id:
                    character = (
                        db.query(Character)
                        .filter(Character.id == uuid.UUID(character_id))
                        .first()
                    )
                    if character:
                        # 如果角色没有锁定的形象，自动添加到参考图
                        if not character.locked_avatar_id:
                            if not character.reference_images:
                                character.reference_images = []
                            if object_name not in character.reference_images:
                                character.reference_images.append(object_name)
                                logger.info(
                                    "Added reference image to character %s",
                                    character_id,
                                )
            else:
                task.status = TaskStatus.FAILED
                task.error_message = result.error
                logger.error("Task %s failed: %s", task_id, result.error)
        elif task.type == "video":
            # 视频生成
            from ..generators.video import VideoGenerator

            task.progress = 20.0
            db.commit()

            # 转换前端参数到视频生成器参数
            size = params.get("size", "16:9")
            resolution, ratio = _convert_video_params(size)

            async with VideoGenerator(settings) as video_gen:
                result = await video_gen.generate_async(
                    prompt=enhanced_prompt,
                    output_dir=settings.output_dir,
                    duration=params.get("duration", 5),
                    resolution=params.get("resolution", resolution),
                    ratio=params.get("ratio", ratio),
                )

            # 检查任务是否被取消
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task or task.status == TaskStatus.FAILED:
                db.close()
                return

            if result.success:
                task.progress = 100.0
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.now(timezone.utc)
                params = task.parameters or {}
                params["output_file"] = result.file_path
                task.parameters = params

                # 上传到 MinIO
                object_name = upload_file(result.file_path, prefix="videos/")
                file_url = get_public_url(object_name)
                logger.info(
                    "Video task %s completed, uploaded to MinIO: %s",
                    task_id,
                    file_url,
                )

                # 创建作品记录
                artwork = Artwork(
                    title=task.prompt[:100],
                    type="video",
                    file_path=file_url,
                    prompt=task.prompt,
                    parameters=params,
                    project_id=task.project_id,
                )
                db.add(artwork)
            else:
                task.status = TaskStatus.FAILED
                task.error_message = result.error
                logger.error("Video task %s failed: %s", task_id, result.error)

        db.commit()
    except Exception as e:
        logger.exception("Task processing failed: %s", e)
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.get("", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="按状态筛选"),
    type: Optional[str] = Query(None, description="按类型筛选"),
    db: Session = Depends(get_db),
):
    """获取任务列表"""
    query = db.query(Task)

    # 筛选
    if status:
        query = query.filter(Task.status == status)
    if type:
        query = query.filter(Task.type == type)

    total = query.count()
    tasks = (
        query
        .order_by(Task.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return TaskListResponse(
        data=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """获取任务详情"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
    data: TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """创建任务并启动后台处理"""
    # 将 Pydantic 模型转换为 dict 以便存储到 JSON 字段
    params_dict = (
        data.parameters.model_dump(exclude_none=True) if data.parameters else None
    )

    task = Task(
        type=data.type,
        prompt=data.prompt,
        parameters=params_dict,
        project_id=uuid.UUID(data.project_id) if data.project_id else None,
        status=TaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    background_tasks.add_task(_process_task, task.id)

    return TaskResponse.model_validate(task)


@router.put("/{task_id}/pause", response_model=TaskResponse)
def pause_task(task_id: str, db: Session = Depends(get_db)):
    """暂停任务"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status != TaskStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Task is not processing")

    task.status = TaskStatus.PAUSED
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.put("/{task_id}/resume", response_model=TaskResponse)
def resume_task(task_id: str, db: Session = Depends(get_db)):
    """恢复任务"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status != TaskStatus.PAUSED:
        raise HTTPException(status_code=400, detail="Task is not paused")

    task.status = TaskStatus.PROCESSING
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=204)
def cancel_task(task_id: str, db: Session = Depends(get_db)):
    """取消任务"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Task already finished")

    task.status = TaskStatus.FAILED
    task.error_message = "Cancelled by user"
    db.commit()


@router.delete("/{task_id}/delete", status_code=204)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """删除已完成/失败/暂停的任务"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in [TaskStatus.PROCESSING, TaskStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Cannot delete active task")

    db.delete(task)
    db.commit()


@router.get("/{task_id}/events")
async def task_events(task_id: str):
    """SSE进度推送"""
    # 在 SSE 端点中，每个迭代创建独立的 session
    async def event_generator() -> AsyncGenerator[str, None]:
        SessionLocal = get_session_factory()
        while True:
            db = SessionLocal()
            try:
                task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
                if not task:
                    yield f"event: error\ndata: {{\"error\": \"Task not found\"}}\n\n"
                    break

                event = TaskProgressEvent(
                    task_id=str(task.id),
                    status=task.status,
                    progress=task.progress,
                )

                yield f"event: {task.status.value}\ndata: {event.model_dump_json()}\n\n"

                if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                    break
            finally:
                db.close()

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


class ImageEditRequest(BaseModel):
    """图片编辑请求"""

    image_path: str
    instruction: str
    output_path: Optional[str] = None
    mask_path: Optional[str] = None


async def _process_edit_task(task_id: uuid.UUID) -> None:
    """后台处理图片编辑任务（异步版本）"""
    logger.info("Background edit task started for %s", task_id)
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            logger.error("Task %s not found", task_id)
            return

        from datetime import datetime, timezone

        task.status = TaskStatus.PROCESSING
        task.started_at = datetime.now(timezone.utc)
        task.progress = 50.0
        db.commit()

        settings = Settings()
        params = task.parameters or {}

        # 创建图片生成器并执行编辑
        async with ImageGenerator(settings) as image_gen:
            result = await image_gen.edit_async(
                image_path=params.get("image_path", ""),
                instruction=task.prompt,
                output_path=params.get("output_path"),
                mask_path=params.get("mask_path"),
            )

        task = db.query(Task).filter(Task.id == task_id).first()
        if not task or task.status == TaskStatus.FAILED:
            db.close()
            return

        if result.success:
            task.progress = 100.0
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc)
            params["output_file"] = result.file_path
            task.parameters = params

            # 上传到 MinIO
            object_name = upload_file(result.file_path, prefix="edited/")
            file_url = get_public_url(object_name)
            logger.info(
                "Edit task %s completed, uploaded to MinIO: %s", task_id, file_url
            )

            # 创建作品记录
            artwork = Artwork(
                title=f"编辑: {task.prompt[:80]}",
                type="image",
                file_path=file_url,
                prompt=task.prompt,
                parameters=params,
                project_id=task.project_id,
            )
            db.add(artwork)
        else:
            task.status = TaskStatus.FAILED
            task.error_message = result.error
            logger.error("Edit task %s failed: %s", task_id, result.error)

        db.commit()
    except Exception as e:
        logger.exception("Edit task processing failed: %s", e)
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/edit", response_model=TaskResponse, status_code=201)
def edit_image(
    data: ImageEditRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """创建图片编辑任务"""
    task = Task(
        type="image",
        prompt=data.instruction,
        parameters={
            "image_path": data.image_path,
            "output_path": data.output_path,
            "mask_path": data.mask_path,
            "is_edit": True,
        },
        status=TaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    background_tasks.add_task(_process_edit_task, task.id)

    return TaskResponse.model_validate(task)
