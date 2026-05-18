## 1. 准备：新增 domain 接口与 id 工厂

- [x] 1.1 在 `electron/main/domain/chat/acp-session-store.ts` 新增 `AcpSessionStore` 接口，包含两个方法 `loadAcpSessionId(): Promise<string | null>` 与 `persistAcpSessionId(acpSessionId: string): Promise<void>`。文件内不得 import 任何 `electron/main/infra/**` 或 `electron/main/services/**` 模块（domain 层依赖约束）。
- [x] 1.2 在 `electron/main/infra/ids/index.ts` 新增 `newArchiveFylloSessionId(runId: string): string`，返回 `${runId}-archive`。
- [x] 1.3 在 `electron/main/__tests__/infra/ids/index.spec.ts` 中为 `newArchiveFylloSessionId` 增加测试：`newArchiveFylloSessionId("run-1")` 等于 `"run-1-archive"`。

## 2. 实现三个 AcpSessionStore

- [x] 2.1 在 `electron/main/infra/storage/chat-acp-session-store.ts` 新增 class `ChatAcpSessionStore implements AcpSessionStore`，构造参数 `(projectPath: string, sessionId: string, agentId: string)`。`loadAcpSessionId` 调用 `loadSessionMeta(projectPath, sessionId)`，返回 `meta?.acpSessionId ?? null`。`persistAcpSessionId(acpSessionId)` 调用 `upsertSessionMeta` 完成字段级更新：写入 `acpSessionId`、`agentId`、`turnCount`（在原 `meta?.turnCount ?? 0` 基础上 `+1`）、`updatedAt`，初始创建场景下使用与 `electron/main/services/chat/acp-session.ts:521-548` `persistSessionMeta` 完全一致的默认值（`title: "New Session"`、`tokenUsage: { used: 0, size: 0 }`、`createdAt: 当前时间`），并保留 `meta?.title`、`meta?.tokenUsage`、`meta?.available_commands` 等已有字段。
- [x] 2.2 在 `electron/main/infra/storage/apply-run-store.ts` 新增字段级更新函数 `updateApplyRunStageAcpSessionId(projectPath: string, changeId: string, runId: string, stageIndex: number, acpSessionId: string): Promise<void>`，内部委托 `updateRunMetaIfCurrent`，仅修改 `meta.stageAcpSessionIds[stageIndex]` 与 `meta.updatedAt`。
- [x] 2.3 在 `electron/main/infra/storage/apply-stage-acp-session-store.ts` 新增 class `ApplyStageAcpSessionStore implements AcpSessionStore`，构造参数 `(projectPath: string, changeId: string, runId: string, stageIndex: number)`。`loadAcpSessionId` 调用 `loadApplyRunMeta(projectPath, changeId)`，若 `meta == null` 或 `meta.runId !== runId` 则 `logger.warn` 后返回 `null`，否则返回 `meta.stageAcpSessionIds[stageIndex] ?? null`。`persistAcpSessionId(acpSessionId)` 调用 task 2.2 新增的 `updateApplyRunStageAcpSessionId`。
- [x] 2.4 在 `electron/main/infra/storage/apply-run-store.ts` 新增字段级更新函数 `updateArchiveRunAcpSessionId(projectPath: string, changeId: string, acpSessionId: string): Promise<void>`，内部 load → 在已有 meta 基础上覆盖 `acpSessionId` 与 `updatedAt` → save，缺 archive.json 时 no-op 并 `logger.warn`。
- [x] 2.5 在 `electron/main/infra/storage/archive-acp-session-store.ts` 新增 class `ArchiveAcpSessionStore implements AcpSessionStore`，构造参数 `(projectPath: string, changeId: string)`。`loadAcpSessionId` 调用 `loadArchiveRunMeta`，返回 `meta?.acpSessionId ?? null`。`persistAcpSessionId` 调用 task 2.4 新增的 `updateArchiveRunAcpSessionId`。
- [x] 2.6 在 `shared/types/proposal.ts` 的 `ArchiveRunMeta` 类型新增可选字段 `acpSessionId?: string`。
- [x] 2.7 在 `electron/main/__tests__/infra/storage/` 下分别为三个 store 增加单元测试文件 `chat-acp-session-store.spec.ts`、`apply-stage-acp-session-store.spec.ts`、`archive-acp-session-store.spec.ts`。每个 store 至少覆盖：load 缺文件返回 null、load 命中、persist 写入、persist 不丢未变更字段（特别是 `available_commands`、`tokenUsage`、`status`、`startedAt`）。
- [x] 2.8 在 `electron/main/__tests__/infra/storage/apply-run-store.spec.ts` 中为 `updateApplyRunStageAcpSessionId` 与 `updateArchiveRunAcpSessionId` 各增加单元测试，验证字段级更新不覆盖未变更字段，以及 runId 不匹配 / 文件缺失场景的 no-op 行为。

