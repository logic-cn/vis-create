"""
场景（分镜）数据模型

用于漫画/短剧的分镜管理
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import Column, DateTime, Enum as SQLEnum, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base


class ShotType(str, Enum):
    """镜头类型"""

    EXTREME_CLOSE_UP = "extreme_close_up"  # 特写
    CLOSE_UP = "close_up"  # 近景
    MEDIUM_SHOT = "medium_shot"  # 中景
    FULL_SHOT = "full_shot"  # 全景
    LONG_SHOT = "long_shot"  # 远景
    BIRD_EYE = "bird_eye"  # 鸟瞰
    LOW_ANGLE = "low_angle"  # 仰拍
    HIGH_ANGLE = "high_angle"  # 俯拍
    DUTCH_ANGLE = "dutch_angle"  # 倾斜


class Scene(Base):
    """场景数据库模型"""

    __tablename__ = "scenes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(
        UUID(as_uuid=True), nullable=False, index=True, comment="所属章节ID"
    )
    title = Column(String(255), nullable=False, comment="场景标题")
    description = Column(Text, nullable=True, comment="场景描述")
    sort_order = Column(Integer, default=0, comment="场景顺序")
    shot_type = Column(String(50), nullable=True, comment="镜头类型")
    camera_movement = Column(
        String(100), nullable=True, comment="镜头运动（推拉摇移等）"
    )
    character_ids = Column(JSON, default=list, comment="出场角色ID列表")
    background_description = Column(Text, nullable=True, comment="背景/环境描述")
    mood = Column(String(100), nullable=True, comment="氛围/情绪")
    dialogue = Column(Text, nullable=True, comment="台词/旁白")
    artwork_id = Column(UUID(as_uuid=True), nullable=True, comment="生成的作品ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Pydantic schemas
def _uuid_to_str(v: object) -> str:
    return str(v) if isinstance(v, uuid.UUID) else v


def _optional_uuid_to_str(v: object) -> Optional[str]:
    return str(v) if isinstance(v, uuid.UUID) else v


class SceneCreate(BaseModel):
    """创建场景请求"""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sort_order: Optional[int] = 0
    shot_type: Optional[str] = None
    camera_movement: Optional[str] = None
    character_ids: list[str] = Field(default_factory=list)
    background_description: Optional[str] = None
    mood: Optional[str] = None
    dialogue: Optional[str] = None


class SceneUpdate(BaseModel):
    """更新场景请求"""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    sort_order: Optional[int] = None
    shot_type: Optional[str] = None
    camera_movement: Optional[str] = None
    character_ids: Optional[list[str]] = None
    background_description: Optional[str] = None
    mood: Optional[str] = None
    dialogue: Optional[str] = None
    artwork_id: Optional[str] = None


class SceneResponse(BaseModel):
    """场景响应"""

    id: Annotated[str, BeforeValidator(_uuid_to_str)]
    chapter_id: Annotated[str, BeforeValidator(_uuid_to_str)]
    title: str
    description: Optional[str]
    sort_order: int
    shot_type: Optional[str]
    camera_movement: Optional[str]
    character_ids: list[str] = Field(default_factory=list)
    background_description: Optional[str]
    mood: Optional[str]
    dialogue: Optional[str]
    artwork_id: Annotated[Optional[str], BeforeValidator(_optional_uuid_to_str)] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SceneListResponse(BaseModel):
    """场景列表响应"""

    data: list[SceneResponse]
    total: int


class SceneGeneratePrompt(BaseModel):
    """场景生成提示词请求"""

    character_descriptions: list[str] = Field(
        default_factory=list, description="角色描述列表"
    )
    style: Optional[str] = None
    additional_prompt: Optional[str] = None
