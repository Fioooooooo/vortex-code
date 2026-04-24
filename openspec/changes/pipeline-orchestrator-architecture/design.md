## Context

Pipeline 数据模型（`pipeline-data-model` change）定义了 Template/Run/Stage/Event/Gate 的类型与持久化规范。本 change 在此基础上定义"谁来推进 Run"——即 Fyllo Orchestrator Agent 的架构。

**核心架构决策（已在讨论中确定）：** 采用 LLM-driven Agent 方案（方案 A），而非硬编码状态机。Orchestrator 本身是一个 headless Claude Code CLI 实例，通过 system prompt + tool 集合来编排 pipeline。

**双层 Agent 架构：**

```
Main Process
  └─ Orchestrator (轻量 LLM, per Run)
       └─ Subagent (强 LLM, per active Stage)
```

## Goals / Non-Goals

**Goals:**

- 定义 Orchestrator 的 system prompt 结构与 tool 集合
- 定义 Orchestrator ↔ Main Process ↔ Renderer 的事件通信机制
- 定义模型策略（Orchestrator 用轻量模型，Subagent 用强模型）
- 定义进程生命周期管理（启动、监控、清理）
- 定义退出拦截流程

**Non-Goals:**

- 不定义 Orchestrator 的具体 prompt 文案（由调试迭代确定）
- 不定义 Subagent 的 prompt 模板内容（模板配置层面，属于 data-model）
- 不实现 UI（归 Phase 2 change）
- 不支持多 Orchestrator 并行调度同一 Run 的多个 stage（MVP 串行）

## Decisions

### Decision 1: Orchestrator 为 headless Claude Code CLI 进程

每个 Run 启动一个独立的 Claude Code CLI 进程（`claude --headless` 或 Agent SDK 等效调用）。Orchestrator 的 system prompt 包含：

- 角色定义（"你是 Pipeline 编排器"）
- templateSnapshot 的 YAML 表示（stage 序列、gate 配置、失败策略）
- 可用 tool 列表

Orchestrator 的编排循环是自然语言驱动的：

```
for each stage in template:
  spawn_stage_subagent(stage)
  wait_for_stage_completion(stage)
  for gate in stage.gates:
    evaluate_gate(gate) or request_user_approval(gate)
    handle failure according to stage.failureStrategy
  update_stage_status(stage, 'passed')
update_run_status('completed')
```

**理由：** LLM 驱动的编排天然支持"主动介入"——Orchestrator 可以在任意时刻判断需要用户确认，而不需要预设所有决策点。

### Decision 2: Tool 集合（10 个 MVP tool）

| Tool                         | 同步/异步               | 作用                                            |
| ---------------------------- | ----------------------- | ----------------------------------------------- |
| `spawn_stage_subagent`       | 异步（fire-and-forget） | 启动 stage 的 headless CC CLI 子进程            |
| `read_stage_events`          | 同步                    | 读取某 stage 的最新事件（尾部 N 条）            |
| `wait_for_stage_completion`  | 同步阻塞                | 阻塞等待 subagent 进程退出                      |
| `evaluate_gate`              | 同步                    | 读取 stage output，按 gate 配置判定通过/失败    |
| `request_user_approval`      | 同步阻塞                | 暂停 Run，等用户在 UI 上 approve/reject         |
| `request_user_clarification` | 同步阻塞                | 暂停 Run，向用户提问并等待回答                  |
| `update_stage_status`        | 同步                    | 更新 stage 状态并 emit IPC 事件                 |
| `update_run_status`          | 同步                    | 更新 run 状态并 emit IPC 事件                   |
| `kill_stage_subagent`        | 同步                    | 终止当前 subagent（用于 abort/retry）           |
| `fetch_integration_data`     | 同步                    | 从已连接 integration 拉取数据（如云效任务详情） |

**关键设计：** 所有"等待"类 tool 都是同步阻塞的。这让 Orchestrator 的推理模式保持简单——调用 tool → 等结果 → 决定下一步。

### Decision 3: 模型策略由 FylloCode 内置

