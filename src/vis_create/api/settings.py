"""
设置API路由
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config.settings import Settings
from ..database.connection import get_db

router = APIRouter()


class SettingsResponse(BaseModel):
    """设置响应"""

    openai_model: str
    video_model: str
    output_dir: str
    verbose: bool
    log_level: str


class SettingsUpdate(BaseModel):
    """设置更新请求"""

    openai_model: str | None = None
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


@router.get("", response_model=SettingsResponse)
def get_settings():
    """获取设置"""
    settings = Settings()
    return SettingsResponse(
        openai_model=settings.openai_model,
        video_model=settings.video_model,
        output_dir=settings.output_dir,
        verbose=settings.verbose,
        log_level=settings.log_level,
    )


@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate):
    """更新设置"""
    # 注意：这里简化处理，实际应该持久化到配置文件或数据库
    settings = Settings()

    if data.openai_model is not None:
        settings.openai_model = data.openai_model
    if data.video_model is not None:
        settings.video_model = data.video_model
    if data.output_dir is not None:
        settings.output_dir = data.output_dir
    if data.verbose is not None:
        settings.verbose = data.verbose
    if data.log_level is not None:
        settings.log_level = data.log_level

    return SettingsResponse(
        openai_model=settings.openai_model,
        video_model=settings.video_model,
        output_dir=settings.output_dir,
        verbose=settings.verbose,
        log_level=settings.log_level,
    )


@router.post("/test", response_model=ApiTestResponse)
def test_api_connection(data: ApiTestRequest):
    """测试API连接"""
    settings = Settings()

    if data.provider == "openai":
        if settings.openai_api_key:
            return ApiTestResponse(success=True, message="OpenAI API key configured")
        return ApiTestResponse(success=False, message="OpenAI API key not configured")

    if data.provider == "video":
        if settings.video_api_key:
            return ApiTestResponse(success=True, message="Video API key configured")
        return ApiTestResponse(success=False, message="Video API key not configured")

    if data.provider == "stability":
        if settings.stability_api_key:
            return ApiTestResponse(success=True, message="Stability API key configured")
        return ApiTestResponse(success=False, message="Stability API key not configured")

    return ApiTestResponse(success=False, message=f"Unknown provider: {data.provider}")
