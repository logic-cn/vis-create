"""
视频处理器

提供视频文件的处理和分析能力
"""

import os
from typing import Any, Dict, List, Optional

from moviepy.editor import VideoFileClip


class VideoHandler:
    """视频处理器"""

    def get_info(self, video_path: str) -> Dict[str, Any]:
        """
        获取视频信息

        Args:
            video_path: 视频路径

        Returns:
            Dict[str, Any]: 视频信息
        """
        with VideoFileClip(video_path) as clip:
            # 获取文件大小
            file_size = os.path.getsize(video_path)

            return {
                "width": clip.w,
                "height": clip.h,
                "duration": clip.duration,
                "fps": clip.fps,
                "size_bytes": file_size,
                "size_mb": file_size / (1024 * 1024),
            }

    def extract_frames(
        self,
        video_path: str,
        output_dir: str,
        fps: float = 1.0,
        start_time: float = 0,
        end_time: Optional[float] = None,
    ) -> List[str]:
        """
        提取视频帧

        Args:
            video_path: 视频路径
            output_dir: 输出目录
            fps: 每秒提取的帧数
            start_time: 开始时间（秒）
            end_time: 结束时间（秒）

        Returns:
            List[str]: 提取的帧文件路径列表
        """
        os.makedirs(output_dir, exist_ok=True)

        with VideoFileClip(video_path) as clip:
            # 设置时间范围
            if end_time is None:
                end_time = clip.duration

            # 提取帧
            frame_paths = []
            for i, t in enumerate(range(int(start_time), int(end_time))):
                frame = clip.get_frame(t)
                frame_path = os.path.join(output_dir, f"frame_{i:04d}.png")

                from PIL import Image
                img = Image.fromarray(frame)
                img.save(frame_path)
                frame_paths.append(frame_path)

            return frame_paths

    def trim(
        self,
        video_path: str,
        start_time: float,
        end_time: float,
        output_path: Optional[str] = None,
    ) -> str:
        """
        裁剪视频

        Args:
            video_path: 输入视频路径
            start_time: 开始时间（秒）
            end_time: 结束时间（秒）
            output_path: 输出路径（可选）

        Returns:
            str: 输出视频路径
        """
        with VideoFileClip(video_path) as clip:
            trimmed = clip.subclip(start_time, end_time)

            if output_path is None:
                base_name = os.path.splitext(video_path)[0]
                output_path = f"{base_name}_trimmed.mp4"

            trimmed.write_videofile(output_path, codec="libx264", audio_codec="aac")
            return output_path

    def extract_audio(
        self,
        video_path: str,
        output_path: Optional[str] = None,
    ) -> str:
        """
        提取视频中的音频

        Args:
            video_path: 视频路径
            output_path: 输出路径（可选）

        Returns:
            str: 音频文件路径
        """
        with VideoFileClip(video_path) as clip:
            if clip.audio is None:
                raise ValueError("视频没有音频轨道")

            if output_path is None:
                base_name = os.path.splitext(video_path)[0]
                output_path = f"{base_name}.mp3"

            clip.audio.write_audiofile(output_path)
            return output_path

    def add_audio(
        self,
        video_path: str,
        audio_path: str,
        output_path: Optional[str] = None,
    ) -> str:
        """
        为视频添加音频

        Args:
            video_path: 视频路径
            audio_path: 音频路径
            output_path: 输出路径（可选）

        Returns:
            str: 输出视频路径
        """
        from moviepy.editor import AudioFileClip

        with VideoFileClip(video_path) as video:
            with AudioFileClip(audio_path) as audio:
                # 调整音频时长以匹配视频
                if audio.duration > video.duration:
                    audio = audio.subclip(0, video.duration)

                # 设置音频
                final = video.set_audio(audio)

                if output_path is None:
                    base_name = os.path.splitext(video_path)[0]
                    output_path = f"{base_name}_with_audio.mp4"

                final.write_videofile(output_path, codec="libx264", audio_codec="aac")
                return output_path

    def resize(
        self,
        video_path: str,
        width: int,
        height: int,
        output_path: Optional[str] = None,
    ) -> str:
        """
        调整视频大小

        Args:
            video_path: 输入视频路径
            width: 目标宽度
            height: 目标高度
            output_path: 输出路径（可选）

        Returns:
            str: 输出视频路径
        """
        with VideoFileClip(video_path) as clip:
            resized = clip.resize((width, height))

            if output_path is None:
                base_name = os.path.splitext(video_path)[0]
                output_path = f"{base_name}_resized.mp4"

            resized.write_videofile(output_path, codec="libx264", audio_codec="aac")
            return output_path

    def create_gif(
        self,
        video_path: str,
        output_path: Optional[str] = None,
        start_time: float = 0,
        end_time: Optional[float] = None,
        fps: float = 10,
    ) -> str:
        """
        从视频创建GIF

        Args:
            video_path: 视频路径
            output_path: 输出路径（可选）
            start_time: 开始时间（秒）
            end_time: 结束时间（秒）
            fps: GIF帧率

        Returns:
            str: GIF文件路径
        """
        with VideoFileClip(video_path) as clip:
            if end_time is None:
                end_time = clip.duration

            subclip = clip.subclip(start_time, end_time)

            if output_path is None:
                base_name = os.path.splitext(video_path)[0]
                output_path = f"{base_name}.gif"

            subclip.write_gif(output_path, fps=fps)
            return output_path
