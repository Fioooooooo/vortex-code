## Why

Pipeline 页面的 Sidebar 骨架和 Tab 切换已就位，但主区域为空。用户选中某个 Run 后，需要看到完整的运行详情：横向 Stage 流概览、当前活动 stage 自动定位、每种 stage 类型的结构化详情面板（Summary + Agent Log 双视图）、以及 Orchestrator 折叠抽屉。这是用户与 Pipeline 交互的核心视图。

## What Changes

- **新增** Run 详情主视图组件 `PipelineRunDetail.vue`：顶部 Run 头信息 + 横向 Stage 流 + 下方 Stage 详情面板
- **新增** 横向 Stage 流组件 `StageFlow.vue`：节点 + 连接线 + Gate 菱形标记，点击切换选中 stage，运行中/人工介入时自动定位到活动 stage
- **新增** 5 种 Stage 详情面板组件：`DiscussStagePanel.vue`、`CodeStagePanel.vue`、`TestStagePanel.vue`、`ReviewStagePanel.vue`、`DeployStagePanel.vue`
- **新增** 每个 Stage 面板支持 Summary / Agent Log 双视图切换
- **新增** Orchestrator 折叠抽屉组件 `OrchestratorDrawer.vue`：默认折叠，展开后显示 Orchestrator 消息流
- **新增** 空态视图：未选中任何 Run 时的引导页面
- **修改** 已有 `pipeline-stage-visualization` spec 的节点渲染规则（适配新的横向布局）

## Capabilities

### New Capabilities

- `pipeline-run-detail`: Run 详情主视图的布局、Stage 选中交互、自动定位、双视图切换、Orchestrator 抽屉
- `pipeline-stage-panels`: 5 种 stage 类型的结构化详情面板内容定义

### Modified Capabilities

- `pipeline-stage-visualization`: 新增"选中态"视觉样式与"自动定位活动 stage"行为
- `pipeline-page`: 主区域从空白变为根据 Sidebar 选中项渲染 Run 详情或 Template 编辑器

## Impact

- **代码**：新增 ~8 个 Vue 组件；修改 `PipelinePage.vue` 主区域路由逻辑
- **Store**：`pipeline.ts` store 新增 `selectedRunId`、`selectedStageId` 状态与 stage event 订阅
- **IPC**：消费 `pipeline:stage-event` 与 `pipeline:stage-status-changed` 事件
