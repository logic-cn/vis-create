"""智能提示词构建器 - 将前端参数转化为高质量提示词"""

from typing import Any, Optional

from .parameter_mappings import PARAMETER_MAPPINGS, PARAMETER_PRIORITY


class PromptBuilder:
    """智能提示词构建器

    将前端创作工作台的参数转化为高质量的英文提示词，
    用于传递给 AI 图像/视频生成模型。

    支持角色一致性生成：
    - 角色参考图（reference_images）
    - 角色视觉特征描述（visual_features）
    - 锁定的角色形象（locked_avatar_id）
    """

    def __init__(self) -> None:
        self.mappings = PARAMETER_MAPPINGS
        self.priority = PARAMETER_PRIORITY

    def build(
        self,
        user_prompt: str,
        parameters: dict[str, Any],
    ) -> str:
        """构建完整的提示词

        Args:
            user_prompt: 用户原始提示词
            parameters: 前端传递的参数

        Returns:
            完整的提示词字符串
        """
        prompt_parts: list[str] = []

        # 1. 添加用户原始提示词（最重要）
        prompt_parts.append(user_prompt)

        # 2. 按优先级添加参数对应的提示词
        for param_name in self.priority:
            if param_name in parameters:
                part = self._extract_param_prompt(
                    param_name,
                    parameters[param_name],
                )
                if part:
                    prompt_parts.append(part)

        # 3. 添加项目资源相关的提示词
        if "referenceImageUrl" in parameters:
            prompt_parts.append("reference image style transfer")

        # 处理角色信息（支持多种格式）
        self._add_character_context(prompt_parts, parameters)

        # 处理章节/场景上下文
        self._add_story_context(prompt_parts, parameters)

        # 4. 合并并优化提示词
        return self._merge_prompts(prompt_parts)

    def _add_character_context(
        self,
        prompt_parts: list[str],
        parameters: dict[str, Any],
    ) -> None:
        """添加角色上下文信息"""
        # 处理单个角色描述（兼容旧版本）
        if "characterDescription" in parameters:
            char_desc = parameters["characterDescription"]
            if char_desc:
                prompt_parts.append(f"character: {char_desc}")

        # 处理多个角色描述（新版本，支持场景生成）
        if "characterDescriptions" in parameters:
            descs = parameters["characterDescriptions"]
            if descs:
                prompt_parts.append(f"characters: {'; '.join(descs)}")

        # 处理角色视觉特征
        if "visualFeatures" in parameters:
            features = parameters["visualFeatures"]
            if features:
                prompt_parts.append(f"visual features: {features}")

        # 处理角色参考图（用于提示模型保持一致性）
        if "referenceImages" in parameters:
            refs = parameters["referenceImages"]
            if refs:
                prompt_parts.append(
                    "maintain character consistency with reference images"
                )

    def _add_story_context(
        self,
        prompt_parts: list[str],
        parameters: dict[str, Any],
    ) -> None:
        """添加剧情上下文信息"""
        if "chapterContext" in parameters:
            context = parameters["chapterContext"]
            if isinstance(context, dict):
                # 新版本：结构化上下文
                parts = []
                if context.get("scriptTitle"):
                    parts.append(f"story: {context['scriptTitle']}")
                if context.get("chapterTitle"):
                    parts.append(f"chapter: {context['chapterTitle']}")
                if context.get("chapterContent"):
                    # 截取前200字符作为上下文
                    content = context["chapterContent"][:200]
                    parts.append(f"context: {content}")
                if parts:
                    prompt_parts.append(", ".join(parts))
            elif isinstance(context, str) and context:
                # 兼容旧版本
                prompt_parts.append(f"context: {context}")

        # 处理场景信息
        if "sceneContext" in parameters:
            scene = parameters["sceneContext"]
            if isinstance(scene, dict):
                parts = []
                if scene.get("description"):
                    parts.append(scene["description"])
                if scene.get("mood"):
                    parts.append(f"mood: {scene['mood']}")
                if scene.get("shotType"):
                    parts.append(f"shot type: {scene['shotType']}")
                if scene.get("background"):
                    parts.append(f"background: {scene['background']}")
                if parts:
                    prompt_parts.append(", ".join(parts))

    def _extract_param_prompt(
        self,
        param_name: str,
        param_value: Any,
    ) -> Optional[str]:
        """从参数值提取对应的提示词"""
        if param_name not in self.mappings:
            return None

        mapping = self.mappings[param_name]

        # 处理简单映射（如 style）
        if isinstance(mapping, dict) and isinstance(param_value, str):
            return mapping.get(param_value)

        # 处理嵌套映射（如 photography.lighting）
        if isinstance(mapping, dict) and isinstance(param_value, dict):
            parts: list[str] = []
            for sub_key, sub_value in param_value.items():
                if sub_key in mapping and isinstance(mapping[sub_key], dict):
                    if sub_value in mapping[sub_key]:
                        parts.append(mapping[sub_key][sub_value])
            return ", ".join(parts) if parts else None

        return None

    def _merge_prompts(self, parts: list[str]) -> str:
        """合并提示词片段，去除重复"""
        # 过滤空值
        valid_parts = [p for p in parts if p and p.strip()]

        # 合并所有片段
        all_phrases: list[str] = []
        for part in valid_parts:
            # 按逗号分割每个部分
            phrases = [p.strip() for p in part.split(",") if p.strip()]
            all_phrases.extend(phrases)

        # 去重（保留顺序）
        seen: set[str] = set()
        unique_phrases: list[str] = []
        for phrase in all_phrases:
            phrase_lower = phrase.lower()
            # 检查是否已存在相同的词组
            if phrase_lower not in seen:
                seen.add(phrase_lower)
                unique_phrases.append(phrase)

        return ", ".join(unique_phrases)

    def build_negative_prompt(
        self,
        parameters: dict[str, Any],
    ) -> Optional[str]:
        """构建反向提示词（用于 Stable Diffusion 等）

        Args:
            parameters: 前端传递的参数

        Returns:
            反向提示词字符串，如果无需反向提示词则返回 None
        """
        negative_parts = ["low quality", "blurry", "distorted"]

        # 根据风格添加反向提示词
        style = parameters.get("style", "")
        style_negatives: dict[str, list[str]] = {
            "realistic": ["cartoon", "anime", "illustration"],
            "anime": ["photorealistic", "3d render"],
            "cartoon": ["photorealistic", "dark"],
            "watercolor": ["sharp edges", "digital art"],
        }
        if style in style_negatives:
            negative_parts.extend(style_negatives[style])

        return ", ".join(negative_parts)

    def build_character_consistency_prompt(
        self,
        base_prompt: str,
        character_name: str,
        visual_features: Optional[str] = None,
        has_reference_image: bool = False,
    ) -> str:
        """构建角色一致性提示词

        用于确保生成的角色图像与参考图保持一致

        Args:
            base_prompt: 基础提示词
            character_name: 角色名称
            visual_features: 角色视觉特征描述
            has_reference_image: 是否有参考图

        Returns:
            增强后的提示词
        """
        parts = [base_prompt]

        # 添加角色名称
        parts.append(f"character {character_name}")

        # 添加视觉特征
        if visual_features:
            parts.append(visual_features)

        # 如果有参考图，添加一致性提示
        if has_reference_image:
            parts.append(
                "maintain exact character appearance, "
                "consistent facial features, "
                "same hairstyle and clothing"
            )

        return ", ".join(parts)
