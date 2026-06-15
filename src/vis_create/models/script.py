"""
剧本与章节数据模型
"""

import uuid
from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base


class Script(Base):
    """剧本数据库模型"""

    __tablename__ = "scripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Chapter(Base):
    """章节数据库模型"""

    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    script_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ScriptCreate(BaseModel):
    """创建剧本请求"""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ScriptUpdate(BaseModel):
    """更新剧本请求"""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


def _uuid_to_str(v: object) -> str:
    return str(v) if isinstance(v, uuid.UUID) else v


class ScriptResponse(BaseModel):
    """剧本响应"""

    id: Annotated[str, BeforeValidator(_uuid_to_str)]
    project_id: Annotated[str, BeforeValidator(_uuid_to_str)]
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScriptListResponse(BaseModel):
    """剧本列表响应"""

    data: list[ScriptResponse]
    total: int


class ChapterCreate(BaseModel):
    """创建章节请求"""

    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = ""
    sort_order: Optional[int] = 0


class ChapterUpdate(BaseModel):
    """更新章节请求"""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    sort_order: Optional[int] = None


class ChapterResponse(BaseModel):
    """章节响应"""

    id: Annotated[str, BeforeValidator(_uuid_to_str)]
    script_id: Annotated[str, BeforeValidator(_uuid_to_str)]
    title: str
    content: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChapterListResponse(BaseModel):
    """章节列表响应"""

    data: list[ChapterResponse]
    total: int
