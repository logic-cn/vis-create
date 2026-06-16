# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

VisCreate 是一个 AI 视觉创作 Agent，专注于图片和视频生成。项目采用 Python + FastAPI 后端 + React/Tauri 桌面应用架构。

## 常用命令

### 后端开发
```bash
# 安装依赖（使用 uv 推荐）
uv pip install -e ".[dev]"

# 运行后端服务
uvicorn vis_create.app:app --reload

# 运行测试
pytest tests/ -v

# 代码格式化
ruff format src/

# 类型检查
mypy src/

# 数据库初始化
python scripts/init_db.py
```

### 前端开发（Tauri 桌面应用）
```bash
cd gui

# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建应用
npm run tauri build

# 代码格式化
npx prettier --write .

# 类型检查
npx tsc --noEmit
```

## 架构概述

### 后端结构 (src/vis_create/)

- **main.py** - CLI 入口，使用 Typer 提供命令行界面
- **app.py** - FastAPI 应用入口
- **agent/** - Agent 核心逻辑，包含 LangChain 集成
  - `core.py` - Agent 主类
  - `tools.py` - Agent 工具集
- **api/** - REST API 路由
  - `router.py` - 路由汇总（artworks, tasks, settings, projects）
- **models/** - SQLAlchemy 数据模型（artwork, task, project, character, script, asset）
- **generators/** - AI 生成器（图片、视频）
- **database/** - 数据库连接管理（PostgreSQL）
- **config/** - 配置管理，使用 Pydantic Settings

### 前端结构 (gui/)

- **src/pages/** - 页面组件（CreatorPage, TasksPage, ProjectsPage, SettingsPage）
- **src/components/** - UI 组件（gallery, tasks, project, layout）
- **src/stores/** - 状态管理（artworkStore, taskStore, projectStore）
- **src/services/** - API 服务层
- **src/types/** - TypeScript 类型定义
- **src-tauri/** - Tauri 桌面应用配置

### 数据库

- 使用 PostgreSQL + SQLAlchemy ORM
- 不使用外键约束（用户要求）
- 连接配置在 `config/settings.py`

### API 端点

- `/api/artworks` - 作品管理
- `/api/tasks` - 任务管理
- `/api/projects` - 项目管理
- `/api/settings` - 设置管理

## 关键技术栈

- **后端**: Python 3.11+, FastAPI, SQLAlchemy, LangChain, Typer
- **前端**: React, TypeScript, Tauri, Tailwind CSS
- **数据库**: PostgreSQL
- **代码规范**: Ruff (Python), Prettier (前端), ESLint

## 注意事项

- 数据库设计不允许使用外键
- 前端代码必须通过 Prettier 格式检查
- 使用不可变数据模式
- 函数保持小（<50行），文件聚焦（<800行）
