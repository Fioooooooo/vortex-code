## ADDED Requirements

### Requirement: Gate 审批操作条

系统 SHALL 在选中的 stage 处于 `waiting-approval` 状态时，在 Stage Detail Panel 底部显示固定的审批操作条。

#### Scenario: 显示审批操作条

- **WHEN** 用户查看处于 `waiting-approval` 状态的 stage
- **THEN** Stage Detail Panel 底部显示审批操作条
- **AND** 操作条包含 Gate 名称/描述、可选的 reason 输入框、Approve 按钮和 Reject 按钮

#### Scenario: 点击 Approve

- **WHEN** 用户点击 Approve 按钮
- **THEN** 调用 `approveGate` IPC（decision: 'approve'）
- **AND** 按钮显示 loading 状态
- **AND** Stage 状态变为 `passed` 后操作条消失

#### Scenario: 点击 Reject

- **WHEN** 用户点击 Reject 按钮
- **THEN** 调用 `approveGate` IPC（decision: 'reject'）
- **AND** Stage 状态变为 `failed` 后操作条消失
- **AND** Orchestrator 按 failureStrategy 处理后续

#### Scenario: 非 waiting-approval 状态不显示

- **WHEN** 选中的 stage 不处于 `waiting-approval` 状态
- **THEN** 不显示审批操作条
