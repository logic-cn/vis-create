"""
角色数据模型
"""

import uuid
from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import Column, DateTime, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base


class Character(Base):
    """角色数据库模型"""

    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    personality = Column(Text)
    description = Column(Text)
    avatar_path = Column(String(500))
    # 角色一致性相关字段
    reference_images = Column(
        JSON, default=list, comment="角色参考图列表（MinIO对象名）"
    )
    locked_avatar_id = Column(
        UUID(as_uuid=True), nullable=True, comment="锁定的形象作品ID"
    )
    visual_features = Column(
        Text, nullable=True, comment="角色视觉特征描述（用于prompt）"
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CharacterCreate(BaseModel):
    """创建角色请求"""

    name: str = Field(..., min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=0, le=200)
    personality: Optional[str] = None
    description: Optional[str] = None


class CharacterUpdate(BaseModel):
    """更新角色请求"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=0, le=200)
    personality: Optional[str] = None
    description: Optional[str] = None
    avatar_path: Optional[str] = None
    visual_features: Optional[str] = None


class CharacterLockAvatar(BaseModel):
    """锁定角色形象请求"""

    artwork_id: str = Field(..., description="要锁定的作品ID")


def _uuid_to_str(v: object) -> str:
    return str(v) if isinstance(v, uuid.UUID) else v


def _optional_uuid_to_str(v: object) -> Optional[str]:
    return str(v) if isinstance(v, uuid.UUID) else v


class CharacterResponse(BaseModel):
    """角色响应"""

    id: Annotated[str, BeforeValidator(_uuid_to_str)]
    project_id: Annotated[str, BeforeValidator(_uuid_to_str)]
    name: str
    age: Optional[int]
    personality: Optional[str]
    description: Optional[str]
    avatar_path: Optional[str]
    reference_images: list[str] = Field(default_factory=list)
    locked_avatar_id: Annotated[
        Optional[str], BeforeValidator(_optional_uuid_to_str)
    ] = None
    visual_features: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CharacterListResponse(BaseModel):
    """角色列表响应"""

    data: list[CharacterResponse]
    total: int
