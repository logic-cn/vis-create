# VisCreate GUI 设计规范

## 概述

为VisCreate项目添加图形用户界面（GUI），基于Tauri + React技术栈，提供作品画廊、创作工作台、任务队列、设置页面等核心功能。

## 技术栈

### 前端
- **框架：** React 18 + TypeScript
- **状态管理：** Zustand
- **UI组件库：** shadcn/ui + Tailwind CSS
- **路由：** React Router
- **数据请求：** TanStack Query
- **桌面框架：** Tauri 2.0

### 后端
- **HTTP框架：** FastAPI
- **数据库：** PostgreSQL
- **实时通信：** SSE（Server-Sent Events）
- **ORM：** SQLAlchemy

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Tauri Desktop App                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   React Frontend                         │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │ │
│  │  │ Gallery │  │ Creator │  │  Tasks  │  │Settings │   │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │ │
│  │           │           │           │           │         │ │
│  │           └───────────┴───────────┴───────────┘         │ │
│  │                       │ Zustand                          │ │
│  │                       │ Stores                           │ │
│  │                       ▼                                  │ │
│  │              ┌─────────────────┐                        │ │
│  │              │   API Service   │                        │ │
│  │              └─────────────────┘                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │ HTTP/REST                        │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Python Backend (FastAPI)                 │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │ │
│  │  │ Artworks│  │  Tasks  │  │Settings │  │  Agent  │   │ │
│  │  │  API    │  │  API    │  │  API    │  │  Core   │   │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │ │
│  │                       │                                  │ │
│  │                       ▼                                  │ │
│  │              ┌─────────────────┐                        │ │
│  │              │   PostgreSQL    │                        │ │
│  │              └─────────────────┘                        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户操作 → React组件 → Zustand Store → API Service → FastAPI后端
                                                      ↓
                                              PostgreSQL数据库
                                                      ↓
                                              AI生成服务（DALL-E/Runway）
                                                      ↓
                                              SSE进度推送 → React组件更新
