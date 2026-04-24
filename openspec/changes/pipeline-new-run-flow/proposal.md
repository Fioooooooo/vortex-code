## Why

用户需要一个简洁的入口来启动 Pipeline Run：选择模板、提供输入（手动文本或从已连接 integration 拉取任务）、点击开始。MVP 阶段采用"两步流"——选模板 + 提供输入，不允许在创建时修改 stage 配置。

## What Changes

- **新增** New Run 对话框组件 `NewRunDialog.vue`：模板选择 + 输入源选择 + Run 标题 + 开始按钮
- **新增** 输入源切换逻辑：Manual 文本输入 vs Integration 任务选择（仅已 connected 的）
- **新增** Sidebar Runs Tab 顶部的"+ New Run"按钮
- **修改** pipeline store：新增 `createRun` action，调用 IPC 创建 Run 并触发 Orchestrator 启动

## Capabilities

### New Capabilities

- `pipeline-new-run`: 创建 Run 对话框的完整交互定义，包括模板选择、输入源切换、integration 任务拉取、Run 创建

### Modified Capabilities

- `pipeline-runs`: Sidebar Runs Tab 新增"+ New Run"按钮入口

## Impact

- **代码**：新增 ~2 个 Vue 组件；修改 `PipelineSidebar.vue` 添加按钮
- **Store**：pipeline store 新增 `createRun` action
- **IPC**：消费 `createRun` handler + `fetch_integration_data`（拉取云效任务列表）
