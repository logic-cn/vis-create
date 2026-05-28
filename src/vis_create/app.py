"""
FastAPI应用入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .database.connection import init_db

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


@app.on_event("startup")
def startup():
    """应用启动时初始化数据库"""
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
