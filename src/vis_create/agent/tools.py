"""
Agent工具集

定义Agent可以使用的各种工具，包括图片生成、视频生成、文件操作等
"""

from typing import List

from langchain.tools import BaseTool, tool

from ..generators.image import ImageGenerator
from ..generators.video import VideoGenerator
from ..handlers.file import FileHandler
from ..handlers.image import ImageHandler
from ..handlers.video import VideoHandler


class AgentTools:
    """Agent工具集管理器"""

    def __init__(
        self,
        file_handler: FileHandler,
        image_handler: ImageHandler,
        video_handler: VideoHandler,
        image_generator: ImageGenerator,
        video_generator: VideoGenerator,
    ):
        self.file_handler = file_handler
        self.image_handler = image_handler
        self.video_handler = video_handler
        self.image_generator = image_generator
        self.video_generator = video_generator

    def get_tools(self) -> List[BaseTool]:
        """获取所有可用工具"""

        @tool
        def generate_image(
            prompt: str,
            output_dir: str = "./output",
            style: str = "realistic",
            size: str = "1024x1024",
        ) -> str:
            """
            生成AI图片

            Args:
                prompt: 图片生成提示词，描述你想要生成的图片内容
                output_dir: 输出目录路径，默认为./output
                style: 图片风格，可选值：realistic(写实)、anime(动漫)、cartoon(卡通)、artistic(艺术)
                size: 图片尺寸，格式为"宽x高"，如"1024x1024"

            Returns:
                str: 生成结果描述
            """
            try:
                self.file_handler.ensure_directory(output_dir)
                result = self.image_generator.generate(
                    prompt=prompt,
                    output_dir=output_dir,
                    style=style,
                    size=size,
                )

                if result.success:
                    return f"图片已成功生成并保存到: {result.file_path}"
                else:
                    return f"图片生成失败: {result.error}"

            except Exception as e:
                return f"生成图片时出错: {str(e)}"

        @tool
        def generate_video(
            prompt: str,
            output_dir: str = "./output",
            duration: int = 5,
            fps: int = 24,
        ) -> str:
            """
            生成AI视频

            Args:
                prompt: 视频生成提示词，描述你想要生成的视频内容
                output_dir: 输出目录路径，默认为./output
                duration: 视频时长（秒），默认为5秒
                fps: 视频帧率，默认为24fps

            Returns:
                str: 生成结果描述
            """
            try:
                self.file_handler.ensure_directory(output_dir)
                result = self.video_generator.generate(
                    prompt=prompt,
                    output_dir=output_dir,
                    duration=duration,
                    fps=fps,
                )

                if result.success:
                    return f"视频已成功生成并保存到: {result.file_path}"
                else:
                    return f"视频生成失败: {result.error}"

            except Exception as e:
                return f"生成视频时出错: {str(e)}"

        @tool
        def edit_image(
            image_path: str,
            instruction: str,
            output_path: str = None,
        ) -> str:
            """
            编辑现有图片

            Args:
                image_path: 要编辑的图片路径
                instruction: 编辑指令，描述你想要对图片进行的修改
                output_path: 输出路径（可选，默认覆盖原图）

            Returns:
                str: 编辑结果描述
            """
            try:
                if not self.file_handler.file_exists(image_path):
                    return f"错误：输入文件不存在: {image_path}"

                result = self.image_generator.edit(
                    image_path=image_path,
                    instruction=instruction,
                    output_path=output_path,
                )

                if result.success:
                    return f"图片已成功编辑并保存到: {result.file_path}"
                else:
                    return f"图片编辑失败: {result.error}"

            except Exception as e:
                return f"编辑图片时出错: {str(e)}"

        @tool
        def list_files(directory: str = ".") -> str:
            """
            列出目录中的文件

            Args:
                directory: 目录路径，默认为当前目录

            Returns:
                str: 文件列表
            """
            try:
                files = self.file_handler.list_files(directory)
                if not files:
                    return f"目录 {directory} 中没有文件"

                file_list = "\n".join([f"- {f}" for f in files])
                return f"目录 {directory} 中的文件:\n{file_list}"

            except Exception as e:
                return f"列出文件时出错: {str(e)}"

        @tool
        def get_image_info(image_path: str) -> str:
            """
            获取图片信息

            Args:
                image_path: 图片路径

            Returns:
                str: 图片信息描述
            """
            try:
                if not self.file_handler.file_exists(image_path):
                    return f"错误：文件不存在: {image_path}"

                info = self.image_handler.get_info(image_path)
                return (
                    f"图片信息:\n"
                    f"- 尺寸: {info['width']}x{info['height']}\n"
                    f"- 格式: {info['format']}\n"
                    f"- 大小: {info['size_mb']:.2f} MB\n"
                    f"- 色彩模式: {info['mode']}"
                )

            except Exception as e:
                return f"获取图片信息时出错: {str(e)}"

        return [
            generate_image,
            generate_video,
            edit_image,
            list_files,
            get_image_info,
        ]
