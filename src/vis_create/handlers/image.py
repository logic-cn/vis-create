"""
图片处理器

提供图片文件的处理和分析能力
"""

import os
from typing import Any, Dict, Optional

from PIL import Image


class ImageHandler:
    """图片处理器"""

    def get_info(self, image_path: str) -> Dict[str, Any]:
        """
        获取图片信息

        Args:
            image_path: 图片路径

        Returns:
            Dict[str, Any]: 图片信息
        """
        with Image.open(image_path) as img:
            # 获取文件大小
            file_size = os.path.getsize(image_path)

            return {
                "width": img.width,
                "height": img.height,
                "format": img.format,
                "mode": img.mode,
                "size_bytes": file_size,
                "size_mb": file_size / (1024 * 1024),
            }

    def resize(
        self,
        image_path: str,
        width: int,
        height: int,
        output_path: Optional[str] = None,
    ) -> str:
        """
        调整图片大小

        Args:
            image_path: 输入图片路径
            width: 目标宽度
            height: 目标高度
            output_path: 输出路径（可选，默认覆盖原图）

        Returns:
            str: 输出图片路径
        """
        with Image.open(image_path) as img:
            resized = img.resize((width, height), Image.Resampling.LANCZOS)

            if output_path is None:
                output_path = image_path

            resized.save(output_path)
            return output_path

    def crop(
        self,
        image_path: str,
        left: int,
        top: int,
        right: int,
        bottom: int,
        output_path: Optional[str] = None,
    ) -> str:
        """
        裁剪图片

        Args:
            image_path: 输入图片路径
            left: 左边界
            top: 上边界
            right: 右边界
            bottom: 下边界
            output_path: 输出路径（可选，默认覆盖原图）

        Returns:
            str: 输出图片路径
        """
        with Image.open(image_path) as img:
            cropped = img.crop((left, top, right, bottom))

            if output_path is None:
                output_path = image_path

            cropped.save(output_path)
            return output_path

    def convert_format(
        self,
        image_path: str,
        target_format: str,
        output_path: Optional[str] = None,
    ) -> str:
        """
        转换图片格式

        Args:
            image_path: 输入图片路径
            target_format: 目标格式（如 "PNG", "JPEG", "WEBP"）
            output_path: 输出路径（可选）

        Returns:
            str: 输出图片路径
        """
        with Image.open(image_path) as img:
            # 如果转换为JPEG且图片有alpha通道，需要转换
            if target_format.upper() == "JPEG" and img.mode in ("RGBA", "LA"):
                img = img.convert("RGB")

            if output_path is None:
                # 生成新的文件名
                base_name = os.path.splitext(image_path)[0]
                output_path = f"{base_name}.{target_format.lower()}"

            img.save(output_path, format=target_format.upper())
            return output_path

    def add_watermark(
        self,
        image_path: str,
        text: str,
        position: str = "bottom-right",
        output_path: Optional[str] = None,
    ) -> str:
        """
        添加文字水印

        Args:
            image_path: 输入图片路径
            text: 水印文字
            position: 位置（top-left, top-right, bottom-left, bottom-right, center）
            output_path: 输出路径（可选）

        Returns:
            str: 输出图片路径
        """
        from PIL import ImageDraw, ImageFont

        with Image.open(image_path) as img:
            # 创建绘图对象
            draw = ImageDraw.Draw(img)

            # 尝试加载字体
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
            except OSError:
                font = ImageFont.load_default()

            # 获取文字大小
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            # 计算位置
            margin = 20
            if position == "top-left":
                x, y = margin, margin
            elif position == "top-right":
                x, y = img.width - text_width - margin, margin
            elif position == "bottom-left":
                x, y = margin, img.height - text_height - margin
            elif position == "bottom-right":
                x, y = img.width - text_width - margin, img.height - text_height - margin
            else:  # center
                x = (img.width - text_width) // 2
                y = (img.height - text_height) // 2

            # 绘制文字（带阴影效果）
            draw.text((x + 2, y + 2), text, font=font, fill="black")
            draw.text((x, y), text, font=font, fill="white")

            if output_path is None:
                output_path = image_path

            img.save(output_path)
            return output_path

    def create_thumbnail(
        self,
        image_path: str,
        size: tuple = (256, 256),
        output_path: Optional[str] = None,
    ) -> str:
        """
        创建缩略图

        Args:
            image_path: 输入图片路径
            size: 缩略图尺寸
            output_path: 输出路径（可选）

        Returns:
            str: 输出图片路径
        """
        with Image.open(image_path) as img:
            img.thumbnail(size, Image.Resampling.LANCZOS)

            if output_path is None:
                base_name = os.path.splitext(image_path)[0]
                output_path = f"{base_name}_thumb.png"

            img.save(output_path)
            return output_path
