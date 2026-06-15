# AGENTS.md - VisCreate

## 项目架构

Python后端 + Tauri桌面应用（React前端）。两个独立的开发环境。

- **后端**: FastAPI + SQLAlchemy + LangChain，CLI入口 `vis-create`
- **前端**: React + TypeScript + Tailwind CSS + Tauri v2
- **数据库**: PostgreSQL，连接配置在 `.env`

## 关键命令

### 后端开发
```bash
# 安装依赖（推荐使用uv）
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

### 前端开发（Tauri桌面应用）
```bash
cd gui

# 安装依赖
npm install

# 开发模式运行（启动Tauri桌面应用）
npm run tauri dev

# 构建应用
npm run tauri build

# 代码格式化
npx prettier --write .

# 类型检查
npx tsc --noEmit
```

## 环境配置

1. 复制 `.env.example` 到 `.env`
2. 必需的环境变量：
   - `OPENAI_API_KEY` - OpenAI API密钥
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL连接
3. 可选的环境变量：
   - `VIDEO_API_KEY` - 视频生成API
   - `STABILITY_API_KEY` - Stability AI
   - `MINIO_*` - MinIO对象存储配置

## 数据库

- 使用PostgreSQL，无外键约束
- 表结构定义在 `scripts/init_db.py`
- 运行 `python scripts/init_db.py` 创建表
- 主要表：`artworks`, `projects`, `tasks`, `assets`, `characters`, `scripts`, `chapters`, `model_providers`, `models`

## API端点

后端API路由在 `src/vis_create/api/router.py`：
- `/api/artworks` - 作品管理
- `/api/tasks` - 任务管理
- `/api/settings` - 设置管理
- `/api/projects` - 项目管理
- `/api/model-settings` - 模型配置

## 前端结构

- `gui/src/pages/` - 页面组件（Gallery, Creator, Tasks, Settings, Projects）
- `gui/src/services/` - API服务层，调用后端 `http://localhost:8000`
- `gui/src/stores/` - Zustand状态管理
- `gui/src/components/` - UI组件

## 测试

- 后端测试在 `tests/` 目录
- 使用pytest，支持async测试（`pytest-asyncio`）
- 测试文件命名：`test_*.py`

## 代码规范

- Python: Ruff格式化（88字符行宽），Mypy类型检查
- TypeScript: Prettier格式化，ESLint检查
- 提交前运行格式化和类型检查

## 重要文件

- `src/vis_create/main.py` - CLI入口
- `src/vis_create/app.py` - FastAPI应用入口
- `src/vis_create/agent/core.py` - Agent核心逻辑
- `src/vis_create/config/settings.py` - 配置管理
- `gui/src-tauri/tauri.conf.json` - Tauri配置
