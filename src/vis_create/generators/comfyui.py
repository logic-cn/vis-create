"""
ComfyUI 图片生成器

通过 ComfyUI API 生成图片
"""

import json
import os
import uuid
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


@dataclass
class ComfyUIResult:
    """ComfyUI 生成结果"""

    success: bool
    file_path: Optional[str] = None
    error: Optional[str] = None


class ComfyUIGenerator:
    """ComfyUI 图片生成器"""

    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=300.0)
        self.client_id = str(uuid.uuid4())

    async def close(self):
        """关闭 HTTP 客户端连接"""
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def generate(
        self,
        prompt: str,
        model_name: str,
        output_dir: str = "./output",
        style: str = "realistic",
        size: str = "1024x1024",
        config: Optional[dict] = None,
    ) -> ComfyUIResult:
        """调用 ComfyUI API 生成图片"""
        try:
            workflow = self._build_workflow(
                prompt=prompt,
                model_name=model_name,
                size=size,
                style=style,
                config=config,
            )

            prompt_id = await self._queue_prompt(workflow)
            if not prompt_id:
                return ComfyUIResult(success=False, error="提交工作流失败")

            image_data = await self._wait_and_get_image(prompt_id)
            if not image_data:
                return ComfyUIResult(success=False, error="获取生成结果超时")

            os.makedirs(output_dir, exist_ok=True)
            file_name = f"comfyui_{uuid.uuid4().hex[:12]}.png"
            file_path = os.path.join(output_dir, file_name)
            with open(file_path, "wb") as f:
                f.write(image_data)

            return ComfyUIResult(success=True, file_path=file_path)

        except Exception as e:
            logger.exception("ComfyUI generation failed")
            return ComfyUIResult(success=False, error=str(e))

    async def _queue_prompt(self, workflow: dict) -> Optional[str]:
        """提交工作流到 ComfyUI 队列"""
        try:
            payload = {"prompt": workflow, "client_id": self.client_id}
            resp = await self.client.post(f"{self.base_url}/prompt", json=payload)
            if resp.status_code != 200:
                logger.error("ComfyUI queue failed: %s", resp.text)
                return None
            return resp.json().get("prompt_id")
        except Exception as e:
            logger.error("ComfyUI queue error: %s", e)
            return None

    async def _wait_and_get_image(
        self, prompt_id: str, max_wait: int = 300
    ) -> Optional[bytes]:
        """等待任务完成并获取生成的图片"""
        import asyncio

        for _ in range(max_wait):
            try:
                resp = await self.client.get(f"{self.base_url}/history/{prompt_id}")
                if resp.status_code == 200:
                    history = resp.json()
                    if prompt_id in history:
                        outputs = history[prompt_id].get("outputs", {})
                        logger.info(
                            "ComfyUI outputs for %s: %s",
                            prompt_id,
                            json.dumps(outputs, default=str),
                        )
                        for _node_id, node_output in outputs.items():
                            images = node_output.get("images", [])
                            if images:
                                image_info = images[0]
                                params = {
                                    "filename": image_info["filename"],
                                    "subfolder": image_info.get("subfolder", ""),
                                    "type": image_info.get("type", "output"),
                                }
                                img_resp = await self.client.get(
                                    f"{self.base_url}/view", params=params
                                )
                                if img_resp.status_code == 200:
                                    return img_resp.content
                                logger.error(
                                    "Failed to download image: %s", img_resp.status_code
                                )
                        # 检查是否有错误信息
                        status = history[prompt_id].get("status", {})
                        if status.get("status_str") == "error":
                            logger.error(
                                "ComfyUI execution error: %s",
                                json.dumps(status, default=str),
                            )
                        return None
            except Exception:
                pass
            await asyncio.sleep(1)

        return None

    def _build_workflow(
        self,
        prompt: str,
        model_name: str,
        size: str,
        style: str,
        config: Optional[dict] = None,
    ) -> dict:
        """构建 ComfyUI 工作流"""
        # 优先使用 config 中的自定义工作流模板
        if config and "workflow" in config:
            workflow = config["workflow"]
            return self._apply_params(workflow, prompt, size, style)

        # 确保模型名有文件后缀
        if not any(
            model_name.endswith(ext) for ext in (".safetensors", ".ckpt", ".pt", ".pth")
        ):
            model_name = f"{model_name}.safetensors"

        # 使用 AuraFlow 默认工作流（适用于 z_image_turbo_bf16 等 Lumina/AuraFlow 模型）
        width, height = self._parse_size(size)
        seed = int(uuid.uuid4().int % (2**32))

        return {
            "57:28": {
                "class_type": "UNETLoader",
                "inputs": {"unet_name": model_name, "weight_dtype": "default"},
                "_meta": {"title": "UNETLoader"},
            },
            "57:30": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": config.get("clip_name", "qwen_3_4b.safetensors")
                    if config
                    else "qwen_3_4b.safetensors",
                    "type": config.get("clip_type", "lumina2") if config else "lumina2",
                    "device": "default",
                },
                "_meta": {"title": "CLIPLoader"},
            },
            "57:29": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": config.get("vae_name", "ae.safetensors")
                    if config
                    else "ae.safetensors",
                },
                "_meta": {"title": "VAELoader"},
            },
            "57:11": {
                "class_type": "ModelSamplingAuraFlow",
                "inputs": {
                    "shift": config.get("shift", 3) if config else 3,
                    "model": ["57:28", 0],
                },
                "_meta": {"title": "ModelSamplingAuraFlow"},
            },
            "57:27": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": prompt, "clip": ["57:30", 0]},
                "_meta": {"title": "CLIPTextEncode"},
            },
            "57:33": {
                "class_type": "ConditioningZeroOut",
                "inputs": {"conditioning": ["57:27", 0]},
                "_meta": {"title": "ConditioningZeroOut"},
            },
            "57:13": {
                "class_type": "EmptySD3LatentImage",
                "inputs": {"width": width, "height": height, "batch_size": 1},
                "_meta": {"title": "EmptySD3LatentImage"},
            },
            "57:3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": config.get("steps", 8) if config else 8,
                    "cfg": config.get("cfg", 1) if config else 1,
                    "sampler_name": config.get("sampler_name", "res_multistep")
                    if config
                    else "res_multistep",
                    "scheduler": config.get("scheduler", "simple")
                    if config
                    else "simple",
                    "denoise": 1,
                    "model": ["57:11", 0],
                    "positive": ["57:27", 0],
                    "negative": ["57:33", 0],
                    "latent_image": ["57:13", 0],
                },
                "_meta": {"title": "KSampler"},
            },
            "57:8": {
                "class_type": "VAEDecode",
                "inputs": {"samples": ["57:3", 0], "vae": ["57:29", 0]},
                "_meta": {"title": "VAEDecode"},
            },
            "66": {
                "class_type": "SaveImage",
                "inputs": {"filename_prefix": "viscreate", "images": ["57:8", 0]},
                "_meta": {"title": "SaveImage"},
            },
        }

    def _apply_params(self, workflow: dict, prompt: str, size: str, style: str) -> dict:
        """将动态参数注入到工作流模板中"""
        import copy

        wf = copy.deepcopy(workflow)
        width, height = self._parse_size(size)
        seed = int(uuid.uuid4().int % (2**32))

        for _node_id, node in wf.items():
            cls = node.get("class_type", "")
            inputs = node.get("inputs", {})
            if cls == "CLIPTextEncode" and "text" in inputs:
                inputs["text"] = prompt
            if cls in ("EmptyLatentImage", "EmptySD3LatentImage"):
                inputs["width"] = width
                inputs["height"] = height
            if cls == "KSampler" and "seed" in inputs:
                inputs["seed"] = seed

        return wf

    def _parse_size(self, size: str) -> tuple[int, int]:
        """解析尺寸字符串为宽高"""
        ratio_map = {
            "1:1": (1024, 1024),
            "4:3": (1024, 768),
            "3:4": (768, 1024),
            "16:9": (1024, 576),
            "9:16": (576, 1024),
            "3:2": (1024, 682),
            "2:3": (682, 1024),
            "21:9": (1024, 438),
        }
        if size in ratio_map:
            return ratio_map[size]
        if "x" in size:
            parts = size.split("x")
            if len(parts) == 2:
                try:
                    return int(parts[0]), int(parts[1])
                except ValueError:
                    pass
        return 1024, 1024
