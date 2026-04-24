## ADDED Requirements

### Requirement: Sidebar Run 列表项显示状态指示点

系统 SHALL 在 Sidebar Runs Tab 的每个 Run 列表项左侧显示状态指示点，颜色映射 Run 状态。

#### Scenario: 运行中状态

- **WHEN** Run 状态为 `running`
- **THEN** 显示蓝色脉冲点（带动画）

#### Scenario: 需要人工介入状态

- **WHEN** Run 状态为 `waiting-approval` 或 `waiting-clarification`
- **THEN** 显示黄色实心点

#### Scenario: 已完成状态

- **WHEN** Run 状态为 `completed`
- **THEN** 显示绿色实心点

#### Scenario: 失败/中止状态

- **WHEN** Run 状态为 `failed` 或 `aborted`
- **THEN** 显示红色实心点

#### Scenario: 未运行状态

- **WHEN** Run 状态为 `created`
- **THEN** 显示灰色空心点

### Requirement: Sidebar Run 列表项显示紧凑 stage 进度

系统 SHALL 在 Sidebar Runs Tab 的每个 Run 列表项中显示紧凑的 stage 进度指示器，包含进度圆点、当前 stage 名称与进度分数。

#### Scenario: 运行中的进度显示

- **WHEN** Run 有 5 个 stage，当前在第 3 个（Code）
- **THEN** 显示 `●●●○○ Code (3/5)`
- **AND** 实心圆表示 passed/running，空心圆表示 pending/skipped

#### Scenario: 需要介入时的进度显示

- **WHEN** Run 在 Review stage 等待审批
- **THEN** 进度行额外显示"Needs approval"文案

### Requirement: 需要介入的 Run 置顶

系统 SHALL 在 Sidebar Runs Tab 中将 `waiting-approval` 和 `waiting-clarification` 状态的 Run 与 `running` 状态的 Run 一起置顶显示。

#### Scenario: 排序规则

- **WHEN** Sidebar Runs Tab 渲染列表
- **THEN** `running` / `waiting-approval` / `waiting-clarification` 的 Run 置顶
- **AND** 置顶组内按 `updatedAt` 降序
- **AND** 其余 Run 按 `updatedAt` 降序排列
