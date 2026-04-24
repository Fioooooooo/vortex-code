## Context

Pipeline 页面已有 Sidebar（Runs/Templates Tab 切换）和 Activity Bar 入口。主区域当前为空。本 change 填充主区域的 Run 详情视图——用户选中 Sidebar 中的某个 Run 后，右侧展示完整的运行状态与 stage 详情。

**已有资产：**

- `pipeline-stage-visualization` spec 定义了节点状态颜色、连接线、Gate 菱形标记
- `pipeline-stage-details` spec 定义了 5 种 stage 的详情面板内容
- `pipeline-data-model` change 定义了 `StageEvent` 结构化事件流与 `StageOutput` 类型

## Goals / Non-Goals

**Goals:**

- 实现 Run 详情主视图的完整布局与交互
- 实现 5 种 stage 类型的结构化 Summary 面板
- 实现 Agent Log 视图（通用消息流）
- 实现 Orchestrator 折叠抽屉
- 实现运行中/人工介入时的自动定位

**Non-Goals:**

- 不实现 Gate 审批操作 UI（归 `pipeline-human-intervention`）
- 不实现 Template 编辑器视图（归 `pipeline-template-editor`）
- 不实现 Sidebar 列表项的状态指示器（归 `pipeline-human-intervention`）

## Decisions

### Decision 1: 主区域布局为"Run 头 + Stage 流 + Stage 详情"三段式

```
┌─────────────────────────────────────────────────┐
│ Run Header (标题、模板名、时间、Abort 按钮)      │
├─────────────────────────────────────────────────┤
│ Stage Flow (横向节点 + 连接线 + Gate 标记)       │  ← 固定高度 ~80px
├─────────────────────────────────────────────────┤
│ Stage Detail Panel                               │  ← 填充剩余空间，可滚动
│  ┌─────────────────────────────────────────┐    │
│  │ [Summary] [Agent Log]  ← Tab 切换       │    │
│  │                                          │    │
│  │ (按 stage type 渲染不同内容)             │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

Stage Flow 固定在顶部不随详情滚动，保持全局进度可见。

### Decision 2: Stage 选中与自动定位

- 用户点击 Stage Flow 中的节点 → 切换 `selectedStageId` → 下方面板切换
- 运行中时，默认选中当前活动 stage（`status === 'running'` 或 `waiting-approval`）
- Stage 状态变更时（进入下一 stage），自动切换选中到新的活动 stage
- 用户手动选中某个 stage 后，暂停自动定位；直到用户点击"跟随最新"按钮恢复

### Decision 3: Summary vs Agent Log 双视图

每个 Stage 详情面板顶部有 Tab 切换：

- **Summary**：按 stage type 渲染结构化内容（文件变更列表、测试结果表、review 意见列表等）
- **Agent Log**：通用消息流，展示该 stage 的所有 `StageEvent`（agent-message、tool-call 等），类似 chat 界面

两个视图消费同一份 `StageEvent[]` 数据，只是渲染方式不同。

### Decision 4: 5 种 Stage Summary 面板内容

| Stage   | Summary 内容                                                  |
| ------- | ------------------------------------------------------------- |
| Discuss | 需求摘要文本、澄清问答列表、最终确认的需求文档                |
| Code    | 文件变更列表（文件名 + 操作 + diff 统计）、当前动作指示器     |
| Test    | 测试运行摘要（通过/失败/跳过数）、覆盖率、失败用例列表        |
| Review  | review 意见列表（severity badge + 文件位置 + 建议）、整体统计 |
| Deploy  | 部署状态、部署日志流、部署 URL                                |

### Decision 5: Orchestrator 折叠抽屉

- 位于 Stage 详情面板底部，默认折叠
- 展开后显示 Orchestrator 的消息流（思考过程、tool 调用、决策日志）
- 高度可拖拽调整
- 折叠状态下显示一行摘要（如"Orchestrator: Evaluating test gate..."）

### Decision 6: 事件订阅与数据流

```
Renderer 打开 Run 详情
  → store 订阅 pipeline:stage-event (过滤当前 runId)
  → 用户选中某 stage
  → store 调用 IPC 读取该 stage 的 events.jsonl (历史)
  → 后续新事件通过订阅实时追加
```

切换选中 stage 时，清空当前事件缓存，重新加载目标 stage 的事件。

## Risks / Trade-offs

- **[风险] 大量 StageEvent 导致前端内存压力** → 缓解：Agent Log 视图做虚拟滚动；Summary 视图只消费结构化事件子集
- **[风险] 自动定位与用户手动选中冲突** → 缓解：用户手动选中后暂停自动定位，提供"跟随最新"按钮恢复
- **[Trade-off] 5 种 stage 面板各自独立组件** → 代码量较大但每个面板可独立迭代，比通用渲染器更灵活
