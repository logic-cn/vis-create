"""
系统设置数据模型

存储应用配置项到数据库，支持持久化
"""

from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, String, Text, func

from ..database.connection import Base


# SQLAlchemy 模型
class SystemSetting(Base):
    """系统设置表"""

    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, comment="设置键名")
    value = Column(Text, nullable=True, comment="设置值")
    description = Column(Text, nullable=True, comment="设置描述")
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# Pydantic 模型
class SystemSettingResponse(BaseModel):
    """系统设置响应"""

    key: str
    value: str | None = None
    description: str | None = None
    updated_at: datetime


class SystemSettingUpdate(BaseModel):
    """系统设置更新请求"""

    value: str = Field(..., description="设置值")
