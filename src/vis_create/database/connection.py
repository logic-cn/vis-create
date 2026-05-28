"""
数据库连接管理
"""

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from ..config.settings import Settings


class Base(DeclarativeBase):
    """SQLAlchemy基类"""
    pass


# 全局变量
_engine = None
_SessionLocal = None


def get_engine():
    """获取数据库引擎"""
    global _engine
    if _engine is None:
        settings = Settings()
        database_url = os.getenv(
            "DATABASE_URL",
            f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
        )
        _engine = create_engine(database_url, echo=settings.verbose)
    return _engine


def get_session_factory():
    """获取会话工厂"""
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """获取数据库会话（FastAPI依赖注入用）"""
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库（创建表）"""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
