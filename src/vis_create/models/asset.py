"""
素材数据模型
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import Column, DateTime, Enum as SQLEnum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database.connection import Base


class AssetSource(str, Enum):
    """素材来源"""

    GENERATED = "generated"
    UPLOADED = "uploaded"


class Asset(Base):
    """素材数据库模型"""

    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum("image", "video", name="asset_type"), nullable=False)
    file_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500))
    source = Column(
        SQLEnum(
            AssetSource,
            name="asset_source",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=AssetSource.UPLOADED,
        nullable=False,
    )
    original_artwork_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AssetCreate(BaseModel):
    """创建素材请求"""

    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern="^(image|video)$")
    original_artwork_id: Optional[str] = None


def _uuid_to_str(v: object) -> str:
    return str(v) if isinstance(v, uuid.UUID) else v


def _optional_uuid_to_str(v: object) -> Optional[str]:
    return str(v) if isinstance(v, uuid.UUID) else v


class AssetResponse(BaseModel):
    """素材响应"""

    id: Annotated[str, BeforeValidator(_uuid_to_str)]
    project_id: Annotated[str, BeforeValidator(_uuid_to_str)]
    name: str
    type: str
    file_path: str
    thumbnail_path: Optional[str]
    source: str
    original_artwork_id: Annotated[
        Optional[str], BeforeValidator(_optional_uuid_to_str)
    ]
    created_at: datetime

    model_config = {"from_attributes": True}


class AssetListResponse(BaseModel):
    """素材列表响应"""

    data: list[AssetResponse]
    total: int
