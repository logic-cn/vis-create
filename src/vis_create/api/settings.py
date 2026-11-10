"""
设置API路由

使用数据库持久化系统设置
"""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config.settings import Settings
from ..database.connection import get_db
from ..models.setting import SystemSetting
from .masking import is_masked_secret, mask_secret

logger = logging.getLogger(__name__)

router = APIRouter()

# 默认设置项定义
DEFAULT_SETTINGS = {
    "openai_model": {
        "default": "gpt-4-turbo-preview",
        "description": "OpenAI模型名称",
    },
    "video_provider": {
        "default": "happyhorse",
        "description": "视频生成提供商 (happyhorse, seedance)",
    },
    "video_api_key": {
        "default": "",
        "description": "视频生成API密钥",
    },
    "video_api_endpoint": {
        "default": "",
        "description": "视频生成API端点",
    },
    "video_model": {
        "default": "happyhorse-1.0-t2v",
        "description": "视频生成模型名称",
    },
    "output_dir": {
        "default": "./output",
        "description": "默认输出目录",
    },
    "verbose": {
        "default": "false",
        "description": "是否显示详细日志",
    },
    "log_level": {
        "default": "INFO",
        "description": "日志级别",
    },
}


class SettingsResponse(BaseModel):
    """设置响应（密钥字段始终脱敏，绝不回传明文）"""

    openai_model: str
    video_provider: str
    video_api_key: str | None
    video_api_endpoint: str
    video_model: str
    output_dir: str
    verbose: bool
    log_level: str


class SettingsUpdate(BaseModel):
    """设置更新请求"""

    openai_model: str | None = None
    video_provider: str | None = None
    video_api_key: str | None = None
    video_api_endpoint: str | None = None
    video_model: str | None = None
    output_dir: str | None = None
    verbose: bool | None = None
    log_level: str | None = None


class ApiTestRequest(BaseModel):
    """API测试请求"""

    provider: str


class ApiTestResponse(BaseModel):
    """API测试响应"""

    success: bool
    message: str


def _get_setting(db: Session, key: str) -> str:
    """从数据库获取设置值，不存在则返回默认值"""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting and setting.value is not None:
        return setting.value
    return DEFAULT_SETTINGS.get(key, {}).get("default", "")


def _set_setting(db: Session, key: str, value: str, description: str | None = None):
    """设置或更新数据库中的配置项"""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        setting.value = value
    else:
        setting = SystemSetting(
            key=key,
            value=value,
            description=description or DEFAULT_SETTINGS.get(key, {}).get("description"),
        )
        db.add(setting)


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """获取设置（video_api_key 脱敏返回，不回传明文）"""
    return SettingsResponse(
        openai_model=_get_setting(db, "openai_model"),
        video_provider=_get_setting(db, "video_provider"),
        video_api_key=mask_secret(_get_setting(db, "video_api_key")),
        video_api_endpoint=_get_setting(db, "video_api_endpoint"),
        video_model=_get_setting(db, "video_model"),
        output_dir=_get_setting(db, "output_dir"),
        verbose=_get_setting(db, "verbose").lower() == "true",
        log_level=_get_setting(db, "log_level"),
    )


@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    """更新设置（持久化到数据库）"""
    if data.openai_model is not None:
        _set_setting(db, "openai_model", data.openai_model)
    if data.video_provider is not None:
        _set_setting(db, "video_provider", data.video_provider)
    # 前端把 GET 返回的脱敏占位值原样回传时，保留数据库中的真实密钥
    if data.video_api_key is not None and not is_masked_secret(data.video_api_key):
        _set_setting(db, "video_api_key", data.video_api_key)
    if data.video_api_endpoint is not None:
        _set_setting(db, "video_api_endpoint", data.video_api_endpoint)
    if data.video_model is not None:
        _set_setting(db, "video_model", data.video_model)
    if data.output_dir is not None:
        _set_setting(db, "output_dir", data.output_dir)
    if data.verbose is not None:
        _set_setting(db, "verbose", str(data.verbose).lower())
    if data.log_level is not None:
        _set_setting(db, "log_level", data.log_level)

    db.commit()
    logger.info("Settings updated and persisted to database")

    return SettingsResponse(
        openai_model=_get_setting(db, "openai_model"),
        video_provider=_get_setting(db, "video_provider"),
        video_api_key=mask_secret(_get_setting(db, "video_api_key")),
        video_api_endpoint=_get_setting(db, "video_api_endpoint"),
        video_model=_get_setting(db, "video_model"),
        output_dir=_get_setting(db, "output_dir"),
        verbose=_get_setting(db, "verbose").lower() == "true",
        log_level=_get_setting(db, "log_level"),
    )


@router.post("/test", response_model=ApiTestResponse)
def test_api_connection(data: ApiTestRequest):
    """测试API连接"""
    settings = Settings()

    if data.provider == "openai":
        if settings.openai_api_key:
            return ApiTestResponse(success=True, message="OpenAI API key configured")
        return ApiTestResponse(success=False, message="OpenAI API key not configured")

    if data.provider in ("video", "happyhorse", "seedance"):
        if settings.video_api_key:
            return ApiTestResponse(
                success=True,
                message=f"Video API key configured (provider: {settings.video_provider})",
            )
        return ApiTestResponse(success=False, message="Video API key not configured")

    if data.provider == "stability":
        if settings.stability_api_key:
            return ApiTestResponse(success=True, message="Stability API key configured")
        return ApiTestResponse(
            success=False, message="Stability API key not configured"
        )

    return ApiTestResponse(success=False, message=f"Unknown provider: {data.provider}")
