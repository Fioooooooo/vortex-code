## Context

`pipeline-data-model` 定义了 `PipelineRun.triggerInput`（sourceType + raw + resolved）与 `InputSpec`（模板声明的输入来源）。`pipeline-orchestrator-architecture` 定义了 `createRun` 触发 Orchestrator 启动。本 change 实现前端的创建 Run 流程。

## Goals / Non-Goals

**Goals:**

- 实现 New Run 对话框的完整交互
- 支持 Manual 文本输入与 Integration 任务选择两种输入源
- 模板选择默认使用项目默认模板
- 创建后自动选中新 Run 并跳转到详情视图

**Non-Goals:**

- 不支持在创建时修改 stage 配置（改配置去模板编辑器）
- 不支持批量创建 Run
- 不支持 Webhook 触发

## Decisions

### Decision 1: 对话框布局

```
┌─────────────────────────────────────────┐
│  New Pipeline Run                  [×] │
├─────────────────────────────────────────┤
│  Template                               │
│  [ Standard Dev Flow         ▼ ]       │
│  Stages: Discuss → Code → Test → Review │
│                                         │
│  Trigger Input                          │
│  ○ Text                                 │
│  ● From integration: [云效 ▼]           │
│  [ Task #12345  ▼ ]                     │
│                                         │
│  Run Title (optional)                   │
│  [ Auto-generated from input          ] │
│                                         │
│              [Cancel]    [Start Run]    │
└─────────────────────────────────────────┘
```

### Decision 2: 模板选择默认值

- 若项目有设为默认的模板（`isDefault: true`），自动选中
- 否则选中第一个内置模板（Standard Dev Flow）
- 选中模板后下方显示 stage 序列预览（只读，不可编辑）

### Decision 3: 输入源切换

- Radio 切换 Manual / Integration
- Manual：显示 textarea
- Integration：显示 integration 下拉（仅已 connected）+ 任务选择下拉
- 模板的 `inputSpec.acceptedSources` 决定哪些选项可用；若只有一种，不显示 radio

### Decision 4: 创建后行为

- 点击 Start Run → 调用 `createRun` IPC → 关闭对话框 → Sidebar 自动选中新 Run → 主区域跳转到 Run 详情
- 创建失败（如 integration 拉取失败）→ 对话框内显示错误，不关闭

## Risks / Trade-offs

- **[风险] Integration 任务列表加载慢** → 缓解：下拉显示 loading 状态；支持搜索过滤
- **[Trade-off] 不支持创建时改 stage** → 简化流程，但用户想临时调整需先去改模板
