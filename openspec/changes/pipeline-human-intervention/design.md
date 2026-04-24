## Context

`pipeline-orchestrator-architecture` 定义了 `request_user_approval` 和 `request_user_clarification` 两个 tool，它们会暂停 Run 并 emit IPC 事件给 renderer。`pipeline-run-detail-view` 定义了 Run 详情主视图。本 change 在此基础上实现人工介入的 UI 闭环。

**两种人工介入的区别：**

- **Gate Approval**：用户预设的 `manual-approval` Gate，Stage 完成后触发，用户 approve/reject
- **Fyllo Clarification**：Orchestrator 运行时主动触发，可能在任何 stage 中发生，用户回答问题

## Goals / Non-Goals

**Goals:**

- 实现 Gate 审批 UI（Approve / Reject 按钮 + 审批原因）
- 实现 Fyllo Clarification 响应 UI（问题展示 + 回答输入）
- 实现 Sidebar Run 列表的 4 种状态指示器
- 实现 Sidebar Run 列表项的紧凑 stage 进度指示器

**Non-Goals:**

- 不做通知系统（桌面通知、声音提醒等，V2+）
- 不做审批历史记录（V2+）
- 不做多用户审批（V2+）

## Decisions

### Decision 1: Gate 审批 UI 位置

Gate 审批操作条出现在 Stage Detail Panel 底部（固定定位，不随内容滚动）：

```
├─────────────────────────────────────────────────────────────┤
│  ⚠️  Manual approval required                               │
│  Gate: Pre-deploy confirmation                              │
│  Reason (optional): [________________]                      │
│                                  [Reject]    [Approve]      │
└─────────────────────────────────────────────────────────────┘
```

仅当选中的 stage 处于 `waiting-approval` 时显示。

### Decision 2: Fyllo Clarification UI 位置

Clarification 横幅出现在 Run 详情区顶部（Stage Flow 上方），因为它是 Run 级别的事件，不属于某个特定 stage：

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Fyllo needs your input                                  │
│  "Found 3 candidate files. Which should I modify?"          │
│  [________________] [Send]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Decision 3: Sidebar 状态指示器

Run 列表项左侧显示状态点，映射规则：

- `running` → 🔵 蓝色脉冲点
- `waiting-approval` / `waiting-clarification` → 🟡 黄色点
- `completed` → 🟢 绿色点
- `failed` / `aborted` → 🔴 红色点
- `created` → ⚪ 灰色空心点

### Decision 4: 紧凑 stage 进度指示器

Run 列表项中显示一行紧凑的 stage 进度：

```
●●●○○ Code (3/5)
```

- 实心圆 = passed/running
- 空心圆 = pending/skipped
- 当前 stage 名称 + 进度分数

### Decision 5: 审批/回答后的 UI 更新

- Approve → IPC `approveGate` → Orchestrator resume → Stage 状态变为 `passed` → UI 自动更新
- Reject → IPC `approveGate(reject)` → Stage 状态变为 `failed` → Orchestrator 按 failureStrategy 处理
- Clarification 回答 → IPC `respondClarification` → Orchestrator resume → Run 状态回到 `running`

所有状态变更通过已有的 `pipeline:run-status-changed` / `pipeline:stage-status-changed` 事件驱动 UI 更新。

## Risks / Trade-offs

- **[风险] 用户不在 Pipeline 页时错过介入请求** → 缓解：MVP 不做通知，但 Sidebar 状态点足够醒目；V2 加桌面通知
- **[Trade-off] Clarification 横幅遮挡 Stage Flow** → 缓解：横幅可关闭（关闭后在 Orchestrator 抽屉中仍可见）
