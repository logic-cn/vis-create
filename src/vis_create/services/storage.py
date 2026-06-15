"""
MinIO 对象存储服务

提供文件上传、下载、删除和预签名URL生成功能
"""

import os
import uuid
import io
import logging
from typing import Optional

from minio import Minio
from minio.error import S3Error

from ..config.settings import Settings

logger = logging.getLogger(__name__)

_client: Optional[Minio] = None
_settings: Optional[Settings] = None


def _get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def get_minio_client() -> Minio:
    """获取 MinIO 客户端单例"""
    global _client
    if _client is None:
        s = _get_settings()
        _client = Minio(
            s.minio_endpoint,
            access_key=s.minio_access_key,
            secret_key=s.minio_secret_key,
            secure=s.minio_secure,
        )
    return _client


def ensure_bucket() -> None:
    """确保存储桶存在"""
    client = get_minio_client()
    bucket = _get_settings().minio_bucket
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        logger.info("Created MinIO bucket: %s", bucket)


def upload_file(
    file_path: str,
    prefix: str = "outputs/",
) -> str:
    """
    上传本地文件到 MinIO

    Args:
        file_path: 本地文件路径
        prefix: 对象名前缀（如 "outputs/"）

    Returns:
        对象名称
    """
    client = get_minio_client()
    ensure_bucket()

    bucket = _get_settings().minio_bucket
    file_name = os.path.basename(file_path)
    object_name = f"{prefix}{file_name}"

    ext = os.path.splitext(file_name)[1].lower()
    content_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".mkv": "video/x-matroska",
    }
    content_type = content_types.get(ext, "application/octet-stream")

    client.fput_object(
        bucket,
        object_name,
        file_path,
        content_type=content_type,
    )

    logger.info("Uploaded %s to MinIO as %s/%s", file_name, bucket, object_name)
    return object_name


def get_presigned_url(object_name: str, expires: int = 3600) -> str:
    """获取文件的预签名访问URL"""
    client = get_minio_client()
    bucket = _get_settings().minio_bucket
    return client.presigned_get_object(bucket, object_name, expires=expires)


def get_public_url(object_name: str) -> str:
    """获取文件的公共访问URL"""
    s = _get_settings()
    protocol = "https" if s.minio_secure else "http"
    return f"{protocol}://{s.minio_endpoint}/{s.minio_bucket}/{object_name}"


def delete_file(object_name: str) -> bool:
    """从 MinIO 删除文件"""
    try:
        client = get_minio_client()
        bucket = _get_settings().minio_bucket
        client.remove_object(bucket, object_name)
        return True
    except S3Error:
        return False
