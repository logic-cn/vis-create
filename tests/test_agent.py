"""
Agent测试
"""

import pytest
from unittest.mock import Mock, patch

from vis_create.agent.core import VisCreateAgent, AgentResult
from vis_create.config.settings import Settings


@pytest.fixture
def mock_settings():
    """模拟配置"""
    return Settings(
        openai_api_key="test_key",
        video_api_key="test_key",
    )


@pytest.fixture
def agent(mock_settings):
    """创建Agent实例"""
    with patch("vis_create.agent.core.ChatOpenAI"):
        return VisCreateAgent(settings=mock_settings)


class TestAgentResult:
    """AgentResult测试"""

    def test_success_result(self):
        """测试成功结果"""
        result = AgentResult(
            success=True,
            file_path="/path/to/file.png",
            message="Success",
        )
        assert result.success is True
        assert result.file_path == "/path/to/file.png"
        assert result.error is None

    def test_error_result(self):
        """测试错误结果"""
        result = AgentResult(
            success=False,
            error="Something went wrong",
        )
        assert result.success is False
        assert result.file_path is None
        assert result.error == "Something went wrong"


class TestVisCreateAgent:
    """VisCreateAgent测试"""

    def test_initialization(self, agent):
        """测试Agent初始化"""
        assert agent is not None
        assert agent.settings is not None

    def test_generate_image(self, agent):
        """测试图片生成"""
        with patch.object(agent.image_generator, "generate") as mock_generate:
            mock_generate.return_value = AgentResult(
                success=True,
                file_path="/output/image.png",
            )

            result = agent.generate_image(
                prompt="test prompt",
                output_dir="./output",
            )

            assert result.success is True
            assert result.file_path == "/output/image.png"

    def test_generate_video(self, agent):
        """测试视频生成"""
        with patch.object(agent.video_generator, "generate") as mock_generate:
            mock_generate.return_value = AgentResult(
                success=True,
                file_path="/output/video.mp4",
            )

            result = agent.generate_video(
                prompt="test prompt",
                output_dir="./output",
            )

            assert result.success is True
            assert result.file_path == "/output/video.mp4"
