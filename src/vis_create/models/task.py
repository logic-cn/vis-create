"""
任务数据模型
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base
from .creation_params import CreationParameters


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
    artwork_id = Column(UUID(as_uuid=True), nullable=True)
    project_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    type = Column(SQLEnum("image", "video", name="task_type"), nullable=False)
    status = Column(
        SQLEnum(
            TaskStatus,
            name="task_status",
            values_callable=lambda obj: [e.value for e in obj],
        ),
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
    parameters: Optional[CreationParameters] = None
    project_id: Optional[str] = None


def _uuid_to_str(v: object) -> str:
    return str(v) if isinstance(v, uuid.UUID) else v


def _optional_uuid_to_str(v: object) -> Optional[str]:
    return str(v) if isinstance(v, uuid.UUID) else v


class TaskResponse(BaseModel):
    """任务响应"""

    id: Annotated[str, BeforeValidator(_uuid_to_str)]
    artwork_id: Annotated[Optional[str], BeforeValidator(_optional_uuid_to_str)]
    project_id: Annotated[Optional[str], BeforeValidator(_optional_uuid_to_str)]
    type: str
    status: TaskStatus
    progress: float
    prompt: str
    parameters: Optional[dict]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


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
