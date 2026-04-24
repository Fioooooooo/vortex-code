## ADDED Requirements

### Requirement: App 退出时检测活跃 Pipeline Run

系统 SHALL 在 app 的 `before-quit` 事件中检查是否存在活跃的 Pipeline Run（`activeRuns.size > 0`），若存在则拦截退出并弹出确认对话框。

#### Scenario: 有活跃 Run 时退出

- **WHEN** 用户尝试关闭 app
- **AND** 存在至少一个活跃的 Pipeline Run
- **THEN** 系统阻止退出并弹出确认对话框
- **AND** 对话框显示活跃 Run 的数量

#### Scenario: 无活跃 Run 时退出

- **WHEN** 用户尝试关闭 app
- **AND** 不存在活跃的 Pipeline Run
- **THEN** app 正常退出，不弹确认

### Requirement: 用户确认退出后清理所有子进程

系统 SHALL 在用户确认退出后，遍历所有活跃 Run，依次 kill Subagent 进程和 Orchestrator 进程，并将 Run 标记为 `aborted`。

#### Scenario: 确认退出执行清理

- **WHEN** 用户在确认对话框中点击"确认退出"
- **THEN** 系统遍历 `activeRuns`
- **AND** 对每个 Run：kill Subagent（如有）→ kill Orchestrator → 标记 Run 为 `aborted`（原因 `app-exit`）
- **AND** 清理完成后允许 app 退出

#### Scenario: 取消退出

- **WHEN** 用户在确认对话框中点击"取消"
- **THEN** app 不退出
- **AND** 所有 Pipeline Run 继续运行

### Requirement: 重启后不恢复被中止的 Run

系统 SHALL 在 app 重启后，不尝试恢复任何 `aborted` 状态的 Run。被中止的 Run 在列表中显示为 `aborted` 状态。

#### Scenario: 重启后查看被中止的 Run

- **WHEN** app 重启后用户打开 Pipeline 页
- **THEN** 之前被中止的 Run 显示为 `aborted` 状态
- **AND** 不自动重新启动
