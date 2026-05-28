#!/usr/bin/env python3
"""
初始化数据库表
"""

import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, Column, String, Text, Boolean, DateTime, Float, JSON, Enum as SQLEnum
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


class Task(Base):
    """任务表"""
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artwork_id = Column(UUID(as_uuid=True), nullable=True)
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
