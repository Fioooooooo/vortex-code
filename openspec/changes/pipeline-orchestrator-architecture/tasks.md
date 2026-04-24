## 1. Orchestrator 服务骨架

- [ ] 1.1 新增 `electron/main/services/pipeline-orchestrator.ts`：定义 `OrchestratorHandle` 接口与 `activeRuns: Map<runId, OrchestratorHandle>`
- [ ] 1.2 实现 `startOrchestrator(run: PipelineRun): OrchestratorHandle`：构造 system prompt（含 templateSnapshot YAML）、spawn headless Claude Code CLI 进程、注册 stdout 解析管道
- [ ] 1.3 实现 `stopOrchestrator(runId: string)`：kill subagent（如有）→ kill orchestrator → 从 activeRuns 移除

## 2. Tool 实现

- [ ] 2.1 新增 `electron/main/services/pipeline-tools.ts`：导出 10 个 tool 的实现函数
- [ ] 2.2 实现 `spawn_stage_subagent`：构造 subagent system prompt（stage.promptTemplate + 上一 stage output）、spawn headless CC CLI、注册 stdout → StageEvent 解析管道
- [ ] 2.3 实现 `wait_for_stage_completion`：返回 Promise，resolve 于 subagent 进程退出
- [ ] 2.4 实现 `evaluate_gate`：按 GateConfig type 分支判定（test-pass-rate / coverage / no-critical-issue / build-success），返回 `{ passed, reason }`
- [ ] 2.5 实现 `request_user_approval` 与 `request_user_clarification`：更新 Run 状态 → emit IPC 事件 → 返回 Promise（resolve 于用户响应 IPC 回调）
- [ ] 2.6 实现 `update_stage_status` 与 `update_run_status`：更新持久化 + emit IPC 事件
- [ ] 2.7 实现 `kill_stage_subagent`：kill 当前 subagent 进程
- [ ] 2.8 实现 `fetch_integration_data`：调用已有 integration 服务拉取数据（如云效任务详情）

## 3. Subagent 输出解析

- [ ] 3.1 新增 `electron/main/services/pipeline-event-parser.ts`：将 headless CC CLI 的 stdout JSON stream 解析为 `StageEvent`
- [ ] 3.2 实现按 stage type 的事件映射规则（code → file-change、test → test-result、review → review-comment、deploy → deploy-log）
- [ ] 3.3 集成到 `spawn_stage_subagent` 的 stdout 管道中

## 4. IPC 事件推送

- [ ] 4.1 在 `electron/main/ipc/pipeline.ts` 中注册 4 个事件通道：`pipeline:run-status-changed`、`pipeline:stage-status-changed`、`pipeline:stage-event`、`pipeline:clarification-requested`
- [ ] 4.2 在 `electron/preload/index.ts` 中暴露 `window.api.pipeline.events` 订阅接口
- [ ] 4.3 更新 `frontend/src/api/pipeline.ts`：添加事件订阅方法

## 5. IPC 调用层适配

- [ ] 5.1 更新 `createRun` handler：创建 Run 后调用 `startOrchestrator`
- [ ] 5.2 更新 `abortRun` handler：调用 `stopOrchestrator` + 标记 aborted
- [ ] 5.3 新增 `approveGate` 与 `respondClarification` handler：resolve 对应的 Promise

## 6. 退出拦截

- [ ] 6.1 在 `electron/main/index.ts` 的 `before-quit` 事件中检查 `activeRuns.size`
- [ ] 6.2 实现确认对话框（`dialog.showMessageBox`）
- [ ] 6.3 实现 `cleanupAllRuns()`：遍历 activeRuns → kill → 标记 aborted → 写入持久化

## 7. 测试

- [ ] 7.1 为 `evaluate_gate` 编写单元测试（覆盖 5 种 gate type 的通过/失败场景）
- [ ] 7.2 为 `pipeline-event-parser` 编写单元测试（各 stage type 的输出解析）
- [ ] 7.3 为 Orchestrator 启动/停止生命周期编写集成测试
