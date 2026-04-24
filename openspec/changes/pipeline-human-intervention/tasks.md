## 1. Gate 审批 UI

- [ ] 1.1 新增 `GateApprovalBar.vue`：固定在 Stage Detail Panel 底部，包含 Gate 描述、reason 输入、Approve/Reject 按钮
- [ ] 1.2 实现 Approve 逻辑：调用 `approveGate` IPC → loading → 状态更新后隐藏
- [ ] 1.3 实现 Reject 逻辑：调用 `approveGate(reject)` IPC → loading → 状态更新后隐藏
- [ ] 1.4 集成到 `StageDetailPanel.vue`：仅当选中 stage 为 `waiting-approval` 时渲染

## 2. Fyllo Clarification UI

- [ ] 2.1 新增 `ClarificationBanner.vue`：显示在 Run 详情区顶部，包含问题文本、回答输入、Send 按钮、关闭按钮
- [ ] 2.2 实现 Send 逻辑：调用 `respondClarification` IPC → loading → 状态更新后隐藏
- [ ] 2.3 实现关闭逻辑：隐藏横幅但不改变 Run 状态
- [ ] 2.4 集成到 `PipelineRunDetail.vue`：仅当 Run 为 `waiting-clarification` 时渲染
- [ ] 2.5 订阅 `pipeline:clarification-requested` 事件：接收 clarification 内容

## 3. Sidebar 状态指示器

- [ ] 3.1 新增 `RunStatusDot.vue`：根据 Run status 渲染对应颜色的状态点（running 带脉冲动画）
- [ ] 3.2 新增 `StageProgressIndicator.vue`：紧凑进度圆点 + 当前 stage 名称 + 进度分数
- [ ] 3.3 修改 `PipelineSidebar.vue` Runs Tab 列表项：集成 `RunStatusDot` 和 `StageProgressIndicator`
- [ ] 3.4 实现列表排序：`waiting-*` 和 `running` 置顶，其余按 `updatedAt` 降序

## 4. Store 适配

- [ ] 4.1 在 pipeline store 新增 `approveGate(runId, stageId, gateId, decision)` action
- [ ] 4.2 在 pipeline store 新增 `respondClarification(runId, eventId, response)` action
- [ ] 4.3 更新 `sortedRuns` computed：`waiting-approval` / `waiting-clarification` 与 `running` 同优先级置顶

## 5. 测试

- [ ] 5.1 为 `GateApprovalBar.vue` 编写组件测试（approve/reject 流程）
- [ ] 5.2 为 `ClarificationBanner.vue` 编写组件测试（回答/关闭流程）
- [ ] 5.3 为 `RunStatusDot.vue` 编写组件测试（6 种状态映射）
- [ ] 5.4 为 `sortedRuns` 编写单元测试（排序规则验证）
