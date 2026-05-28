"""
Agent核心模块

实现VisCreate Agent的主要逻辑，包括任务理解、工具调用和结果处理
"""

from dataclasses import dataclass
from typing import Optional

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

from ..config.settings import Settings
from ..generators.image import ImageGenerator
from ..generators.video import VideoGenerator
from ..handlers.file import FileHandler
from ..handlers.image import ImageHandler
from ..handlers.video import VideoHandler
from .tools import AgentTools


@dataclass
class AgentResult:
    """Agent执行结果"""

    success: bool
    file_path: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None


class VisCreateAgent:
    """VisCreate Agent主类"""

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or Settings()
        self._initialize_components()

    def _initialize_components(self):
        """初始化所有组件"""
        # 初始化处理器
        self.file_handler = FileHandler()
        self.image_handler = ImageHandler()
        self.video_handler = VideoHandler()

        # 初始化生成器
        self.image_generator = ImageGenerator(self.settings)
        self.video_generator = VideoGenerator(self.settings)

        # 初始化工具集
        self.tools = AgentTools(
            file_handler=self.file_handler,
            image_handler=self.image_handler,
            video_handler=self.video_handler,
            image_generator=self.image_generator,
            video_generator=self.video_generator,
        )

        # 初始化LLM
        self.llm = ChatOpenAI(
            model=self.settings.openai_model,
            temperature=0.7,
            api_key=self.settings.openai_api_key,
        )

        # 创建Agent
        self._create_agent()

    def _create_agent(self):
        """创建LangChain Agent"""
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """你是一个专注于视觉创作的AI助手。你可以帮助用户：
1. 生成AI图片（使用generate_image工具）
2. 生成AI视频（使用generate_video工具）
3. 编辑现有图片（使用edit_image工具）
4. 处理本地文件（使用file操作工具）

请根据用户的需求，选择合适的工具来完成任务。在执行任务前，请确认理解用户的需求。
如果需要更多信息，请向用户询问。""",
                ),
                MessagesPlaceholder(variable_name="chat_history", optional=True),
                ("user", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        agent = create_openai_tools_agent(self.llm, self.tools.get_tools(), prompt)
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools.get_tools(),
            verbose=self.settings.verbose,
            handle_parsing_errors=True,
        )

    def generate_image(
        self,
        prompt: str,
        output_dir: str = "./output",
        style: str = "realistic",
        size: str = "1024x1024",
    ) -> AgentResult:
        """
        生成AI图片

        Args:
            prompt: 图片生成提示词
            output_dir: 输出目录
            style: 图片风格
            size: 图片尺寸

        Returns:
            AgentResult: 执行结果
        """
        try:
            # 确保输出目录存在
            self.file_handler.ensure_directory(output_dir)

            # 生成图片
            result = self.image_generator.generate(
                prompt=prompt,
                output_dir=output_dir,
                style=style,
                size=size,
            )

            if result.success:
                return AgentResult(
                    success=True,
                    file_path=result.file_path,
                    message=f"图片已成功生成到 {result.file_path}",
                )
            else:
                return AgentResult(success=False, error=result.error)

        except Exception as e:
            return AgentResult(success=False, error=str(e))

    def generate_video(
        self,
        prompt: str,
        output_dir: str = "./output",
        duration: int = 5,
        fps: int = 24,
    ) -> AgentResult:
        """
        生成AI视频

        Args:
            prompt: 视频生成提示词
            output_dir: 输出目录
            duration: 视频时长（秒）
            fps: 帧率

        Returns:
            AgentResult: 执行结果
        """
        try:
            # 确保输出目录存在
            self.file_handler.ensure_directory(output_dir)

            # 生成视频
            result = self.video_generator.generate(
                prompt=prompt,
                output_dir=output_dir,
                duration=duration,
                fps=fps,
            )

            if result.success:
                return AgentResult(
                    success=True,
                    file_path=result.file_path,
                    message=f"视频已成功生成到 {result.file_path}",
                )
            else:
                return AgentResult(success=False, error=result.error)

        except Exception as e:
            return AgentResult(success=False, error=str(e))

    def edit_image(
        self,
        image_path: str,
        instruction: str,
        output_path: Optional[str] = None,
    ) -> AgentResult:
        """
        编辑现有图片

        Args:
            image_path: 原始图片路径
            instruction: 编辑指令
            output_path: 输出路径（可选，默认覆盖原图）

        Returns:
            AgentResult: 执行结果
        """
        try:
            # 验证输入文件存在
            if not self.file_handler.file_exists(image_path):
                return AgentResult(
                    success=False, error=f"输入文件不存在: {image_path}"
                )

            # 编辑图片
            result = self.image_generator.edit(
                image_path=image_path,
                instruction=instruction,
                output_path=output_path,
            )

            if result.success:
                return AgentResult(
                    success=True,
                    file_path=result.file_path,
                    message=f"图片已成功编辑并保存到 {result.file_path}",
                )
            else:
                return AgentResult(success=False, error=result.error)

        except Exception as e:
            return AgentResult(success=False, error=str(e))

    def chat(self, user_input: str) -> str:
        """
        与Agent进行对话

        Args:
            user_input: 用户输入

        Returns:
            str: Agent回复
        """
        try:
            result = self.agent_executor.invoke({"input": user_input})
            return result.get("output", "抱歉，我无法处理这个请求。")
        except Exception as e:
            return f"处理请求时出错: {str(e)}"
