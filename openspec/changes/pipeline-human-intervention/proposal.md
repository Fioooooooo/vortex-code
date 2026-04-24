## Why

Pipeline 运行中有两种人工介入场景：1) 用户预设的 manual-approval Gate 等待审批；2) Fyllo Orchestrator 主动发现问题请求用户确认（clarification）。用户需要在 UI 上看到哪些 Run 需要介入（Sidebar 状态指示），并能在详情页完成审批/回答操作。这是 Pipeline 自动化闭环的最后一环。

## What Changes

- **新增** Gate 审批 UI：Stage 处于 `waiting-approval` 时，详情面板底部显示 Approve / Reject 按钮
- **新增** Fyllo Clarification 响应 UI：Run 处于 `waiting-clarification` 时，详情区顶部显示问题横幅与回答输入
- **新增** Sidebar Run 列表状态指示器：4 种视觉状态（运行中/需要介入/完成/失败）
- **新增** Sidebar Run 列表项的紧凑 stage 进度指示器
- **修改** pipeline store：新增 `approveGate` / `respondClarification` action

## Capabilities

### New Capabilities

- `pipeline-gate-approval-ui`: Gate 审批操作的 UI 交互定义
- `pipeline-clarification-ui`: Fyllo clarification 响应的 UI 交互定义
- `pipeline-sidebar-status`: Sidebar Run 列表的状态指示器与进度指示器

### Modified Capabilities

- `pipeline-runs`: Run 列表项新增状态点与进度指示器

## Impact

- **代码**：新增 ~4 个 Vue 组件；修改 `PipelineSidebar.vue` 列表项渲染
- **Store**：pipeline store 新增 `approveGate` / `respondClarification` action
- **IPC**：消费 `approveGate` / `respondClarification` handler + 订阅 `pipeline:clarification-requested` 事件
