"""创作参数 Pydantic Schema 定义"""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class StyleEnum(str, Enum):
    """风格枚举"""

    REALISTIC = "realistic"
    ANIME = "anime"
    CARTOON = "cartoon"
    ARTISTIC = "artistic"
    CYBERPUNK = "cyberpunk"
    WATERCOLOR = "watercolor"
    OIL_PAINTING = "oil_painting"
    PIXEL = "pixel"
    MINIMALIST = "minimalist"
    VINTAGE = "vintage"


class PhotographyParams(BaseModel):
    """摄影参数"""

    lighting: Optional[str] = None
    lens: Optional[str] = None
    depth_of_field: Optional[str] = None
    composition: Optional[str] = None
    angle: Optional[str] = None


class PostProductionParams(BaseModel):
    """后期参数"""

    tone: Optional[str] = None
    saturation: Optional[str] = None
    contrast: Optional[str] = None
    mood_filter: Optional[str] = None


class DirectorParams(BaseModel):
    """导演参数（视频专用）"""

    camera_movement: Optional[str] = None
    pace: Optional[str] = None
    mood: Optional[str] = None
    scene: Optional[str] = None


class SubjectParams(BaseModel):
    """主体参数"""

    type: Optional[str] = None
    emotion: Optional[str] = None
    era: Optional[str] = None
    detail_level: Optional[str] = None


class EnvironmentParams(BaseModel):
    """环境参数"""

    weather: Optional[str] = None
    time_of_day: Optional[str] = None
    material: Optional[str] = None
    color_scheme: Optional[str] = None


class ChapterContext(BaseModel):
    """章节上下文"""

    script_title: Optional[str] = None
    chapter_title: Optional[str] = None
    chapter_content: Optional[str] = None


class CreationParameters(BaseModel):
    """创作参数完整定义"""

    style: StyleEnum = Field(default=StyleEnum.REALISTIC, description="图片风格")
    size: str = Field(default="1:1", description="图片尺寸比例")
    model_id: Optional[str] = Field(default=None, description="模型 ID")

    photography: Optional[PhotographyParams] = Field(
        default=None, description="摄影参数"
    )
    postProduction: Optional[PostProductionParams] = Field(
        default=None, description="后期参数"
    )
    director: Optional[DirectorParams] = Field(
        default=None, description="导演参数（视频专用）"
    )
    subject: Optional[SubjectParams] = Field(default=None, description="主体参数")
    environment: Optional[EnvironmentParams] = Field(
        default=None, description="环境参数"
    )

    # 项目资源
    referenceImageUrl: Optional[str] = Field(default=None, description="参考图片 URL")
    characterDescription: Optional[str] = Field(default=None, description="角色描述")
    chapterContext: Optional[Any] = Field(default=None, description="章节上下文")
