"""
视频生成器

支持多个视频生成 API 提供商：
- HappyHorse (阿里云百炼)
- Seedance (字节跳动火山引擎)
"""

import asyncio
import hashlib
import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

import httpx

from ..config.settings import Settings

logger = logging.getLogger(__name__)


class VideoProvider(str, Enum):
    """视频生成提供商"""

    HAPPYHORSE = "happyhorse"
    SEEDANCE = "seedance"


@dataclass
class VideoResult:
    """视频生成结果"""

    success: bool
    file_path: Optional[str] = None
    error: Optional[str] = None


class BaseVideoProvider(ABC):
    """视频生成提供商基类"""

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=300.0)

    @abstractmethod
    async def create_task(
        self,
        prompt: str,
        duration: int = 5,
        resolution: str = "720P",
        ratio: str = "16:9",
    ) -> dict:
        """创建视频生成任务

        Returns:
            dict: {"task_id": str, "success": bool, "error": str | None}
        """
        pass

    @abstractmethod
    async def query_task(self, task_id: str) -> dict:
        """查询任务状态

        Returns:
            dict: {
                "status": str,  # PENDING, RUNNING, SUCCEEDED, FAILED
                "video_url": str | None,
                "error": str | None
            }
        """
        pass

    async def generate(
        self,
        prompt: str,
        duration: int = 5,
        resolution: str = "720P",
        ratio: str = "16:9",
        max_wait: int = 600,
        poll_interval: int = 15,
    ) -> dict:
        """生成视频（完整流程：创建任务 -> 轮询结果）

        Args:
            prompt: 提示词
            duration: 视频时长（秒）
            resolution: 分辨率
            ratio: 宽高比
            max_wait: 最大等待时间（秒）
            poll_interval: 轮询间隔（秒）

        Returns:
            dict: {"success": bool, "video_url": str | None, "error": str | None}
        """
        # 创建任务
        result = await self.create_task(prompt, duration, resolution, ratio)
        if not result["success"]:
            return result

        task_id = result["task_id"]
        logger.info("Video task created: %s", task_id)

        # 轮询结果
        elapsed = 0
        while elapsed < max_wait:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            query_result = await self.query_task(task_id)
            status = query_result["status"]

            if status == "SUCCEEDED":
                logger.info("Video task succeeded: %s", task_id)
                return {
                    "success": True,
                    "video_url": query_result["video_url"],
                }
            elif status in ("FAILED", "CANCELED"):
                error = query_result.get("error", "任务失败")
                logger.error("Video task failed: %s - %s", task_id, error)
                return {"success": False, "error": error}
            else:
                logger.debug(
                    "Video task %s status: %s, elapsed: %ds", task_id, status, elapsed
                )

        return {"success": False, "error": f"视频生成超时（超过{max_wait}秒）"}

    async def close(self):
        """关闭 HTTP 客户端"""
        await self.client.aclose()


class HappyHorseProvider(BaseVideoProvider):
    """阿里云百炼 HappyHorse 视频生成提供商

    API 文档: https://help.aliyun.com/zh/model-studio/happyhorse-text-to-video-api-reference
    """

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url)
        self.base_url = base_url or "https://dashscope.aliyuncs.com"

    async def create_task(
        self,
        prompt: str,
        duration: int = 5,
        resolution: str = "720P",
        ratio: str = "16:9",
    ) -> dict:
        """创建 HappyHorse 视频生成任务"""
        try:
            url = f"{self.base_url}/api/v1/services/aigc/video-generation/video-synthesis"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "X-DashScope-Async": "enable",
            }
            payload = {
                "model": "happyhorse-1.0-t2v",
                "input": {
                    "prompt": prompt,
                },
                "parameters": {
                    "resolution": resolution,
                    "ratio": ratio,
                    "duration": min(max(duration, 3), 15),  # 限制在 3-15 秒
                    "watermark": False,
                },
            }

            response = await self.client.post(
                url, headers=headers, json=payload, timeout=60.0
            )

            if response.status_code != 200:
                error_msg = response.text
                logger.error("HappyHorse create task failed: %s", error_msg)
                return {"success": False, "error": f"创建任务失败: {error_msg}"}

            data = response.json()
            output = data.get("output", {})
            task_id = output.get("task_id")

            if not task_id:
                return {"success": False, "error": "未获取到任务ID"}

            return {"success": True, "task_id": task_id}

        except Exception as e:
            logger.exception("HappyHorse create task error")
            return {"success": False, "error": str(e)}

    async def query_task(self, task_id: str) -> dict:
        """查询 HappyHorse 任务状态"""
        try:
            url = f"{self.base_url}/api/v1/tasks/{task_id}"
            headers = {"Authorization": f"Bearer {self.api_key}"}

            response = await self.client.get(url, headers=headers, timeout=30.0)

            if response.status_code != 200:
                return {"status": "FAILED", "error": f"查询失败: {response.text}"}

            data = response.json()
            output = data.get("output", {})
            status = output.get("task_status", "UNKNOWN")
            video_url = output.get("video_url")
            error = output.get("message")

            return {
                "status": status,
                "video_url": video_url,
                "error": error,
            }

        except Exception as e:
            logger.exception("HappyHorse query task error")
            return {"status": "FAILED", "error": str(e)}