- Orchestrator：轻量模型（Haiku 4.5 / qwen-flash 等），成本低、响应快
- Subagent：强模型（Sonnet 4.6 / Opus 4.6），代码生成质量高

用户不可配置模型选择。这是 FylloCode 的最佳实践，由我们调试确定。

**理由：** 模型选择是专业决策，暴露给用户只会增加困惑。Orchestrator 的任务（读 gate 配置、判断状态、调用 tool）不需要强模型。

### Decision 4: 进程管理

Main 进程维护 `activeRuns: Map<runId, OrchestratorHandle>`：

```ts
interface OrchestratorHandle {
  runId: string;
  process: ChildProcess; // Orchestrator 进程
  subagentProcess?: ChildProcess; // 当前活跃的 Subagent 进程
  status: "running" | "waiting";
}
```

- `createRun` → spawn Orchestrator 进程 → 加入 `activeRuns`
- Orchestrator 调用 `spawn_stage_subagent` → main 进程 spawn Subagent → 记录到 handle
- Subagent 退出 → main 进程通知 Orchestrator（通过 tool 返回值）
- Orchestrator 退出 → main 进程从 `activeRuns` 移除 → 更新 Run 状态

### Decision 5: Orchestrator ↔ Main ↔ Renderer 事件流

```
Subagent stdout → Main 解析 → appendStageEvent() → ipcMain.emit('stage-event')
                                                   → Renderer onStageEvent handler
```

Orchestrator 的 tool 调用（如 `update_run_status`）也通过 main 进程 emit IPC 事件。Renderer 订阅 4 个事件通道：

- `pipeline:run-status-changed` — Run 状态变更
- `pipeline:stage-status-changed` — Stage 状态变更
- `pipeline:stage-event` — 新 StageEvent 产生
- `pipeline:clarification-requested` — Fyllo 请求用户确认

### Decision 6: 退出拦截

App `before-quit` 事件中：

1. 检查 `activeRuns.size > 0`
2. 若有活跃 Run → `event.preventDefault()` → 弹确认对话框
3. 用户确认退出 → 遍历 `activeRuns`：kill subagent → kill orchestrator → 标记 Run 为 `aborted`（原因 `app-exit`）→ 允许退出
4. 用户取消 → 恢复正常

### Decision 7: Subagent 输出解析

Subagent（headless CC CLI）的 stdout 是结构化 JSON stream。Main 进程负责：

1. 逐行读取 stdout
2. 解析为 `StageEvent`（根据 stage type 做类型映射）
3. 调用 `appendStageEvent()` 落库
4. emit IPC 事件给 renderer

不同 stage type 的 subagent 输出映射规则：

- Code stage：file-change 事件从 tool-call（edit/write）中提取
- Test stage：test-result 事件从 subagent 运行测试命令的输出中提取
- Review stage：review-comment 事件从 subagent 的结构化输出中提取
- Deploy stage：deploy-log 事件从命令输出中提取

## Risks / Trade-offs

- **[风险] Orchestrator LLM 决策不可预测** → 缓解：system prompt 严格约束行为边界；MVP 阶段 stage 串行执行，减少决策空间；关键路径（gate 评估）由 tool 代码硬判定，LLM 只负责调用
- **[风险] 轻量模型能力不足** → 缓解：Orchestrator 的任务本质是"按模板顺序调用 tool"，不需要复杂推理；若发现不足可升级模型，用户无感
- **[风险] 子进程泄漏** → 缓解：main 进程 `activeRuns` 集中管理；退出拦截兜底 kill；定期检查 orphan 进程
- **[Trade-off] 同步阻塞 tool 占用 Orchestrator 上下文** → Orchestrator 在等待 subagent 完成期间不消耗 token（阻塞在 tool 调用上）；但长时间运行的 stage 会让 Orchestrator 进程长期存活

## Open Questions

- Claude Code CLI 的 headless 模式具体 API 是什么？需要确认 `claude --headless` 的参数与 stdout 格式
- Orchestrator 的 system prompt 最终文案需要通过实际调试确定，本 change 只定义结构
