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

# CORS配置：默认仅允许本地前端/桌面端来源，可用 CORS_ALLOW_ORIGINS 覆盖
# （逗号分隔）。绝不能使用 "*" 搭配 allow_credentials=True：浏览器规范下
# 该组合无效，且会让任意网页读取本地数据库中的密钥。
DEFAULT_CORS_ALLOW_ORIGINS = [
    "http://localhost:1420",
    "http://127.0.0.1:1420",
    "tauri://localhost",
    "http://tauri.localhost",
]


def _resolve_cors_allow_origins() -> list[str]:
    """解析允许的跨域来源：环境变量优先，否则使用本地来源白名单。"""
    raw = os.getenv("CORS_ALLOW_ORIGINS", "")
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    if "*" in origins:
        raise RuntimeError(
            "CORS_ALLOW_ORIGINS 不允许包含 '*'，请显式列出允许的来源，"
            "例如 http://localhost:1420"
        )
    return origins or list(DEFAULT_CORS_ALLOW_ORIGINS)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolve_cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
