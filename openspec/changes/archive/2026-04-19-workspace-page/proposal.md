## Why

Vortex Code 需要进入项目后的主工作界面，让用户能够与 AI agent 进行会话交互、查看文件变更对比、管理会话历史。这是从 welcome 页面进入后的核心工作区，没有它用户无法在项目中实际使用 agent 功能。

## What Changes

- 新增 Workspace 页面作为主工作界面，替代当前空白的项目入口
- 新增页面级布局：顶栏 + Activity Bar + 左侧面板 + 中央主区域 + 右侧 Diff 面板
- 新增 Pinia store 管理 workspace 状态（会话、文件树、消息流、diff 面板状态）
- 新增类型定义到 `src/types`，为未来 Electron 共享做准备
- 新增多个子组件：ActivityBar、Sidebar、SessionList、FileTree、ChatArea、MessageCards、DiffPanel、InputBar、ProjectSwitcher 等
- 数据全部在 store 中 mock，不连接真实 API

## Capabilities

### New Capabilities

- `workspace-layout`: Workspace 页面整体布局结构，含顶栏、Activity Bar、左侧面板、中央主区域、右侧 Diff 面板及其响应式行为
- `project-switcher`: 顶栏项目切换器，支持切换项目、新建项目、进入项目设置
- `session-management`: 会话管理，包括会话列表展示、新建会话、会话状态标识、会话操作（重命名/删除/归档）
- `file-tree`: 文件树视图，展示项目目录结构及当前会话产生的文件变更标记
- `chat-interface`: 对话交互区，支持多种消息类型（用户消息、思考过程、文件操作、命令执行、确认请求、普通回复）
- `diff-panel`: 右侧 Diff 面板，支持 side-by-side / inline 两种模式，展示文件变更对比
- `agent-controls`: 输入栏及功能条，含 agent 切换、自动/手动模式切换、消息发送

### Modified Capabilities

- （无现有 spec 需要修改）

## Impact

- 新增文件：主要集中在 `src/components/workspace/`、`src/stores/workspace.ts`、`src/types/workspace.ts`
- 修改文件：`src/pages/` 下新增 workspace 入口页面，`src/layouts/` 可能需要调整
- 依赖：Nuxt UI v4、lucide-vue-next、Pinia（已有）
- 无 API 变更，全部数据 mock
