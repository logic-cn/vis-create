"""
模型提供商和模型配置数据模型

支持各大厂商的文生图、文生视频模型，以及本地部署模型（lm studio、ollama等）
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID

from ..database.connection import Base


class ModelType(str, Enum):
    """模型类型"""

    TEXT_TO_IMAGE = "text_to_image"  # 文生图
    TEXT_TO_VIDEO = "text_to_video"  # 文生视频
    IMAGE_TO_IMAGE = "image_to_image"  # 图生图
    IMAGE_TO_VIDEO = "image_to_video"  # 图生视频


class ProviderType(str, Enum):
    """提供商类型"""

    CLOUD = "cloud"  # 云服务商
    LOCAL = "local"  # 本地部署


# SQLAlchemy 模型 - 使用 String 类型存储枚举值
class ModelProvider(Base):
    """模型提供商表"""

    __tablename__ = "model_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, comment="提供商名称")
    display_name = Column(String(200), nullable=False, comment="显示名称")
    provider_type = Column(
        String(20), nullable=False, default="cloud", comment="提供商类型"
    )
    base_url = Column(String(500), nullable=True, comment="API基础URL")
    api_key = Column(Text, nullable=True, comment="API密钥（加密存储）")
    description = Column(Text, nullable=True, comment="描述")
    icon = Column(String(100), nullable=True, comment="图标标识")
    is_enabled = Column(Boolean, default=True, nullable=False, comment="是否启用")
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Model(Base):
    """模型表"""

    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), nullable=False, comment="提供商ID")
    name = Column(String(200), nullable=False, comment="模型名称")
    display_name = Column(String(300), nullable=False, comment="显示名称")
    model_type = Column(String(30), nullable=False, comment="模型类型")
    description = Column(Text, nullable=True, comment="模型描述")
    config = Column(Text, nullable=True, comment="模型配置（JSON格式）")
    is_enabled = Column(Boolean, default=True, nullable=False, comment="是否启用")
    is_default = Column(
        Boolean, default=False, nullable=False, comment="是否为默认模型"
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# Pydantic 模型
class ModelProviderBase(BaseModel):
    """模型提供商基础模型"""

    name: str = Field(..., min_length=1, max_length=100, description="提供商名称")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名称")
    provider_type: str = Field(default="cloud", description="提供商类型")
    base_url: Optional[str] = Field(None, max_length=500, description="API基础URL")
    api_key: Optional[str] = Field(None, description="API密钥")
    description: Optional[str] = Field(None, description="描述")
    icon: Optional[str] = Field(None, max_length=100, description="图标标识")
    is_enabled: bool = Field(default=True, description="是否启用")


class ModelProviderCreate(ModelProviderBase):
    """创建模型提供商请求"""

    pass


class ModelProviderUpdate(BaseModel):
    """更新模型提供商请求"""

    display_name: Optional[str] = Field(None, max_length=200, description="显示名称")
    base_url: Optional[str] = Field(None, max_length=500, description="API基础URL")
    api_key: Optional[str] = Field(None, description="API密钥")
    description: Optional[str] = Field(None, description="描述")
    icon: Optional[str] = Field(None, max_length=100, description="图标标识")
    is_enabled: Optional[bool] = Field(None, description="是否启用")


class ModelProviderResponse(ModelProviderBase):
    """模型提供商响应"""

    id: str = Field(..., description="提供商ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class ModelBase(BaseModel):
    """模型基础模型"""

    provider_id: str = Field(..., description="提供商ID")
    name: str = Field(..., min_length=1, max_length=200, description="模型名称")
    display_name: str = Field(..., min_length=1, max_length=300, description="显示名称")
    model_type: str = Field(..., description="模型类型")
    description: Optional[str] = Field(None, description="模型描述")
    config: Optional[str] = Field(None, description="模型配置（JSON格式）")
    is_enabled: bool = Field(default=True, description="是否启用")
    is_default: bool = Field(default=False, description="是否为默认模型")


class ModelCreate(ModelBase):
    """创建模型请求"""

    pass


class ModelUpdate(BaseModel):
    """更新模型请求"""

    display_name: Optional[str] = Field(None, max_length=300, description="显示名称")
    description: Optional[str] = Field(None, description="模型描述")
    config: Optional[str] = Field(None, description="模型配置（JSON格式）")
    is_enabled: Optional[bool] = Field(None, description="是否启用")
    is_default: Optional[bool] = Field(None, description="是否为默认模型")


class ModelResponse(ModelBase):
    """模型响应"""

    id: str = Field(..., description="模型ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class ModelProviderListResponse(BaseModel):
    """模型提供商列表响应"""

    data: list[ModelProviderResponse]
    total: int


class ModelListResponse(BaseModel):
    """模型列表响应"""

    data: list[ModelResponse]
    total: int


class DefaultModelsResponse(BaseModel):
    """默认模型配置响应"""

    default_image_model_id: Optional[str] = Field(None, description="默认文生图模型ID")
    default_video_model_id: Optional[str] = Field(
        None, description="默认文生视频模型ID"
    )


class DefaultModelsUpdate(BaseModel):
    """更新默认模型配置"""

    default_image_model_id: Optional[str] = Field(None, description="默认文生图模型ID")
    default_video_model_id: Optional[str] = Field(
        None, description="默认文生视频模型ID"
    )
