## Why

Pipeline 的执行需要一个编排层来推进 stage、评估 gate、管理 subagent 生命周期。讨论确定采用 LLM 驱动的 Fyllo Orchestrator Agent 方案——每个 Run 启动一个轻量 LLM agent 作为总管，通过 Tool 调用来 spawn subagent、评估 gate、请求人工介入。这比硬编码状态机更灵活，能自然支持"Fyllo 主动发现问题并介入"的场景。本 change 定义 Orchestrator 的架构、Tool 集合、模型策略、进程管理与退出拦截。

## What Changes

- **新增** Fyllo Orchestrator Agent 架构：每个 Run 对应一个 Orchestrator 实例（main 进程内的 headless Claude Code CLI 进程），按 templateSnapshot 推进 stage
- **新增** Orchestrator Tool 集合（10 个 tool）：`spawn_stage_subagent` / `read_stage_events` / `wait_for_stage_completion` / `evaluate_gate` / `request_user_approval` / `request_user_clarification` / `update_stage_status` / `update_run_status` / `kill_stage_subagent` / `fetch_integration_data`
- **新增** 模型策略：Orchestrator 默认用轻量模型（Haiku / qwen-flash），Subagent 用强模型；用户不可配
- **新增** 进程管理：main 进程维护 `activeRuns: Map<runId, OrchestratorProcess>`，每个 Orchestrator 管理 0~1 个活跃 Subagent
- **新增** 退出拦截：app close 时检测 active runs → 弹确认 → kill 子进程 → 标记 aborted
- **新增** IPC 事件推送：Orchestrator 通过 main 进程向 renderer 推送 `onRunStatusChanged` / `onStageStatusChanged` / `onStageEvent` / `onClarificationRequested`

## Capabilities

### New Capabilities

- `pipeline-orchestrator`: Fyllo Orchestrator Agent 的职责定义、Tool 集合、编排循环、模型策略与进程生命周期管理
- `pipeline-exit-interception`: App 退出时的 Pipeline 运行检测、用户确认、子进程清理与状态标记

### Modified Capabilities

- `pipeline-runs`: 新增 Run 的 `createRun` 行为需触发 Orchestrator 启动；`abortRun` 需 kill Orchestrator + Subagent

## Impact

- **代码**：新增 `electron/main/services/pipeline-orchestrator.ts`（Orchestrator 管理）、`electron/main/services/pipeline-tools.ts`（Tool 实现）；修改 `electron/main/index.ts`（退出拦截）
- **进程**：每个 active Run 增加 1 个 Orchestrator 进程 + 0~1 个 Subagent 进程
- **IPC**：新增 4 个事件通道（run/stage status changed、stage event、clarification requested）
- **依赖**：需要 Claude Code CLI 的 headless 启动能力（`claude --headless` 或等效 SDK 调用）
