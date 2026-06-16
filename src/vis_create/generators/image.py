"""
图片生成器

使用AI模型生成和编辑图片
支持：DALL-E 3 文生图、DALL-E 2 图片编辑、参考图风格迁移
"""

import os
import tempfile
from dataclasses import dataclass
from typing import Optional

import httpx

from ..config.settings import Settings


@dataclass
class ImageResult:
    """图片生成结果"""

    success: bool
    file_path: Optional[str] = None
    error: Optional[str] = None


class ImageGenerator:
    """图片生成器"""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = httpx.AsyncClient()
        self.api_base = "https://api.openai.com/v1"

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def generate_async(
        self,
        prompt: str,
        output_dir: str = "./output",
        style: str = "realistic",
        size: str = "1024x1024",
        reference_image_url: Optional[str] = None,
    ) -> ImageResult:
        """
        异步生成图片

        Args:
            prompt: 已由 PromptBuilder 构建好的完整提示词
            output_dir: 输出目录
            style: 图片风格（用于日志记录）
            size: 图片尺寸
            reference_image_url: 参考图URL（可选）

        Returns:
            ImageResult: 生成结果
        """
        try:
            # 如果有参考图，尝试使用 DALL-E 2 的 variations API
            if reference_image_url:
                result = await self._generate_with_reference(
                    prompt, size, reference_image_url
                )
            else:
                # 使用 DALL-E 3 文生图
                result = await self._call_image_api(prompt, size)

            if not result.success:
                return ImageResult(success=False, error=result.error)

            # 保存到指定目录
            file_path = await self._save_from_url(result.file_path, output_dir)
            return ImageResult(success=True, file_path=file_path)

        except Exception as e:
            return ImageResult(success=False, error=str(e))

    def generate(
        self,
        prompt: str,
        output_dir: str = "./output",
        style: str = "realistic",
        size: str = "1024x1024",
        reference_image_url: Optional[str] = None,
    ) -> ImageResult:
        """
        同步生成图片

        Args:
            prompt: 已由 PromptBuilder 构建好的完整提示词
            output_dir: 输出目录
            style: 图片风格
            size: 图片尺寸
            reference_image_url: 参考图URL（可选）

        Returns:
            ImageResult: 生成结果
        """
        import asyncio

        return asyncio.run(
            self.generate_async(prompt, output_dir, style, size, reference_image_url)
        )

    async def edit_async(
        self,
        image_path: str,
        instruction: str,
        output_path: Optional[str] = None,
        mask_path: Optional[str] = None,
    ) -> ImageResult:
        """
        异步编辑图片

        使用 OpenAI DALL-E 2 的 images.edit API

        Args:
            image_path: 原始图片路径
            instruction: 编辑指令（描述要修改的内容）
            output_path: 输出路径（可选）
            mask_path: 蒙版路径（可选，白色区域为编辑区域）

        Returns:
            ImageResult: 编辑结果
        """
        if not self.settings.openai_api_key:
            return ImageResult(success=False, error="未配置OpenAI API密钥")

        try:
            # 验证图片文件存在
            if not os.path.exists(image_path):
                return ImageResult(success=False, error=f"图片文件不存在: {image_path}")

            # 读取原始图片
            with open(image_path, "rb") as f:
                image_data = f.read()

            # 准备蒙版（如果没有提供，创建一个全白蒙版，表示编辑整个图片）
            mask_data = None
            if mask_path and os.path.exists(mask_path):
                with open(mask_path, "rb") as f:
                    mask_data = f.read()

            # 调用 OpenAI images.edit API
            result = await self._call_edit_api(image_data, instruction, mask_data)

            if not result.success:
                return ImageResult(success=False, error=result.error)

            # 保存结果
            if output_path:
                # 使用指定路径
                os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
                with open(output_path, "wb") as f:
                    # 从URL下载图片
                    img_response = await self.client.get(result.file_path, timeout=60.0)
                    f.write(img_response.content)
                return ImageResult(success=True, file_path=output_path)
            else:
                # 保存到临时文件
                file_path = self._save_from_url(
                    result.file_path, self.settings.output_dir
                )
                return ImageResult(success=True, file_path=file_path)

        except Exception as e:
            return ImageResult(success=False, error=str(e))

    def edit(
        self,
        image_path: str,
        instruction: str,
        output_path: Optional[str] = None,
        mask_path: Optional[str] = None,
    ) -> ImageResult:
        """
        同步编辑图片

        Args:
            image_path: 原始图片路径
            instruction: 编辑指令
            output_path: 输出路径（可选）
            mask_path: 蒙版路径（可选）

        Returns:
            ImageResult: 编辑结果
        """
        import asyncio

        return asyncio.run(
            self.edit_async(image_path, instruction, output_path, mask_path)
        )

    async def _call_image_api(self, prompt: str, size: str) -> ImageResult:
        """调用 DALL-E 3 文生图 API"""
        if not self.settings.openai_api_key:
            return ImageResult(success=False, error="未配置OpenAI API密钥")

        try:
            # DALL-E 3 支持的尺寸：1024x1024, 1792x1024, 1024x1792
            dalle_size = self._convert_size(size)

            response = await self.client.post(
                f"{self.api_base}/images/generations",
                headers={
                    "Authorization": f"Bearer {self.settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "size": dalle_size,
                    "quality": "standard",
                    "n": 1,
                },
                timeout=120.0,
            )

            if response.status_code != 200:
                error_detail = response.text
                return ImageResult(success=False, error=f"API调用失败: {error_detail}")

            data = response.json()
            image_url = data["data"][0]["url"]

            return ImageResult(success=True, file_path=image_url)

        except Exception as e:
            return ImageResult(success=False, error=str(e))

    async def _generate_with_reference(
        self, prompt: str, size: str, reference_image_url: str
    ) -> ImageResult:
        """
        使用参考图生成图片

        策略：使用 DALL-E 2 的 variations API 生成相似风格的图片
        """
        if not self.settings.openai_api_key:
            return ImageResult(success=False, error="未配置OpenAI API密钥")

        try:
            # 下载参考图
            ref_response = await self.client.get(reference_image_url, timeout=30.0)
            if ref_response.status_code != 200:
                # 如果下载失败，回退到普通生成
                return await self._call_image_api(prompt, size)

            ref_data = ref_response.content

            # 使用 DALL-E 2 的 variations API
            # 注意：此 API 需要 PNG 格式，512x512 或 256x256
            files = {"image": ("reference.png", ref_data, "image/png")}
            headers = {
                "Authorization": f"Bearer {self.settings.openai_api_key}",
            }

            response = await self.client.post(
                f"{self.api_base}/images/variations",
                headers=headers,
                files=files,
                data={"n": 1, "size": "1024x1024"},
                timeout=120.0,
            )

            if response.status_code != 200:
                # 如果 variations API 失败，回退到普通生成
                # 在 prompt 中添加参考图描述
                enhanced_prompt = f"{prompt}, in the style of the reference image"
                return await self._call_image_api(enhanced_prompt, size)

            data = response.json()
            image_url = data["data"][0]["url"]

            return ImageResult(success=True, file_path=image_url)

        except Exception as e:
            # 出错时回退到普通生成
            return await self._call_image_api(prompt, size)

    async def _call_edit_api(
        self,
        image_data: bytes,
        instruction: str,
        mask_data: Optional[bytes] = None,
    ) -> ImageResult:
        """
        调用 OpenAI DALL-E 2 图片编辑 API

        Args:
            image_data: 原始图片数据（PNG格式，512x512 或 1024x1024）
            instruction: 编辑指令
            mask_data: 蒙版数据（可选，PNG格式，白色区域为编辑区域）
        """
        if not self.settings.openai_api_key:
            return ImageResult(success=False, error="未配置OpenAI API密钥")

        try:
            headers = {
                "Authorization": f"Bearer {self.settings.openai_api_key}",
            }

            # 准备文件
            files = {
                "image": ("image.png", image_data, "image/png"),
            }

            # 如果有蒙版，添加到请求
            if mask_data:
                files["mask"] = ("mask.png", mask_data, "image/png")

            # 准备表单数据
            data = {
                "prompt": instruction,
                "n": 1,
                "size": "1024x1024",
            }

            response = await self.client.post(
                f"{self.api_base}/images/edits",
                headers=headers,
                files=files,
                data=data,
                timeout=120.0,
            )

            if response.status_code != 200:
                error_detail = response.text
                return ImageResult(
                    success=False, error=f"图片编辑API调用失败: {error_detail}"
                )

            result = response.json()
            image_url = result["data"][0]["url"]

            return ImageResult(success=True, file_path=image_url)

        except Exception as e:
            return ImageResult(success=False, error=str(e))

    def _convert_size(self, size: str) -> str:
        """
        将各种尺寸格式转换为 DALL-E 3 支持的格式

        DALL-E 3 支持：1024x1024, 1792x1024, 1024x1792
        """
        size_map = {
            "1:1": "1024x1024",
            "16:9": "1792x1024",
            "9:16": "1024x1792",
            "4:3": "1024x1024",
            "3:4": "1024x1024",
            "3:2": "1792x1024",
            "2:3": "1024x1792",
            "21:9": "1792x1024",
        }

        # 如果是比例格式，转换为像素
        if size in size_map:
            return size_map[size]

        # 如果已经是像素格式，验证是否支持
        if size in ["1024x1024", "1792x1024", "1024x1792"]:
            return size

        # 默认返回 1024x1024
        return "1024x1024"

    async def _save_from_url(self, url: str, output_dir: str) -> str:
        """从URL下载并保存图片"""
        import hashlib
        from datetime import datetime

        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        filename = f"image_{timestamp}_{url_hash}.png"

        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)

        # 下载并保存
        file_path = os.path.join(output_dir, filename)
        response = await self.client.get(url, timeout=60.0)

        with open(file_path, "wb") as f:
            f.write(response.content)

        return file_path

    def _save_image(self, image_data: bytes, output_dir: str, prompt: str) -> str:
        """保存图片到本地"""
        import hashlib
        from datetime import datetime

        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:8]
        filename = f"image_{timestamp}_{prompt_hash}.png"

        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)

        # 保存图片
        file_path = os.path.join(output_dir, filename)
        with open(file_path, "wb") as f:
            f.write(image_data)

        return file_path

    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()