```

## 项目结构

```
vis-create/
├── src/vis_create/          # Python后端
│   ├── api/                 # FastAPI路由
│   │   ├── __init__.py
│   │   ├── artworks.py      # 作品API
│   │   ├── tasks.py         # 任务API
│   │   └── settings.py      # 设置API
│   ├── agent/               # Agent核心
│   ├── generators/          # 生成器
│   ├── handlers/            # 处理器
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── artwork.py       # 作品模型
│   │   └── task.py          # 任务模型
│   ├── database/            # 数据库
│   │   ├── __init__.py
│   │   ├── connection.py    # 连接管理
│   │   └── migrations/      # 迁移脚本
│   └── main.py              # CLI入口
├── gui/                     # Tauri + React前端
│   ├── src/
│   │   ├── components/      # React组件
│   │   │   ├── layout/      # 布局组件
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── gallery/     # 画廊组件
│   │   │   │   ├── ArtworkGrid.tsx
│   │   │   │   ├── ArtworkCard.tsx
│   │   │   │   └── ArtworkDetail.tsx
│   │   │   ├── creator/     # 创作组件
│   │   │   │   ├── CreateModal.tsx
│   │   │   │   ├── PromptInput.tsx
│   │   │   │   └── StyleSelector.tsx
│   │   │   ├── tasks/       # 任务组件
│   │   │   │   ├── TaskList.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   └── TaskProgress.tsx
│   │   │   └── settings/    # 设置组件
│   │   │       ├── ApiSettings.tsx
│   │   │       └── GeneralSettings.tsx
│   │   ├── hooks/           # 自定义Hooks
│   │   │   ├── useArtworks.ts
│   │   │   ├── useTasks.ts
│   │   │   └── useSSE.ts
│   │   ├── stores/          # Zustand状态
│   │   │   ├── artworkStore.ts
│   │   │   ├── taskStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── services/        # API服务
│   │   │   ├── api.ts
│   │   │   ├── artworkService.ts
│   │   │   └── taskService.ts
│   │   ├── types/           # TypeScript类型
│   │   ├── styles/          # 样式文件
│   │   └── App.tsx
│   ├── src-tauri/           # Tauri配置
│   ├── package.json
│   └── tailwind.config.js
└── pyproject.toml
```

## UI设计

### 视觉风格

- **主题：** 暗黑科技风
- **主色调：** 深色背景（#0a0a0f）+ 霓虹色点缀（#00ff88, #ff6b6b）
- **字体：** Inter（主字体）+ JetBrains Mono（代码/数据）
- **圆角：** 8px（小组件）/ 12px（卡片）/ 16px（模态框）
- **阴影：** 多层阴影，营造深度感

### 布局结构

**侧边栏（Sidebar）：**
- 宽度：240px（展开）/ 64px（折叠）
- 内容：
  - Logo + 应用名称
  - 导航菜单（图标 + 文字）
  - 收藏库（标签列表）
  - 折叠/展开按钮

**主内容区：**
- 响应式网格布局
- 卡片组件：缩略图、标题、生成时间、操作按钮
- 筛选器栏：类型、风格、时间、排序
- 分页/无限滚动

### 页面设计

#### 1. 作品画廊（Gallery）

**功能：**
- 展示所有生成的作品（图片/视频）
- 网格布局，响应式列数（2-6列）
- 卡片组件：缩略图、标题、生成时间、收藏状态
- 筛选器：类型、风格、时间范围
- 排序：时间、名称、收藏数
- 搜索：关键词搜索

**交互：**
- 点击卡片：打开详情模态框
- 悬停：显示操作按钮（收藏、删除、下载）
- 拖拽：支持拖拽上传

#### 2. 创作工作台（Creator）

**功能：**
- 模态对话框形式
- 提示词输入（多行、历史记录）
- 参数设置：
  - 图片：风格、尺寸、质量
  - 视频：时长、帧率、风格
- 实时预览区域
- 生成按钮 + 进度显示

**交互：**
- 输入提示词时显示历史记录
- 参数调整实时预览效果
- 生成过程中显示进度条和预估时间

#### 3. 任务队列（Tasks）

**功能：**
- 任务列表：状态、进度、预计时间
- 任务详情：参数、日志、结果预览
- 操作：暂停、取消、重试
- 批量操作：批量取消、批量重试

**状态：**
- pending：等待中
- processing：处理中
- completed：已完成
- failed：失败
- paused：已暂停

#### 4. 设置页面（Settings）

**功能：**
- API配置：OpenAI、Runway、Stability AI
- 通用设置：输出目录、默认参数
- 关于页面：版本信息、更新检查

## API设计

### 作品API

```
GET    /api/artworks          # 获取作品列表
GET    /api/artworks/{id}     # 获取作品详情
POST   /api/artworks          # 创建作品（生成）
PUT    /api/artworks/{id}     # 更新作品信息
DELETE /api/artworks/{id}     # 删除作品
POST   /api/artworks/{id}/favorite  # 收藏/取消收藏
```

**请求参数：**
- `page`: 页码
- `limit`: 每页数量
- `type`: 类型筛选（image/video）
- `style`: 风格筛选
- `sort`: 排序方式（time/name/favorites）
- `search`: 搜索关键词

**响应格式：**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### 任务API

```
GET    /api/tasks             # 获取任务列表
GET    /api/tasks/{id}        # 获取任务详情
POST   /api/tasks             # 创建任务
PUT    /api/tasks/{id}/pause  # 暂停任务
PUT    /api/tasks/{id}/resume # 恢复任务
DELETE /api/tasks/{id}        # 取消任务
GET    /api/tasks/{id}/events # SSE进度推送
```

**SSE事件格式：**
```
event: progress
data: {"task_id": "123", "progress": 50, "status": "processing"}

event: completed
data: {"task_id": "123", "artwork_id": "456", "status": "completed"}