## 3. 改造 AcpSession 接受注入

- [x] 3.1 在 `electron/main/services/chat/acp-session.ts` 的 `AcpSessionOpts` 接口中新增必填字段 `sessionStore: AcpSessionStore`（从 `@main/domain/chat/acp-session-store` 引入）。
- [x] 3.2 重写 `prepareStartContext`：移除对 `loadSessionMeta` 的调用与对 `meta` 字段的填充；改为 `const persistedSessionId = await this.opts.sessionStore.loadAcpSessionId();`。从 `StartContext` 接口中删除 `meta: SessionMeta | null` 字段，仅保留 `entry / mcpServers / runtimeState / persistedSessionId`。`logger.info` 中 `bundledMcpServers=...` 输出保持不变。
- [x] 3.3 重写 `persistResolvedSession`：去掉 `meta` 参数与 `persistSessionMeta` 调用，改为 `await this.opts.sessionStore.persistAcpSessionId(acpSessionId);`，随后 emit `session_id_resolved` 事件。删除原有 `persistSessionMeta` 私有方法。
- [x] 3.4 调整 `recoverSession` 签名：将 `meta: SessionMeta | null` 参数替换为 `persistedSessionId: string | null`；内部所有 `meta?.acpSessionId` 引用改用该参数；其余 resume / load / new 决策逻辑保持不变。
- [x] 3.5 调整 `tryHandlePersistedSession`、`runStartFlow`、`completeRecoveredPrompt` 的调用方，与 task 3.2、3.3、3.4 的新签名对齐。
- [x] 3.6 删除 `electron/main/services/chat/acp-session.ts` 中所有对 `@main/infra/storage/session-store` 的 import。运行 ESLint，确保 services 层依赖检查通过。
- [x] 3.7 更新 `electron/main/__tests__/services/chat/acp-session.spec.ts`：mock `AcpSessionStore` 替代 mock `session-store`；至少覆盖以下场景：
  - 持久化 acpSessionId 缺失 → 进入 newSession 路径 → 触发 reminder 注入
  - 持久化 acpSessionId 存在且 direct prompt 成功 → 调用 `sessionStore.persistAcpSessionId`、不注入 reminder
  - direct prompt 因 session missing 失败 → resume 成功 → 调用 `sessionStore.persistAcpSessionId`、不注入 reminder
  - 全部恢复失败 → newSession fallback → 调用 `sessionStore.persistAcpSessionId` + 注入 reminder + 历史 reminder

## 4. chat IPC handler 注入 ChatAcpSessionStore

- [x] 4.1 在 `electron/main/ipc/chat.ts` 的 `chat:stream:message` handler 中，构造 `AcpSession` 之前 `new ChatAcpSessionStore(projectPath, sessionId, agentId)`，并通过 `opts.sessionStore` 传入。
- [x] 4.2 检查 `ipc/chat.ts` 中其余 `loadSessionMeta` / `patchSessionMeta` 调用是否仍合理（如 token usage、available_commands 持久化逻辑）；这些路径不属于本次解耦范围，保持不变。
- [x] 4.3 跑 `pnpm test -- chat` 与 `pnpm test -- acp-session`，验证 chat 路径行为无回归。

## 5. apply IPC handler 注入 ApplyStageAcpSessionStore

- [x] 5.1 在 `electron/main/ipc/proposal-apply.ts` 的 `proposal:stageStream` handler 中，构造 `AcpSession` 之前 `new ApplyStageAcpSessionStore(projectPath, form.changeId, form.runId, form.stageIndex)`，并通过 `opts.sessionStore` 传入。
- [x] 5.2 删除 stage handler 中 `session_id_resolved` 事件分支里现有的 `updateRunMetaIfCurrent` 直接更新 `stageAcpSessionIds[stageIndex]` 的代码（`proposal-apply.ts:149-160`），改由 `ApplyStageAcpSessionStore.persistAcpSessionId` 完成。注意保留 `acpSessionId` 写入 `stageAcpSessionIds[stageIndex]` 的最终行为不变。
- [x] 5.3 跑 `pnpm test -- proposal-apply`，验证 stage stream 路径的 acpSessionId 仍正确写入 `run.json`。

