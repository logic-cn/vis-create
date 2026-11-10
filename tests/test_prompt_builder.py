"""提示词构建器测试"""

import pytest

from vis_create.prompts.prompt_builder import PromptBuilder


@pytest.fixture
def builder() -> PromptBuilder:
    return PromptBuilder()


class TestPromptBuilder:
    """PromptBuilder 测试类"""

    def test_basic_prompt(self, builder: PromptBuilder) -> None:
        """测试基本提示词构建"""
        result = builder.build(
            user_prompt="a cat",
            parameters={"style": "realistic"},
        )
        assert "a cat" in result
        assert "photorealistic" in result

    def test_anime_style(self, builder: PromptBuilder) -> None:
        """测试动漫风格"""
        result = builder.build(
            user_prompt="a girl",
            parameters={"style": "anime"},
        )
        assert "a girl" in result
        assert "anime style" in result
        assert "cel shading" in result

    def test_all_parameters(self, builder: PromptBuilder) -> None:
        """测试完整参数组合"""
        params = {
            "style": "anime",
            "photography": {
                "lighting": "golden-hour",
                "lens": "wide-angle",
            },
            "subject": {
                "type": "person",
                "emotion": "joyful",
            },
            "environment": {
                "weather": "sunny",
                "timeOfDay": "dusk",
            },
        }
        result = builder.build(
            user_prompt="a girl in park",
            parameters=params,
        )
        assert "anime style" in result
        assert "golden hour" in result
        assert "wide angle" in result
        assert "person" in result
        assert "happy expression" in result
        assert "sunny" in result
        assert "dusk" in result

    def test_empty_parameters(self, builder: PromptBuilder) -> None:
        """测试空参数"""
        result = builder.build(
            user_prompt="simple prompt",
            parameters={},
        )
        assert result == "simple prompt"

    def test_duplicate_removal(self, builder: PromptBuilder) -> None:
        """测试去重功能 - 完全相同的短语会被去重"""
        params = {
            "style": "realistic",
            "subject": {
                "detail": "detailed",
            },
        }
        result = builder.build(
            user_prompt="detailed, high quality photo",
            parameters=params,
        )
        # 结果应包含所有参数
        assert "detailed" in result
        assert "high quality" in result
        assert "photorealistic" in result
        assert "highly detailed" in result
        # 验证完全相同的短语不会重复（如 "detailed" 不会出现两次作为独立短语）
        phrases = [p.strip() for p in result.split(",")]
        seen = set()
        duplicates = []
        for phrase in phrases:
            if phrase in seen:
                duplicates.append(phrase)
            seen.add(phrase)
        # 允许部分匹配的情况（如 "high quality photo" 和 "high quality"）
        assert len(duplicates) == 0, f"Exact duplicate phrases found: {duplicates}"

    def test_character_description(self, builder: PromptBuilder) -> None:
        """测试角色描述"""
        result = builder.build(
            user_prompt="a hero",
            parameters={
                "style": "anime",
                "characterDescription": "young warrior with sword",
            },
        )
        assert "a hero" in result
        assert "character: young warrior with sword" in result

    def test_chapter_context(self, builder: PromptBuilder) -> None:
        """测试章节上下文"""
        result = builder.build(
            user_prompt="a scene",
            parameters={
                "style": "realistic",
                "chapterContext": "medieval fantasy world",
            },
        )
        assert "a scene" in result
        assert "context: medieval fantasy world" in result

    def test_reference_image(self, builder: PromptBuilder) -> None:
        """测试参考图片"""
        result = builder.build(
            user_prompt="similar style",
            parameters={
                "style": "realistic",
                "referenceImageUrl": "https://example.com/ref.jpg",
            },
        )
        assert "similar style" in result
        assert "reference image style transfer" in result

    def test_negative_prompt(self, builder: PromptBuilder) -> None:
        """测试反向提示词"""
        params = {"style": "realistic"}
        result = builder.build_negative_prompt(parameters=params)
        assert result is not None
        assert "low quality" in result
        assert "cartoon" in result

    def test_negative_prompt_anime(self, builder: PromptBuilder) -> None:
        """测试动漫风格的反向提示词"""
        params = {"style": "anime"}
        result = builder.build_negative_prompt(parameters=params)
        assert result is not None
        assert "photorealistic" in result

    def test_unknown_style(self, builder: PromptBuilder) -> None:
        """测试未知风格"""
        result = builder.build(
            user_prompt="test",
            parameters={"style": "unknown_style"},
        )
        assert "test" in result
        # 未知风格不会添加额外描述

    def test_unknown_photography_param(self, builder: PromptBuilder) -> None:
        """测试未知摄影参数"""
        result = builder.build(
            user_prompt="test",
            parameters={
                "photography": {
                    "lighting": "unknown_lighting",
                },
            },
        )
        assert "test" in result
        # 未知参数不会添加额外描述


class TestParameterMappings:
    """参数映射测试类"""

    def test_all_styles_have_mappings(self) -> None:
        """测试所有风格都有映射"""
        from vis_create.prompts.parameter_mappings import PARAMETER_MAPPINGS

        style_mapping = PARAMETER_MAPPINGS["style"]
        expected_styles = [
            "realistic",
            "anime",
            "cartoon",
            "artistic",
            "cyberpunk",
            "watercolor",
            "oil_painting",
            "pixel",
            "minimalist",
            "vintage",
        ]
        for style in expected_styles:
            assert style in style_mapping, f"Style '{style}' missing from mapping"

    def test_priority_order(self) -> None:
        """测试优先级顺序"""
        from vis_create.prompts.parameter_mappings import PARAMETER_PRIORITY

        assert PARAMETER_PRIORITY[0] == "style"
        assert PARAMETER_PRIORITY[1] == "subject"
