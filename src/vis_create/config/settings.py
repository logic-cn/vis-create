"""
配置管理

管理项目的所有配置项，包括API密钥、模型设置等
"""

import os
from typing import Optional

from pydantic import BaseModel, Field
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()


class Settings(BaseModel):
    """项目配置"""

    # OpenAI配置
    openai_api_key: Optional[str] = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY"),
        description="OpenAI API密钥",
    )
    openai_model: str = Field(
        default="gpt-4-turbo-preview",
        description="OpenAI模型名称",
    )

    # 视频生成API配置
    video_api_key: Optional[str] = Field(
        default_factory=lambda: os.getenv("VIDEO_API_KEY"),
        description="视频生成API密钥",
    )
    video_api_endpoint: str = Field(
        default_factory=lambda: os.getenv("VIDEO_API_ENDPOINT", "https://api.runway.com/v1/generate"),
        description="视频生成API端点",
    )
    video_model: str = Field(
        default_factory=lambda: os.getenv("VIDEO_MODEL", "gen-2"),
        description="视频生成模型名称",
    )

    # Stability AI配置（可选）
    stability_api_key: Optional[str] = Field(
        default_factory=lambda: os.getenv("STABILITY_API_KEY"),
        description="Stability AI API密钥",
    )

    # 应用配置
    output_dir: str = Field(
        default_factory=lambda: os.getenv("OUTPUT_DIR", "./output"),
        description="默认输出目录",
    )
    verbose: bool = Field(
        default_factory=lambda: os.getenv("VERBOSE", "false").lower() == "true",
        description="是否显示详细日志",
    )
    log_level: str = Field(
        default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"),
        description="日志级别",
    )

    # 文件配置
    max_file_size_mb: int = Field(
        default=100,
        description="最大文件大小（MB）",
    )
    supported_image_formats: list = Field(
        default=[".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"],
        description="支持的图片格式",
    )
    supported_video_formats: list = Field(
        default=[".mp4", ".avi", ".mov", ".mkv", ".webm"],
        description="支持的视频格式",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def validate_api_keys(self) -> dict:
        """
        验证API密钥是否已配置

        Returns:
            dict: 验证结果
        """
        results = {
            "openai": bool(self.openai_api_key),
            "video": bool(self.video_api_key),
            "stability": bool(self.stability_api_key),
        }
        return results

    def get_missing_keys(self) -> list:
        """
        获取未配置的API密钥

        Returns:
            list: 未配置的密钥名称
        """
        validation = self.validate_api_keys()
        return [key for key, configured in validation.items() if not configured]
