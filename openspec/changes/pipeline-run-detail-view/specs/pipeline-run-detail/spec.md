## ADDED Requirements

### Requirement: Run 详情主视图三段式布局

系统 SHALL 在用户选中 Sidebar 中的某个 Run 时，在主区域渲染三段式布局：顶部 Run Header、中部 Stage Flow、底部 Stage Detail Panel。

#### Scenario: 选中 Run 后渲染详情

- **WHEN** 用户在 Sidebar Runs Tab 中点击某个 Run
- **THEN** 主区域渲染该 Run 的详情视图
- **AND** 顶部显示 Run 标题、模板名、开始时间、Abort 按钮
- **AND** 中部显示横向 Stage Flow
- **AND** 底部显示当前选中 Stage 的详情面板

#### Scenario: 未选中 Run 时显示空态

- **WHEN** 用户未选中任何 Run
- **THEN** 主区域显示空态引导页面

### Requirement: Run Header 显示运行元信息

系统 SHALL 在 Run Header 中显示 Run 标题、模板名称、开始时间、运行时长（运行中实时更新）、以及操作按钮。

#### Scenario: 运行中的 Run Header

- **WHEN** Run 状态为 `running`
- **THEN** Header 显示实时更新的运行时长
- **AND** 显示 Abort 按钮

#### Scenario: 已完成的 Run Header

- **WHEN** Run 状态为 `completed`
- **THEN** Header 显示总运行时长
- **AND** 不显示 Abort 按钮

### Requirement: Stage Flow 横向展示所有 stage

系统 SHALL 以横向排列的节点 + 连接线 + Gate 菱形标记渲染 Stage Flow，节点视觉状态遵循 `pipeline-stage-visualization` spec。Stage Flow 固定在详情区顶部，不随下方面板滚动。

#### Scenario: 点击 stage 节点切换详情

- **WHEN** 用户点击 Stage Flow 中的某个 stage 节点
- **THEN** `selectedStageId` 更新为该 stage
- **AND** 下方 Stage Detail Panel 切换为该 stage 的内容

#### Scenario: 选中态视觉样式

- **WHEN** 某个 stage 节点被选中
- **THEN** 该节点显示选中态样式（加粗边框或底部指示器）
- **AND** 其他节点恢复默认样式

### Requirement: 运行中自动定位到活动 stage

系统 SHALL 在 Run 运行中时，默认选中当前活动 stage（`status === 'running'` 或 `waiting-approval` 或 `waiting-clarification`）。当 stage 状态变更导致活动 stage 切换时，自动更新选中。

#### Scenario: 自动跟随活动 stage

- **WHEN** Run 从 Code stage 进入 Test stage
- **AND** 用户未手动选中其他 stage
- **THEN** 选中自动切换到 Test stage
- **AND** 下方面板切换为 Test stage 详情

#### Scenario: 手动选中暂停自动定位

- **WHEN** 用户手动点击了一个非活动 stage（如已完成的 Discuss stage）
- **THEN** 自动定位暂停
- **AND** 即使活动 stage 变更，选中不自动切换

#### Scenario: 恢复自动定位

- **WHEN** 用户点击"跟随最新"按钮
- **THEN** 选中切换回当前活动 stage
- **AND** 恢复自动定位行为

### Requirement: Stage Detail Panel 支持 Summary / Agent Log 双视图

系统 SHALL 在 Stage Detail Panel 顶部提供 Tab 切换，允许用户在 Summary 视图和 Agent Log 视图之间切换。

#### Scenario: 默认显示 Summary

- **WHEN** 用户选中某个 stage
- **THEN** 默认显示 Summary 视图

#### Scenario: 切换到 Agent Log

- **WHEN** 用户点击 Agent Log Tab
- **THEN** 面板切换为该 stage 的完整事件流（agent-message、tool-call 等）
- **AND** 事件按时间顺序排列

### Requirement: Orchestrator 折叠抽屉

系统 SHALL 在 Stage Detail Panel 底部提供 Orchestrator 折叠抽屉，默认折叠，展开后显示 Orchestrator 的消息流。

#### Scenario: 折叠状态

- **WHEN** Orchestrator 抽屉处于折叠状态
- **THEN** 显示一行摘要文本（如"Orchestrator: Evaluating test gate..."）
- **AND** 点击可展开

#### Scenario: 展开状态

- **WHEN** 用户展开 Orchestrator 抽屉
- **THEN** 显示 Orchestrator 的消息流（思考过程、tool 调用、决策日志）
- **AND** 抽屉高度可拖拽调整

### Requirement: 事件数据按需加载

系统 SHALL 在用户选中某个 stage 时，通过 IPC 读取该 stage 的 `events.jsonl` 历史事件，并订阅后续实时事件。切换选中 stage 时清空前一 stage 的事件缓存。

#### Scenario: 加载历史事件

- **WHEN** 用户选中某个已完成的 stage
- **THEN** 系统通过 IPC 读取该 stage 的 `events.jsonl`
- **AND** Summary 视图渲染结构化内容
- **AND** Agent Log 视图渲染完整事件流

#### Scenario: 实时追加新事件

- **WHEN** 用户选中一个运行中的 stage
- **AND** subagent 持续输出
- **THEN** 新事件实时追加到 Agent Log 视图
- **AND** Summary 视图实时更新统计数据
