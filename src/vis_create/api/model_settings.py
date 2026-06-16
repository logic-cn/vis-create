"""
模型设置API路由

管理模型提供商、模型配置和默认模型设置
"""

import json
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from ..database.connection import get_db
from ..models.model_provider import (
    DefaultModelsResponse,
    DefaultModelsUpdate,
    Model,
    ModelCreate,
    ModelListResponse,
    ModelProvider,
    ModelProviderCreate,
    ModelProviderListResponse,
    ModelProviderResponse,
    ModelProviderUpdate,
    ModelResponse,
    ModelType,
    ModelUpdate,
    ProviderType,
)

router = APIRouter()


# ── 模型提供商 CRUD ──


@router.get("/providers", response_model=ModelProviderListResponse)
def list_providers(
    provider_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """获取模型提供商列表"""
    query = select(ModelProvider)
    if provider_type:
        query = query.where(ModelProvider.provider_type == provider_type)
    query = query.order_by(ModelProvider.created_at.desc())

    result = db.execute(query)
    providers = result.scalars().all()

    # 转换 UUID 为字符串
    provider_list = []
    for p in providers:
        provider_dict = {
            "id": str(p.id),
            "name": p.name,
            "display_name": p.display_name,
            "provider_type": p.provider_type,
            "base_url": p.base_url,
            "api_key": p.api_key,
            "description": p.description,
            "icon": p.icon,
            "is_enabled": p.is_enabled,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        provider_list.append(ModelProviderResponse(**provider_dict))

    return ModelProviderListResponse(
        data=provider_list,
        total=len(providers),
    )


@router.get("/providers/{provider_id}", response_model=ModelProviderResponse)
def get_provider(provider_id: str, db: Session = Depends(get_db)):
    """获取单个模型提供商"""
    result = db.execute(
        select(ModelProvider).where(ModelProvider.id == uuid.UUID(provider_id))
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return ModelProviderResponse(
        id=str(provider.id),
        name=provider.name,
        display_name=provider.display_name,
        provider_type=provider.provider_type,
        base_url=provider.base_url,
        api_key=provider.api_key,
        description=provider.description,
        icon=provider.icon,
        is_enabled=provider.is_enabled,
        created_at=provider.created_at,
        updated_at=provider.updated_at,
    )


@router.post("/providers", response_model=ModelProviderResponse)
def create_provider(data: ModelProviderCreate, db: Session = Depends(get_db)):
    """创建模型提供商"""
    logger.debug("Received data: %s", data.model_dump())
    try:
        # 检查名称是否重复
        existing = db.execute(
            select(ModelProvider).where(ModelProvider.name == data.name)
        )
        existing_provider = existing.scalar_one_or_none()
        logger.debug("Existing provider check: %s", existing_provider)
        if existing_provider:
            raise HTTPException(status_code=400, detail="Provider name already exists")

        provider = ModelProvider(**data.model_dump())
        db.add(provider)
        db.commit()
        db.refresh(provider)
        logger.debug("Provider created: %s", provider.id)
        return ModelProviderResponse(
            id=str(provider.id),
            name=provider.name,
            display_name=provider.display_name,
            provider_type=provider.provider_type,
            base_url=provider.base_url,
            api_key=provider.api_key,
            description=provider.description,
            icon=provider.icon,
            is_enabled=provider.is_enabled,
            created_at=provider.created_at,
            updated_at=provider.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Failed to create provider: %s", e)
        raise HTTPException(
            status_code=500, detail=f"Failed to create provider: {str(e)}"
        )


@router.put("/providers/{provider_id}", response_model=ModelProviderResponse)
def update_provider(
    provider_id: str,
    data: ModelProviderUpdate,
    db: Session = Depends(get_db),
):
    """更新模型提供商"""
    result = db.execute(select(ModelProvider).where(ModelProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(provider, key, value)

    db.commit()
    db.refresh(provider)
    return ModelProviderResponse(
        id=str(provider.id),
        name=provider.name,
        display_name=provider.display_name,
        provider_type=provider.provider_type,
        base_url=provider.base_url,
        api_key=provider.api_key,
        description=provider.description,
        icon=provider.icon,
        is_enabled=provider.is_enabled,
        created_at=provider.created_at,
        updated_at=provider.updated_at,
    )


@router.delete("/providers/{provider_id}")
def delete_provider(provider_id: str, db: Session = Depends(get_db)):
    """删除模型提供商"""
    result = db.execute(
        select(ModelProvider).where(ModelProvider.id == uuid.UUID(provider_id))
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # 检查是否有关联的模型
    models_result = db.execute(
        select(Model).where(Model.provider_id == uuid.UUID(provider_id))
    )
    if models_result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete provider with associated models",
        )

    db.delete(provider)
    db.commit()
    return {"success": True}


# ── 模型 CRUD ──


@router.get("/models", response_model=ModelListResponse)
def list_models(
    provider_id: Optional[str] = None,
    model_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """获取模型列表"""
    query = select(Model)
    if provider_id:
        query = query.where(Model.provider_id == uuid.UUID(provider_id))
    if model_type:
        query = query.where(Model.model_type == model_type)
    query = query.order_by(Model.created_at.desc())

    result = db.execute(query)
    models = result.scalars().all()

    # 转换 UUID 为字符串
    model_list = []
    for m in models:
        model_dict = {
            "id": str(m.id),
            "provider_id": str(m.provider_id),
            "name": m.name,
            "display_name": m.display_name,
            "model_type": m.model_type,
            "description": m.description,
            "config": m.config,
            "is_enabled": m.is_enabled,
            "is_default": m.is_default,
            "created_at": m.created_at,
            "updated_at": m.updated_at,
        }
        model_list.append(ModelResponse(**model_dict))

    return ModelListResponse(
        data=model_list,
        total=len(models),
    )


@router.get("/models/{model_id}", response_model=ModelResponse)
def get_model(model_id: str, db: Session = Depends(get_db)):
    """获取单个模型"""
    result = db.execute(select(Model).where(Model.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelResponse(
        id=str(model.id),
        provider_id=str(model.provider_id),
        name=model.name,
        display_name=model.display_name,
        model_type=model.model_type,
        description=model.description,
        config=model.config,
        is_enabled=model.is_enabled,
        is_default=model.is_default,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


@router.post("/models", response_model=ModelResponse)
def create_model(data: ModelCreate, db: Session = Depends(get_db)):
    """创建模型"""
    # 检查提供商是否存在
    provider_result = db.execute(
        select(ModelProvider).where(ModelProvider.id == uuid.UUID(data.provider_id))
    )
    if not provider_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Provider not found")

    # 如果设置为默认模型，取消同类型其他模型的默认状态
    if data.is_default:
        db.execute(
            update(Model)
            .where(Model.model_type == data.model_type, Model.is_default == True)
            .values(is_default=False)
        )

    model = Model(**data.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return ModelResponse(
        id=str(model.id),
        provider_id=str(model.provider_id),
        name=model.name,
        display_name=model.display_name,
        model_type=model.model_type,
        description=model.description,
        config=model.config,
        is_enabled=model.is_enabled,
        is_default=model.is_default,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


@router.put("/models/{model_id}", response_model=ModelResponse)
def update_model(
    model_id: str,
    data: ModelUpdate,
    db: Session = Depends(get_db),
):
    """更新模型"""
    result = db.execute(select(Model).where(Model.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    update_data = data.model_dump(exclude_unset=True)

    # 如果设置为默认模型，取消同类型其他模型的默认状态
    if update_data.get("is_default"):
        db.execute(
            update(Model)
            .where(
                Model.model_type == model.model_type,
                Model.id != uuid.UUID(model_id),
                Model.is_default == True,
            )
            .values(is_default=False)
        )

    for key, value in update_data.items():
        setattr(model, key, value)

    db.commit()
    db.refresh(model)
    return ModelResponse(
        id=str(model.id),
        provider_id=str(model.provider_id),
        name=model.name,
        display_name=model.display_name,
        model_type=model.model_type,
        description=model.description,
        config=model.config,
        is_enabled=model.is_enabled,
        is_default=model.is_default,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


@router.delete("/models/{model_id}")
def delete_model(model_id: str, db: Session = Depends(get_db)):
    """删除模型"""
    result = db.execute(select(Model).where(Model.id == uuid.UUID(model_id)))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    db.delete(model)
    db.commit()
    return {"success": True}


# ── 默认模型配置 ──


@router.get("/default-models", response_model=DefaultModelsResponse)
def get_default_models(db: Session = Depends(get_db)):
    """获取默认模型配置"""
    # 查询默认的文生图模型
    image_result = db.execute(
        select(Model).where(
            Model.model_type == "text_to_image",
            Model.is_default == True,
            Model.is_enabled == True,
        )
    )
    image_model = image_result.scalar_one_or_none()

    # 查询默认的文生视频模型
    video_result = db.execute(
        select(Model).where(
            Model.model_type == "text_to_video",
            Model.is_default == True,
            Model.is_enabled == True,
        )
    )
    video_model = video_result.scalar_one_or_none()

    return DefaultModelsResponse(
        default_image_model_id=str(image_model.id) if image_model else None,
        default_video_model_id=str(video_model.id) if video_model else None,
    )


@router.put("/default-models", response_model=DefaultModelsResponse)
def update_default_models(data: DefaultModelsUpdate, db: Session = Depends(get_db)):
    """更新默认模型配置"""
    # 更新默认文生图模型
    if data.default_image_model_id is not None:
        # 取消当前默认
        db.execute(
            update(Model)
            .where(
                Model.model_type == "text_to_image",
                Model.is_default == True,
            )
            .values(is_default=False)
        )
        # 设置新的默认
        if data.default_image_model_id:
            model_result = db.execute(
                select(Model).where(
                    Model.id == uuid.UUID(data.default_image_model_id)
                )
            )
            model = model_result.scalar_one_or_none()
            if model:
                model.is_default = True

    # 更新默认文生视频模型
    if data.default_video_model_id is not None:
        # 取消当前默认
        db.execute(
            update(Model)
            .where(
                Model.model_type == "text_to_video",
                Model.is_default == True,
            )
            .values(is_default=False)
        )
        # 设置新的默认
        if data.default_video_model_id:
            model_result = db.execute(
                select(Model).where(
                    Model.id == uuid.UUID(data.default_video_model_id)
                )
            )
            model = model_result.scalar_one_or_none()
            if model:
                model.is_default = True

    db.commit()

    # 返回更新后的配置
    return get_default_models(db)
