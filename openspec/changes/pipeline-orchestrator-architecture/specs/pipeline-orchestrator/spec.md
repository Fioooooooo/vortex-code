## ADDED Requirements

### Requirement: 每个 Run 启动一个 Orchestrator Agent

系统 SHALL 在 `createRun` 时启动一个 Fyllo Orchestrator Agent 进程（headless Claude Code CLI），该进程接收 Run 的 `templateSnapshot` 作为上下文，按 stage 顺序编排执行。

#### Scenario: 创建 Run 触发 Orchestrator 启动

- **WHEN** 用户通过 `createRun` API 创建新 Run
- **THEN** 主进程 spawn 一个 Orchestrator 进程
- **AND** Orchestrator 的 system prompt 包含 templateSnapshot 的 stage 序列与 gate 配置
- **AND** Run 状态从 `created` 变为 `running`

#### Scenario: Orchestrator 按 stage 顺序推进

- **WHEN** Orchestrator 开始执行
- **THEN** 按 templateSnapshot 中 stages 的顺序依次处理每个 enabled 的 stage
- **AND** 跳过 `enabled: false` 的 stage

### Requirement: Orchestrator 通过 Tool 集合执行编排

系统 SHALL 为 Orchestrator 提供以下 10 个 Tool：`spawn_stage_subagent`、`read_stage_events`、`wait_for_stage_completion`、`evaluate_gate`、`request_user_approval`、`request_user_clarification`、`update_stage_status`、`update_run_status`、`kill_stage_subagent`、`fetch_integration_data`。

#### Scenario: spawn_stage_subagent 启动子进程

- **WHEN** Orchestrator 调用 `spawn_stage_subagent` 并传入 stage 配置
- **THEN** 主进程 spawn 一个 headless Claude Code CLI 子进程
- **AND** 子进程的 system prompt 来自 stage 的 `promptTemplate`
- **AND** 子进程的输入来自上一 stage 的 `output.json`（首个 stage 使用 Run 的 `triggerInput`）

#### Scenario: evaluate_gate 自动判定

- **WHEN** Orchestrator 调用 `evaluate_gate` 并传入 gate 配置与 stage output
- **THEN** 系统按 gate type 执行判定逻辑（test-pass-rate 比较通过率、coverage 比较覆盖率、no-critical-issue 比较 severity、build-success 检查构建状态）
- **AND** 返回 `{ passed: boolean, reason: string }`

#### Scenario: request_user_approval 阻塞等待

- **WHEN** Orchestrator 调用 `request_user_approval`
- **THEN** Run 状态变为 `waiting-approval`
- **AND** 主进程 emit `pipeline:clarification-requested` 事件给 renderer
- **AND** Tool 调用阻塞直到用户在 UI 上点击 approve 或 reject
- **AND** 返回用户的决定

#### Scenario: request_user_clarification 阻塞等待

- **WHEN** Orchestrator 调用 `request_user_clarification` 并传入问题
- **THEN** Run 状态变为 `waiting-clarification`
- **AND** 主进程 emit `pipeline:clarification-requested` 事件给 renderer
- **AND** Tool 调用阻塞直到用户回答
- **AND** 返回用户的回答文本

### Requirement: Orchestrator 处理 Gate 失败

系统 SHALL 在 Gate 评估失败时，按 stage 的 `failureStrategy` 执行对应操作。

#### Scenario: retry 策略

- **WHEN** Gate 失败且 `failureStrategy = 'retry'` 且重试次数未超过 `maxRetries`
- **THEN** Orchestrator kill 当前 subagent → 重新 spawn subagent 执行同一 stage
- **AND** 重试时将失败原因作为额外上下文传给 subagent

#### Scenario: retry 超过上限

- **WHEN** Gate 失败且重试次数已达 `maxRetries`
- **THEN** Orchestrator 按 `pause` 策略处理（请求用户介入）

#### Scenario: pause 策略

- **WHEN** Gate 失败且 `failureStrategy = 'pause'`
- **THEN** Orchestrator 调用 `request_user_clarification` 告知失败原因并等待用户指示

#### Scenario: skip 策略

- **WHEN** Gate 失败且 `failureStrategy = 'skip'`
- **THEN** Orchestrator 将 stage 标记为 `skipped` 并继续下一 stage

#### Scenario: abort 策略

- **WHEN** Gate 失败且 `failureStrategy = 'abort'`
- **THEN** Orchestrator 将 Run 标记为 `failed` 并退出

### Requirement: Subagent 输出实时转化为 StageEvent

系统 SHALL 在 Subagent 运行期间，由主进程实时解析 Subagent 的 stdout，转化为 `StageEvent` 并追加到 `events.jsonl`，同时 emit IPC 事件给 renderer。

#### Scenario: 实时事件推送

- **WHEN** Subagent 输出一条工具调用结果
- **THEN** 主进程解析为对应类型的 `StageEvent`
- **AND** 追加到 `events.jsonl`
- **AND** emit `pipeline:stage-event` 给 renderer

### Requirement: 模型策略由系统内置

系统 SHALL 为 Orchestrator 使用轻量模型（如 Haiku 4.5），为 Subagent 使用强模型（如 Sonnet 4.6），用户不可配置模型选择。

#### Scenario: 模型不可配置

- **WHEN** 用户查看模板编辑器或 Run 创建流程
- **THEN** 不存在模型选择的 UI 控件

### Requirement: 主进程集中管理活跃 Run

系统 SHALL 在主进程维护 `activeRuns: Map<runId, OrchestratorHandle>`，记录每个活跃 Run 的 Orchestrator 进程与当前 Subagent 进程。

#### Scenario: Run 完成后清理

- **WHEN** Orchestrator 进程正常退出
- **THEN** 主进程从 `activeRuns` 中移除该 Run
- **AND** 更新 Run 状态为 `completed` 或 `failed`

#### Scenario: abortRun 终止所有进程

- **WHEN** 用户调用 `abortRun`
- **THEN** 主进程 kill Subagent 进程（如有）→ kill Orchestrator 进程
- **AND** 从 `activeRuns` 中移除
- **AND** Run 状态标记为 `aborted`
