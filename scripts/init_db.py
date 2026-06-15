#!/usr/bin/env python3
"""
初始化数据库表
"""

import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, Column, String, Text, Boolean, DateTime, Float, JSON, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func
import uuid

# 数据库连接
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "5432")
db_name = os.getenv("DB_NAME", "vis-create")
db_user = os.getenv("DB_USER", "postgres")
db_password = os.getenv("DB_PASSWORD", "")

database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
engine = create_engine(database_url)


class Base(DeclarativeBase):
    pass


class Artwork(Base):
    """作品表"""
    __tablename__ = "artworks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    character_id = Column(UUID(as_uuid=True), nullable=True, index=True, comment="关联角色ID")
    chapter_id = Column(UUID(as_uuid=True), nullable=True, index=True, comment="关联章节ID")
    scene_id = Column(UUID(as_uuid=True), nullable=True, index=True, comment="关联场景ID")
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(SQLEnum("image", "video", name="artwork_type"), nullable=False)
    file_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500))
    prompt = Column(Text, nullable=False)
    style = Column(String(100))
    parameters = Column(JSON)
    is_favorite = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Project(Base):
    """项目表"""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    cover_path = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Asset(Base):
    """素材表"""
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum("image", "video", name="asset_type"), nullable=False)
    file_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500))
    source = Column(
        SQLEnum("generated", "uploaded", name="asset_source"),
        default="uploaded",
        nullable=False,
    )
    original_artwork_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Character(Base):
    """角色表"""
    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    personality = Column(Text)
    description = Column(Text)
    avatar_path = Column(String(500))
    # 角色一致性相关字段
    reference_images = Column(JSON, default=list, comment="角色参考图列表（MinIO对象名）")
    locked_avatar_id = Column(UUID(as_uuid=True), nullable=True, comment="锁定的形象作品ID")
    visual_features = Column(Text, nullable=True, comment="角色视觉特征描述（用于prompt）")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Script(Base):
    """剧本表"""
    __tablename__ = "scripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Chapter(Base):
    """章节表"""
    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    script_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Scene(Base):
    """场景（分镜）表"""
    __tablename__ = "scenes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), nullable=False, index=True, comment="所属章节ID")
    title = Column(String(255), nullable=False, comment="场景标题")
    description = Column(Text, nullable=True, comment="场景描述")
    sort_order = Column(Integer, default=0, comment="场景顺序")
    shot_type = Column(String(50), nullable=True, comment="镜头类型")
    camera_movement = Column(String(100), nullable=True, comment="镜头运动")
    character_ids = Column(JSON, default=list, comment="出场角色ID列表")
    background_description = Column(Text, nullable=True, comment="背景/环境描述")
    mood = Column(String(100), nullable=True, comment="氛围/情绪")
    dialogue = Column(Text, nullable=True, comment="台词/旁白")
    artwork_id = Column(UUID(as_uuid=True), nullable=True, comment="生成的作品ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Task(Base):
    """任务表"""
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artwork_id = Column(UUID(as_uuid=True), nullable=True)
    project_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    type = Column(SQLEnum("image", "video", name="task_type"), nullable=False)
    status = Column(
        SQLEnum("pending", "processing", "completed", "failed", "paused", name="task_status"),
        default="pending",
        nullable=False,
    )
    progress = Column(Float, default=0.0)
    prompt = Column(Text, nullable=False)
    parameters = Column(JSON)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelProvider(Base):
    """模型提供商表"""
    __tablename__ = "model_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(200), nullable=False)
    provider_type = Column(
        SQLEnum("cloud", "local", name="provider_type"),
        nullable=False,
        default="cloud",
    )
    base_url = Column(String(500), nullable=True)
    api_key = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Model(Base):
    """模型表"""
    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    display_name = Column(String(300), nullable=False)
    model_type = Column(
        SQLEnum("text_to_image", "text_to_video", "image_to_image", "image_to_video", name="model_type"),
        nullable=False,
    )
    description = Column(Text, nullable=True)
    config = Column(Text, nullable=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


def init_database():
    """初始化数据库"""
    print("=" * 50)
    print("初始化数据库表")
    print("=" * 50)

    print("\n正在创建表...")

    # 创建枚举类型
    from sqlalchemy import text
    with engine.connect() as conn:
        # 创建枚举类型（如果不存在）
        conn.execute(text("DO $$ BEGIN CREATE TYPE artwork_type AS ENUM ('image', 'video'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))
        conn.execute(text("DO $$ BEGIN CREATE TYPE task_type AS ENUM ('image', 'video'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))
        conn.execute(text("DO $$ BEGIN CREATE TYPE task_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'paused'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))
        conn.execute(text("DO $$ BEGIN CREATE TYPE asset_type AS ENUM ('image', 'video'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))
        conn.execute(text("DO $$ BEGIN CREATE TYPE asset_source AS ENUM ('generated', 'uploaded'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))
        conn.execute(text("DO $$ BEGIN CREATE TYPE provider_type AS ENUM ('cloud', 'local'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))
        conn.execute(text("DO $$ BEGIN CREATE TYPE model_type AS ENUM ('text_to_image', 'text_to_video', 'image_to_image', 'image_to_video'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))
        conn.commit()

    # 创建表
    Base.metadata.create_all(engine)
    print("✓ 表创建成功!")

    # 列出所有表
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n数据库中的表:")
    for table in tables:
        print(f"  - {table}")

    print("\n" + "=" * 50)
    print("数据库初始化完成!")
    print("=" * 50)


if __name__ == "__main__":
    init_database()
