# VisCreate - AI视觉创作Agent

一个专注于AI图片生成和视频生成的本地Agent产品，直接运行在你的电脑上，能够智能地读取、创建、修改本地文件、图片和视频。

## 核心特性

- 🎨 **AI图片生成** - 集成多种AI模型（Stable Diffusion、DALL-E等）
- 🎬 **AI视频生成** - 支持Runway、Pika等视频生成服务
- 📁 **本地文件操作** - 直接读取、创建、修改本地文件
- 🤖 **智能Agent** - 自动理解用户意图，智能执行任务
- 🖥️ **本地运行** - 无需部署，直接在本地电脑运行

## 技术栈

- **Python 3.11+** - 核心运行环境
- **Typer** - CLI命令行界面
- **Rich** - 终端美化输出
- **LangChain** - Agent框架
- **Pillow/PIL** - 图片处理
- **MoviePy** - 视频处理
- **httpx** - 异步HTTP客户端
- **Pydantic** - 数据验证

## 快速开始

### 1. 安装依赖

```bash
# 使用uv（推荐）
uv pip install -e .

# 或使用pip
pip install -e .
```

### 2. 配置API密钥

```bash
cp .env.example .env
# 编辑.env文件，添加你的API密钥
```

### 3. 运行

```bash
# 启动交互式Agent
vis-create

# 或直接执行任务
vis-create generate "一只可爱的猫咪在花园里玩耍"
vis-create video "日落海滩的延时摄影"
```

## 项目结构

```
vis-create/
├── src/
│   └── vis_create/
│       ├── __init__.py
│       ├── main.py          # CLI入口
│       ├── agent/           # Agent核心逻辑
│       │   ├── __init__.py
│       │   ├── core.py      # Agent主类
│       │   └── tools.py     # Agent工具集
│       ├── generators/      # AI生成器
│       │   ├── __init__.py
│       │   ├── image.py     # 图片生成
│       │   └── video.py     # 视频生成
│       ├── handlers/        # 文件处理器
│       │   ├── __init__.py
│       │   ├── file.py      # 文件操作
│       │   ├── image.py     # 图片处理
│       │   └── video.py     # 视频处理
│       └── config/          # 配置管理
│           ├── __init__.py
│           └── settings.py  # 设置
├── tests/                   # 测试文件
├── docs/                    # 文档
├── pyproject.toml           # 项目配置
├── .env.example             # 环境变量示例
└── .gitignore
```

## 开发

```bash
# 安装开发依赖
uv pip install -e ".[dev]"

# 运行测试
pytest

# 代码格式化
ruff format .

# 类型检查
mypy src/
```

## 许可证

MIT License

## 作者

logic-cn
