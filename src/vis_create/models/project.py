"""
项目数据模型
"""

import uuid
from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base


class Project(Base):
    """项目数据库模型"""

    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    cover_path = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ProjectCreate(BaseModel):
    """创建项目请求"""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    """更新项目请求"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    cover_path: Optional[str] = None


def _uuid_to_str(v: object) -> str:
    return str(v) if isinstance(v, uuid.UUID) else v


class ProjectResponse(BaseModel):
    """项目响应"""

    id: Annotated[str, BeforeValidator(_uuid_to_str)]
    name: str
    description: Optional[str]
    cover_path: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """项目列表响应"""

    data: list[ProjectResponse]
    total: int
    page: int
    limit: int