class SeedanceProvider(BaseVideoProvider):
    """字节跳动 Seedance 视频生成提供商

    通过火山引擎 API 调用 Seedance 模型
    """

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url)
        self.base_url = base_url or "https://ark.cn-beijing.volces.com"

    async def create_task(
        self,
        prompt: str,
        duration: int = 5,
        resolution: str = "720P",
        ratio: str = "16:9",
    ) -> dict:
        """创建 Seedance 视频生成任务"""
        try:
            url = f"{self.base_url}/api/v3/contents/generations/tasks"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            # Seedance 使用 endpoint_id，需要用户配置
            # 这里使用通用的请求格式
            payload = {
                "model": "seedance-2.0",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    }
                ],
                "parameters": {
                    "duration": min(max(duration, 3), 10),
                    "resolution": resolution,
                    "ratio": ratio,
                },
            }

            response = await self.client.post(
                url, headers=headers, json=payload, timeout=60.0
            )

            if response.status_code != 200:
                error_msg = response.text
                logger.error("Seedance create task failed: %s", error_msg)
                return {"success": False, "error": f"创建任务失败: {error_msg}"}

            data = response.json()
            task_id = data.get("id") or data.get("task_id")

            if not task_id:
                return {"success": False, "error": "未获取到任务ID"}

            return {"success": True, "task_id": task_id}

        except Exception as e:
            logger.exception("Seedance create task error")
            return {"success": False, "error": str(e)}

    async def query_task(self, task_id: str) -> dict:
        """查询 Seedance 任务状态"""
        try:
            url = f"{self.base_url}/api/v3/contents/generations/tasks/{task_id}"
            headers = {"Authorization": f"Bearer {self.api_key}"}

            response = await self.client.get(url, headers=headers, timeout=30.0)

            if response.status_code != 200:
                return {"status": "FAILED", "error": f"查询失败: {response.text}"}

            data = response.json()
            status_map = {
                "pending": "PENDING",
                "running": "RUNNING",
                "succeeded": "SUCCEEDED",
                "failed": "FAILED",
                "cancelled": "CANCELED",
            }
            raw_status = data.get("status", "unknown").lower()
            status = status_map.get(raw_status, "UNKNOWN")

            video_url = None
            error = None

            if status == "SUCCEEDED":
                # 从输出中提取视频 URL
                output = data.get("output", {})
                video_url = output.get("video_url") or output.get("url")
            elif status == "FAILED":
                error = data.get("error", {}).get("message", "任务失败")

            return {
                "status": status,
                "video_url": video_url,
                "error": error,
            }

        except Exception as e:
            logger.exception("Seedance query task error")
            return {"status": "FAILED", "error": str(e)}


class VideoGenerator:
    """视频生成器（多提供商支持）"""

    def __init__(self, settings: Settings, provider: Optional[VideoProvider] = None):
        self.settings = settings
        self.provider_type = provider or self._detect_provider()
        self.provider = self._create_provider()

    def _detect_provider(self) -> VideoProvider:
        """根据配置自动检测提供商"""
        if self.settings.video_provider == "seedance":
            return VideoProvider.SEEDANCE
        return VideoProvider.HAPPYHORSE

    def _create_provider(self) -> BaseVideoProvider:
        """创建提供商实例"""
        api_key = self.settings.video_api_key
        if not api_key:
            raise ValueError("未配置视频生成 API 密钥 (VIDEO_API_KEY)")

        if self.provider_type == VideoProvider.SEEDANCE:
            return SeedanceProvider(
                api_key=api_key,
                base_url=self.settings.video_api_endpoint,
            )
        else:
            return HappyHorseProvider(
                api_key=api_key,
                base_url=self.settings.video_api_endpoint,
            )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def generate_async(
        self,
        prompt: str,
        output_dir: str = "./output",
        duration: int = 5,
        resolution: str = "720P",
        ratio: str = "16:9",
    ) -> VideoResult:
        """
        异步生成视频

        Args:
            prompt: 生成提示词
            output_dir: 输出目录
            duration: 视频时长（秒）
            resolution: 分辨率 (720P, 1080P)
            ratio: 宽高比 (16:9, 9:16, 1:1 等)

        Returns:
            VideoResult: 生成结果
        """
        try:
            result = await self.provider.generate(
                prompt=prompt,
                duration=duration,
                resolution=resolution,
                ratio=ratio,
            )

            if not result["success"]:
                return VideoResult(success=False, error=result.get("error"))

            video_url = result["video_url"]
            if not video_url:
                return VideoResult(success=False, error="未获取到视频URL")

            # 下载视频
            video_data = await self._download_video(video_url)
            if not video_data:
                return VideoResult(success=False, error="下载视频失败")

            # 保存到本地
            file_path = self._save_video(video_data, output_dir, prompt)
            return VideoResult(success=True, file_path=file_path)

        except Exception as e:
            logger.exception("Video generation failed")
            return VideoResult(success=False, error=str(e))

    async def _download_video(self, url: str) -> Optional[bytes]:
        """下载视频文件"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=120.0)
                if response.status_code == 200:
                    return response.content
                logger.error("Download video failed: %s", response.status_code)
                return None
        except Exception as e:
            logger.exception("Download video error")
            return None

    def _save_video(self, video_data: bytes, output_dir: str, prompt: str) -> str:
        """保存视频到本地"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:8]
        filename = f"video_{timestamp}_{prompt_hash}.mp4"

        os.makedirs(output_dir, exist_ok=True)

        file_path = os.path.join(output_dir, filename)
        with open(file_path, "wb") as f:
            f.write(video_data)

        logger.info("Video saved to %s", file_path)
        return file_path

    async def close(self):
        """关闭 HTTP 客户端"""
        await self.provider.close()