event: failed
data: {"task_id": "123", "error": "Generation failed", "status": "failed"}
```

### 设置API

```
GET    /api/settings          # 获取设置
PUT    /api/settings          # 更新设置
POST   /api/settings/test    # 测试API连接
```

## 状态管理设计

### artworkStore

```typescript
interface ArtworkStore {
  artworks: Artwork[];
  selectedArtwork: Artwork | null;
  filters: FilterOptions;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchArtworks: () => Promise<void>;
  selectArtwork: (id: string) => void;
  setFilters: (filters: FilterOptions) => void;
  toggleFavorite: (id: string) => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;
}
```

### taskStore

```typescript
interface TaskStore {
  tasks: Task[];
  activeTasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (params: CreateTaskParams) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  updateTaskProgress: (id: string, progress: number) => void;
}
```

### settingsStore

```typescript
interface SettingsStore {
  apiKeys: ApiKeys;
  preferences: UserPreferences;
  isLoading: boolean;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  testApiConnection: (provider: string) => Promise<boolean>;
}
```

## 数据模型

### Artwork

```python
class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(UUID, primary_key=True, default=uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    type = Column(Enum("image", "video"), nullable=False)
    file_path = Column(String, nullable=False)
    thumbnail_path = Column(String)
    prompt = Column(Text, nullable=False)
    style = Column(String)
    parameters = Column(JSON)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

### Task

```python
class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID, primary_key=True, default=uuid4)
    artwork_id = Column(UUID, ForeignKey("artworks.id"))
    type = Column(Enum("image", "video"), nullable=False)
    status = Column(Enum("pending", "processing", "completed", "failed", "paused"), default="pending")
    progress = Column(Float, default=0)
    prompt = Column(Text, nullable=False)
    parameters = Column(JSON)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
```

## 组件设计

### Layout组件

**MainLayout.tsx**
- 包含侧边栏和主内容区
- 响应式布局
- 主题切换

**Sidebar.tsx**
- 导航菜单
- 收藏库
- 折叠/展开状态

**Header.tsx**
- 页面标题
- 搜索框
- 用户操作

### Gallery组件

**ArtworkGrid.tsx**
- 响应式网格布局
- 无限滚动/分页
- 加载状态

**ArtworkCard.tsx**
- 缩略图展示
- 标题和元信息
- 操作按钮（收藏、删除）

**ArtworkDetail.tsx**
- 大图预览
- 详细信息
- 编辑操作

### Creator组件

**CreateModal.tsx**
- 模态对话框容器
- 步骤引导
- 参数表单

**PromptInput.tsx**
- 多行文本输入
- 历史记录
- 字符计数

**StyleSelector.tsx**
- 风格选项网格
- 预览效果
- 自定义参数

### Tasks组件

**TaskList.tsx**
- 任务列表
- 状态筛选
- 批量操作

**TaskCard.tsx**
- 任务信息
- 进度条
- 操作按钮

**TaskProgress.tsx**
- 进度可视化
- 预计时间
- 日志输出

## 样式设计

### 颜色系统

```css
:root {
  /* 背景色 */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a2e;

  /* 文字色 */
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;

  /* 强调色 */
  --accent-primary: #00ff88;
  --accent-secondary: #ff6b6b;
  --accent-tertiary: #6b8bff;

  /* 状态色 */
  --success: #00ff88;
  --warning: #ffaa00;
  --error: #ff6b6b;
  --info: #6b8bff;
}
```

### 组件样式

**卡片组件：**
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.1);
}
```

**按钮组件：**
```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #00cc6a;
  transform: translateY(-1px);
}
```

## 测试计划

### 单元测试
- 组件渲染测试
- 状态管理测试
- API服务测试

### 集成测试
- 组件交互测试
- API集成测试
- 状态流转测试

### E2E测试
- 完整用户流程测试
- 跨平台兼容性测试
- 性能测试

## 部署计划

### 开发环境
- 前端：Vite开发服务器
- 后端：FastAPI开发服务器
- 数据库：本地PostgreSQL

### 生产环境
- 前端：Tauri打包
- 后端：打包为Python可执行文件
- 数据库：本地PostgreSQL

## 后续扩展

### 功能扩展
- 批量生成
- 模板系统
- 协作功能
- 云端同步

### 性能优化
- 图片懒加载
- 虚拟滚动
- 缓存策略
- 离线支持
