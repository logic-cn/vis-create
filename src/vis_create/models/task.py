"""
任务数据模型
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Enum as SQLEnum, Float, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base


class TaskStatus(str, Enum):
    """任务状态枚举"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


# SQLAlchemy模型
class Task(Base):
    """任务数据库模型"""

    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artwork_id = Column(UUID(as_uuid=True), ForeignKey("artworks.id"), nullable=True)
    type = Column(SQLEnum("image", "video", name="task_type"), nullable=False)
    status = Column(
        SQLEnum(TaskStatus, name="task_status"),
        default=TaskStatus.PENDING,
        nullable=False,
    )
    progress = Column(Float, default=0.0)
    prompt = Column(Text, nullable=False)
    parameters = Column(JSON)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Pydantic schemas
class TaskCreate(BaseModel):
    """创建任务请求"""

    type: str = Field(..., pattern="^(image|video)$")
    prompt: str = Field(..., min_length=1)
    parameters: Optional[dict] = None


class TaskResponse(BaseModel):
    """任务响应"""

    id: str
    artwork_id: Optional[str]
    type: str
    status: TaskStatus
    progress: float
    prompt: str
    parameters: Optional[dict]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """任务列表响应"""

    data: list[TaskResponse]
    total: int


class TaskProgressEvent(BaseModel):
    """任务进度SSE事件"""

    task_id: str
    status: TaskStatus
    progress: float
    message: Optional[str] = None
