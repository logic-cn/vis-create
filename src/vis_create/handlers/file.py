"""
文件处理器

提供文件系统操作能力
"""

import os
import shutil
from pathlib import Path
from typing import List, Optional


class FileHandler:
    """文件处理器"""

    def ensure_directory(self, directory: str) -> None:
        """
        确保目录存在，如果不存在则创建

        Args:
            directory: 目录路径
        """
        os.makedirs(directory, exist_ok=True)

    def file_exists(self, file_path: str) -> bool:
        """
        检查文件是否存在

        Args:
            file_path: 文件路径

        Returns:
            bool: 文件是否存在
        """
        return os.path.isfile(file_path)

    def directory_exists(self, directory: str) -> bool:
        """
        检查目录是否存在

        Args:
            directory: 目录路径

        Returns:
            bool: 目录是否存在
        """
        return os.path.isdir(directory)

    def list_files(
        self,
        directory: str = ".",
        pattern: Optional[str] = None,
        recursive: bool = False,
    ) -> List[str]:
        """
        列出目录中的文件

        Args:
            directory: 目录路径
            pattern: 文件名模式（如 "*.png"）
            recursive: 是否递归列出子目录

        Returns:
            List[str]: 文件路径列表
        """
        path = Path(directory)

        if not path.exists():
            return []

        if pattern:
            if recursive:
                files = list(path.rglob(pattern))
            else:
                files = list(path.glob(pattern))
        else:
            if recursive:
                files = [f for f in path.rglob("*") if f.is_file()]
            else:
                files = [f for f in path.iterdir() if f.is_file()]

        return [str(f) for f in sorted(files)]

    def read_file(self, file_path: str) -> bytes:
        """
        读取文件内容

        Args:
            file_path: 文件路径

        Returns:
            bytes: 文件内容
        """
        with open(file_path, "rb") as f:
            return f.read()

    def write_file(self, file_path: str, content: bytes) -> None:
        """
        写入文件内容

        Args:
            file_path: 文件路径
            content: 文件内容
        """
        # 确保目录存在
        directory = os.path.dirname(file_path)
        if directory:
            self.ensure_directory(directory)

        with open(file_path, "wb") as f:
            f.write(content)

    def delete_file(self, file_path: str) -> bool:
        """
        删除文件

        Args:
            file_path: 文件路径

        Returns:
            bool: 是否成功删除
        """
        try:
            if self.file_exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False

    def copy_file(self, source: str, destination: str) -> bool:
        """
        复制文件

        Args:
            source: 源文件路径
            destination: 目标文件路径

        Returns:
            bool: 是否成功复制
        """
        try:
            # 确保目标目录存在
            directory = os.path.dirname(destination)
            if directory:
                self.ensure_directory(directory)

            shutil.copy2(source, destination)
            return True
        except Exception:
            return False

    def move_file(self, source: str, destination: str) -> bool:
        """
        移动文件

        Args:
            source: 源文件路径
            destination: 目标文件路径

        Returns:
            bool: 是否成功移动
        """
        try:
            # 确保目标目录存在
            directory = os.path.dirname(destination)
            if directory:
                self.ensure_directory(directory)

            shutil.move(source, destination)
            return True
        except Exception:
            return False

    def get_file_size(self, file_path: str) -> int:
        """
        获取文件大小（字节）

        Args:
            file_path: 文件路径

        Returns:
            int: 文件大小
        """
        return os.path.getsize(file_path)

    def get_file_extension(self, file_path: str) -> str:
        """
        获取文件扩展名

        Args:
            file_path: 文件路径

        Returns:
            str: 文件扩展名
        """
        return os.path.splitext(file_path)[1].lower()

    def get_filename(self, file_path: str) -> str:
        """
        获取文件名（不含路径）

        Args:
            file_path: 文件路径

        Returns:
            str: 文件名
        """
        return os.path.basename(file_path)

    def join_paths(self, *paths: str) -> str:
        """
        连接路径

        Args:
            *paths: 路径组件

        Returns:
            str: 连接后的路径
        """
        return os.path.join(*paths)
