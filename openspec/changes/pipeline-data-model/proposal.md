## Why

Pipeline 模块需要承载多 stage 自动化开发流程（Discuss → Code → Test → Review → Deploy），由 LLM 驱动的 Fyllo Orchestrator 调度 subagent 并落地结构化输出。现有 `shared/types/pipeline.ts` 已有初版类型，但缺少运行时快照机制、事件流结构、统一的 Gate 类型约束与 Review 分级阈值，也没有定义持久化文件布局与内置模板。本 change 统一锁定数据模型与持久化规范，作为后续 5 个 change 的共同地基。

## What Changes

- **新增** `PipelineTemplate.templateSnapshot` 机制：Run 创建时深拷贝模板到 `run.json`，源模板变更/删除不影响历史 Run
- **新增** `StageEvent` 结构化事件流类型，覆盖 agent-message / tool-call / file-change / test-result / review-comment / deploy-log / clarification / gate-evaluated
- **新增** Gate 类型预设（5 种）：`test-pass-rate` / `coverage` / `no-critical-issue` / `build-success` / `manual-approval`；移除现有 `custom-script` 类型
- **新增** Review Severity 5 级分类：`blocker` / `critical` / `major` / `minor` / `info`，模板可配置允许通过的最高严重度
- **新增** Run 状态 `waiting-approval` / `waiting-clarification` / `aborted`，Stage 状态沿用 `pending/running/passed/failed/skipped/waiting-approval`
- **新增** 持久化文件布局规范：`data/pipelines/templates/*.json` + `data/pipelines/runs/<runId>/{run.json, stages/<stageId>/{events.jsonl, output.json}}`
- **新增** 3 个内置模板定义：Standard Dev Flow、Quick Fix、Review Only
- **BREAKING** 重构 `shared/types/pipeline.ts`：调整 `PipelineStageConfig`（gates 改为联合类型）、`PipelineStageRun`（加 events 引用）、`PipelineRun`（加 templateSnapshot 与新状态）、`ReviewComment`（severity 改为 5 级）
- **新增** `InputSpec` 类型：模板声明支持的输入来源（`manual` / `integration-task`）与允许的 integration 列表

## Capabilities

### New Capabilities

- `pipeline-persistence`: Pipeline 数据模型（Template/Run/Stage/Event/Gate）与文件持久化规范，包括 templateSnapshot 机制、JSONL 事件流、原子写入与恢复语义
- `pipeline-builtin-templates`: 内置模板集合（Standard Dev Flow、Quick Fix、Review Only）的定义、首次启动注入与版本升级策略

### Modified Capabilities

（本 change 专注底层数据，UI specs 的修改由 Phase 2/3 的 change 处理）

## Impact

- **代码**：`shared/types/pipeline.ts` 重构；`electron/main/ipc/pipeline.ts` 持久化层改写；`frontend/src/stores/pipeline.ts` 类型同步
- **数据**：开发/生产环境下的 `data/pipelines/` 目录结构；首次启动需写入内置模板
- **依赖**：无新增第三方依赖；JSONL 写入用 Node `fs.appendFile`
- **下游 change**：所有后续 pipeline-\* change 依赖本 change 定义的类型与持久化契约
