"""
FastAPI应用入口
"""

import logging
import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .api.router import api_router
from .database.connection import init_db

logger = logging.getLogger(__name__)

app = FastAPI(
    title="VisCreate API",
    description="AI视觉创作Agent API",
    version="0.1.0",
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router)

# 静态文件服务（生成的图片/视频）
output_dir = os.getenv("OUTPUT_DIR", "./output")
os.makedirs(output_dir, exist_ok=True)
app.mount("/static/outputs", StaticFiles(directory=output_dir), name="outputs")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """自定义验证错误处理器"""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.on_event("startup")
def startup():
    """应用启动时初始化数据库"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    init_db()


@app.get("/")
def root():
    """根路径"""
    return {
        "name": "VisCreate API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    """健康检查"""
    return {"status": "ok"}