## 6. archive IPC handler 改造

- [x] 6.1 在 `electron/main/ipc/proposal-apply.ts` 的 `proposal:archive` handler 中：
  - 删除 `const fylloSessionId = newStageFylloSessionId(runMeta.runId, completedStageIndex);`
  - 删除 `const sessionMeta = await loadSessionMeta(projectPath, fylloSessionId);`
  - 删除 `if (!sessionMeta?.acpSessionId) throw ipcError(IpcErrorCodes.APPLY_SESSION_NOT_READY, ...)` 检查
  - 改为：从 `runMeta.stages[completedStageIndex].agent` 读 `agentId`，若为空抛 `ipcError(IpcErrorCodes.VALIDATION_ERROR, "stage.agent is required for stage ${completedStageIndex}")`
  - 改为：从 `runMeta.stageAcpSessionIds[completedStageIndex]` 读 apply 就绪标记，若缺失抛 `ipcError(IpcErrorCodes.APPLY_SESSION_NOT_READY, ...)`
  - 通过 `newArchiveFylloSessionId(runMeta.runId)` 生成 archive 阶段使用的 `fylloSessionId`
- [x] 6.2 在 `proposal:archive` handler 中构造 `AcpSession` 时：`opts.fylloSessionId` 为 task 6.1 生成的 archive id；`opts.agentId` 为 task 6.1 读取的 stage agent；`opts.sessionStore` 为 `new ArchiveAcpSessionStore(projectPath, form.changeId)`；其余字段（`owner: "archive"`、`reminderContext`、`onReminderInjected`、`recoveryContext`）保持现状。
- [x] 6.3 删除 `electron/main/ipc/proposal-apply.ts` 文件顶部对 `loadSessionMeta` 的 import（如果不再使用）；删除 `newStageFylloSessionId` 在 archive 路径上的使用，保留其在 stage 路径上的使用。
- [x] 6.4 验证 archive 启动流程：`AcpSession.start` 走 newSession 路径（因为 archive.json 不含 `acpSessionId`） → reminder 注入 → archive.json 通过 `ArchiveAcpSessionStore.persistAcpSessionId` 写入 `acpSessionId`。

## 7. 测试覆盖

- [x] 7.1 在 `electron/main/__tests__/ipc/proposal-apply.spec.ts` 中新增 archive 路径测试：
  - archive 启动时不调用 `loadSessionMeta`（mock 验证）
  - archive 阶段使用 `${runId}-archive` 作为 `fylloSessionId`
  - archive 启动时 `runMeta.stageAcpSessionIds[N]` 缺失 → 抛 `APPLY_SESSION_NOT_READY`
  - archive 启动时 `runMeta.stages[N].agent` 缺失 → 抛 `VALIDATION_ERROR`
  - archive 首次执行时触发 `connection.newSession` 与 reminder 注入（可通过 mock `resolveSystemReminder` 与 `onReminderInjected` 验证）
  - archive 完成后 archive.json 内含 `acpSessionId` 且 `status === "done"`
- [x] 7.2 在 `electron/main/__tests__/ipc/proposal-apply.spec.ts` 中确认或新增 stage 路径测试：stage stream 完成后 `run.json.stageAcpSessionIds[stageIndex]` 包含正确的 `acpSessionId`，且 `data/projects/.../sessions/run-{runId}-{N}.json` 与 `run-{runId}-{N}.messages.jsonl` 不被创建。
- [x] 7.3 跑 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 验证全量通过。

## 8. 文档与规范同步

- [x] 8.1 检查并更新 `guidelines/MainProcess.md` 第 178-194 行的 ID 工厂列表，新增 `newArchiveFylloSessionId(runId)` 行；如 ID 工厂条目本身已涵盖（"通过 ids 模块"），仅补充一行说明即可。
- [x] 8.2 走 OpenSpec 流程：通过 `mcp__fyllo_specs__archive-change` 将本变更归档，将 `specs/acp-chat-backend`、`specs/proposal-apply-run`、`specs/session-meta-storage` 的 delta 合并到 `openspec/specs/<capability>/spec.md`。
