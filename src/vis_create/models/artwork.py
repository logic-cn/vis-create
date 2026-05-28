"""
作品数据模型
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, Enum, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base


# SQLAlchemy模型
class Artwork(Base):
    """作品数据库模型"""

    __tablename__ = "artworks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(Enum("image", "video", name="artwork_type"), nullable=False)
    file_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500))
    prompt = Column(Text, nullable=False)
    style = Column(String(100))
    parameters = Column(JSON)
    is_favorite = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# Pydantic schemas
class ArtworkCreate(BaseModel):
    """创建作品请求"""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: str = Field(..., pattern="^(image|video)$")
    prompt: str = Field(..., min_length=1)
    style: Optional[str] = None
    parameters: Optional[dict] = None
    tags: list[str] = Field(default_factory=list)


class ArtworkUpdate(BaseModel):
    """更新作品请求"""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    style: Optional[str] = None
    parameters: Optional[dict] = None
    is_favorite: Optional[bool] = None
    tags: Optional[list[str]] = None


class ArtworkResponse(BaseModel):
    """作品响应"""

    id: str
    title: str
    description: Optional[str]
    type: str
    file_path: str
    thumbnail_path: Optional[str]
    prompt: str
    style: Optional[str]
    parameters: Optional[dict]
    is_favorite: bool
    tags: list[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArtworkListResponse(BaseModel):
    """作品列表响应"""

    data: list[ArtworkResponse]
    total: int
    page: int
    limit: int
