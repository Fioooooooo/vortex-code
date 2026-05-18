## Why

Archive 阶段当前复用 apply 最后一个 stage 的 `fylloSessionId` 启动 `AcpSession`，导致两个直接故障与一个架构债：

1. **Archive 的 system-reminder 注不进去。** `AcpSession.start` 检测到该 `fylloSessionId` 已有持久化 `acpSessionId`，走 direct-prompt 分支后直接 `return`，永远不进入 `completeRecoveredPrompt`，因此 `resolveReminderParts` 不会被调用，archive 的 system prompt 完全失效。
2. **Apply 的 stage session-meta 被 archive 覆盖污染。** 共享 `fylloSessionId` 让 archive turn 把自己的 `acpSessionId / turnCount / available_commands` 写到 `sessions/run-{runId}-{N}.json` 上，stage 元数据归属混乱。
3. **`AcpSession` 与 `session-store` 强耦合。** apply / archive 流程根本不需要 chat 列表展示用的 `title / turnCount / tokenUsage / available_commands`，但因为 `AcpSession` 内部硬编码 `loadSessionMeta` / `upsertSessionMeta`，每个 stage 都被迫产出冗余的 `run-{runId}-{N}.json` 与 `run-{runId}-{N}.messages.jsonl`。chat / apply / archive 三个流程对 ACP 持久化的需求完全不同，但被同一个 store 实现绑死，后续再增 stage 类型必然继续踩同一个坑。

## What Changes

- **新增** `AcpSessionStore` 接口（`domain/chat/`），契约仅含 `loadAcpSessionId` / `persistAcpSessionId`；`AcpSession` 通过依赖注入接收 store 实例，不再 import `session-store`。
- **新增** 三套 `AcpSessionStore` 实现：
  - `ChatAcpSessionStore`（`infra/storage/`）：包装现有 `loadSessionMeta` / `upsertSessionMeta`，保持 chat 列表所需字段写入行为不变。
  - `ApplyStageAcpSessionStore`（`infra/storage/`）：读写 `run.json` 的 `stageAcpSessionIds[stageIndex]` 字段。
  - `ArchiveAcpSessionStore`（`infra/storage/`）：读写 `archive.json` 新增的 `acpSessionId` 字段。
- **新增** `newArchiveFylloSessionId(runId)` id 工厂（`infra/ids`），格式 `run-{runId}-archive`；archive 阶段不再复用 stage 的 `fylloSessionId`。
- **修改** `proposal:archive` handler：
  - 用 `newArchiveFylloSessionId(runId)` 作为 archive 的 `fylloSessionId`。
  - `agentId` 直接从 `runMeta.stages[N].agent` 取（`N` 为最后一个完成的 stage），不再调用 `loadSessionMeta(stageFylloSessionId)`。
  - apply session 是否就绪的判据改读 `runMeta.stageAcpSessionIds[N]`，不再依赖 stage 的 session-meta 文件存在性。
- **修改** `ArchiveRunMeta` 类型：新增可选字段 `acpSessionId?: string`，由 `ArchiveAcpSessionStore` 持续维护。
- **BREAKING（仅运行时副作用，无对外 IPC 契约变化）** apply / archive 路径完全不再触达 `session-store.ts`：
  - 不再产出 `data/projects/<encoded>/sessions/run-{runId}-{N}.json`。
  - 不再产出 `data/projects/<encoded>/sessions/run-{runId}-{N}.messages.jsonl`（此文件本就从未被写入，仅类型上由 store 内部 ensure）。
  - `session-store.ts` 服务边界收窄至 `owner === "chat"`。
  - 旧的残留 `run-{runId}-{N}.*` 文件不主动迁移、不主动清理（保留供排错）。
- **修改** `AcpSessionOpts`：新增 `sessionStore: AcpSessionStore` 字段（必填），替换 `AcpSession` 内部对 `session-store` 的直接依赖。`owner` 字段保留，用途收窄为 reminder resolver 路由、log prefix、`SessionRegistry` 命名空间。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `acp-chat-backend`：`AcpSession` 通过注入的 `AcpSessionStore` 完成 `acpSessionId` 持久化，不再硬编码 `session-store` 调用；`AcpSessionOpts` 新增 `sessionStore` 必填字段。
- `proposal-apply-run`：archive 阶段使用独立 `fylloSessionId`（`run-{runId}-archive`），`ArchiveRunMeta` 新增 `acpSessionId` 字段；archive handler 不再调用 `loadSessionMeta`，`agentId` 来源切换为 `runMeta.stages[N].agent`，apply 就绪判据切换为 `runMeta.stageAcpSessionIds[N]`。
- `session-meta-storage`：明确 `session-store.ts` 服务边界限定为 chat owner，apply / archive owner 不通过本模块持久化任何字段。

## Impact

### 受影响代码

- `electron/main/services/chat/acp-session.ts`：构造参数新增 `sessionStore`；`prepareStartContext` / `persistResolvedSession` / `persistSessionMeta` 方法重写，去掉 `loadSessionMeta` / `upsertSessionMeta` 调用。
- `electron/main/domain/chat/acp-session-store.ts`（新文件）：定义 `AcpSessionStore` 接口。
- `electron/main/infra/storage/chat-acp-session-store.ts`（新文件）：chat 实现。
- `electron/main/infra/storage/apply-stage-acp-session-store.ts`（新文件）：apply stage 实现。
- `electron/main/infra/storage/archive-acp-session-store.ts`（新文件）：archive 实现。
- `electron/main/infra/ids/index.ts`：新增 `newArchiveFylloSessionId`。
- `electron/main/ipc/chat.ts`：构造 `ChatAcpSessionStore` 并注入 `AcpSession`。
- `electron/main/ipc/proposal-apply.ts`：apply 路径注入 `ApplyStageAcpSessionStore`，archive 路径注入 `ArchiveAcpSessionStore`，archive 启动逻辑改造（独立 fylloSessionId、agentId 来源切换、apply 就绪判据切换）。
- `electron/main/services/proposal/apply-run-service.ts`：可能新增辅助函数 `readStageAgent(runMeta, stageIndex)` / `readStageAcpSessionId(runMeta, stageIndex)`（避免在 IPC 层直接索引）。
- `electron/main/infra/storage/apply-run-store.ts`：`ArchiveRunMeta` 序列化路径新增 `acpSessionId` 字段；新增字段级更新函数 `updateArchiveRunAcpSessionId(projectPath, changeId, acpSessionId)`。
- `shared/types/proposal.ts`：`ArchiveRunMeta` 类型新增 `acpSessionId?: string`。

### 受影响 IPC / 持久化契约

- 无对外 IPC 通道变更。
- `archive.json` 文件结构追加可选字段 `acpSessionId`；旧文件读取兼容（缺失视为 undefined）。
- `sessions/` 目录写入行为变化：apply / archive 不再产生新文件，仅 chat 写入。
- `session-store.ts` 公开 API 不变（仍向其他 chat 调用方提供完整字段集）。

### 测试

- `electron/main/__tests__/services/chat/acp-session.spec.ts`：替换对 `session-store` mock 的依赖，改 mock `AcpSessionStore`。
- `electron/main/__tests__/ipc/proposal-apply.spec.ts`：覆盖 archive 走 newSession 路径并触发 reminder 注入；覆盖 archive 启动时不再调用 `loadSessionMeta`。
- 新增三个 store 的单元测试。
