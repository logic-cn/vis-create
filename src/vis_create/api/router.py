"""
API路由汇总
"""

from fastapi import APIRouter

from .artworks import router as artworks_router
from .tasks import router as tasks_router
from .settings import router as settings_router

api_router = APIRouter(prefix="/api")

api_router.include_router(artworks_router, prefix="/artworks", tags=["artworks"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
