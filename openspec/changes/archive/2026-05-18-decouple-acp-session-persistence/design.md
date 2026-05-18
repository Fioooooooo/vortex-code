## Context

主进程通过 `AcpSession` 类（`electron/main/services/chat/acp-session.ts`）统一驱动所有与 ACP agent 的对话。当前 chat / apply / archive 三个调用方在使用上有细微但关键的差异，但 `AcpSession` 的实现把"如何持久化 ACP 会话状态"硬编码进了 `session-store.ts` 调用，导致三个流程被同一个数据模型绑死。

### 当前状态

```
ipc/chat.ts                     ipc/proposal-apply.ts (apply)         ipc/proposal-apply.ts (archive)
       │                                  │                                       │
       ▼                                  ▼                                       ▼
  new AcpSession({                 new AcpSession({                       new AcpSession({
    fylloSessionId: chatId,          fylloSessionId:                        fylloSessionId:
    owner: "chat",                     newStageFylloSessionId(               newStageFylloSessionId(
    ...                                  runId, stageIndex),                   runMeta.runId, lastStage),
  })                                 owner: "apply",                        owner: "archive",
       │                             ...                                    ...
       │                           })                                     })
       │                                  │                                       │
       └──────────────┬───────────────────┴───────────────────┬───────────────────┘
                      ▼                                       ▼
            AcpSession.start()                    内部 loadSessionMeta(fylloSessionId)
                      │                          → 复用 stage 的 acpSessionId
                      ▼                          → direct prompt 成功
            loadSessionMeta(fylloSessionId)      → 不进入 newSession 路径
            upsertSessionMeta(fylloSessionId,    → resolveReminderParts 不被调用
              { acpSessionId, agentId,
                title, turnCount,
                tokenUsage, available_commands })
                      │
                      ▼
        sessions/<fylloSessionId>.json    ← chat 用得上；apply / archive 是冗余写
```

### 关键事实

1. `AcpSession.start` 通过 `tryHandlePersistedSession`（`acp-session.ts:161-197`）判断："存在 `persistedSessionId` 且 direct prompt 成功"则 `return true`，永远不会进入 `completeRecoveredPrompt`。
2. system-reminder 注入点（`acp-session.ts:430-466`）只在 `completeRecoveredPrompt → resolveReminderParts → createdNewSession === true` 这条路径上；direct prompt 路径完全旁路。
3. `apply-runs/<changeId>/run.json` 已经持有 archive 启动所需的全部信息：
   - `runMeta.stages[N].agent` —— archive 复用的 agentId
   - `runMeta.stageAcpSessionIds[N]` —— apply 是否就绪的判据
   - 因此 archive 当前调用的 `loadSessionMeta(stageFylloSessionId)` 是**多余**的。
4. `sessions/<fylloSessionId>.messages.jsonl` 在 apply / archive 路径下从未被写入（apply 用 `stage-N.messages.jsonl`，archive 用 `archive.messages.jsonl`），但 `session-store` 的 API 形态强迫 store 持有该文件路径概念。

### 约束

- 不修改 chat owner 现有持久化字段（`title / turnCount / tokenUsage / available_commands` 等）—— 这些字段被 chat 列表 / token 用量条 / slash 命令面板等 UI 直接消费。
- 不修改对外 IPC 通道。
- 遵守 `guidelines/MainProcess.md` 的五层依赖方向：domain 不依赖 infra/services/ipc；services 可依赖 domain/infra；ipc 仅依赖 services。
- 遵守 `session-meta-storage` spec 关于"字段级更新不得覆盖未变更字段"的约束。

## Goals / Non-Goals

**Goals:**

- 让 archive 阶段的 system-reminder 能被正确注入（直接修复 bug）。
- 切断 `AcpSession` 与 `session-store` 的硬编码依赖，建立可注入的 `AcpSessionStore` 抽象。
- 明确 chat / apply / archive 三个 owner 各自的持久化路径，互不污染。
- 为后续新增 stage 类型（review / deploy 等）提供清晰的扩展点：实现一个 `AcpSessionStore` + 一个 fylloSessionId 工厂即可，不再触碰 `AcpSession` 内部。
- 停止产生冗余的 `sessions/run-{runId}-{N}.json` / `sessions/run-{runId}-{N}.messages.jsonl` 文件。

**Non-Goals:**

- 不重写 `session-store.ts` 的内部实现，仅用 chat 实现来包装它。
- 不重构 reminder 注入逻辑本身（`resolveReminderParts` / `resolveSystemReminder` 等保持不变）。
- 不重构 `MessageAssembler` 或消息持久化流程（`stage-N.messages.jsonl` / `archive.messages.jsonl` 写入路径保持不变）。
- 不主动清理或迁移已经存在的 `run-{runId}-{N}.*` 残留文件。
- 不调整 `SessionRegistry` 的 owner 命名空间或 key 规则。
- 不修改 chat owner 在 `sessions/<sessionId>.json` 中的字段集合或行为。
- 不引入"会话历史回放给 archive"的能力（archive 看不到 apply 历史，本变更已确认）。

## Decisions

### Decision 1：`AcpSessionStore` 接口放在 domain 层

```ts
// electron/main/domain/chat/acp-session-store.ts
export interface AcpSessionStore {
  loadAcpSessionId(): Promise<string | null>;
  persistAcpSessionId(acpSessionId: string): Promise<void>;
}
```

**为什么放在 domain：**

- 接口本身不依赖 fs / electron / 任何 infra 实现细节，符合 `MainProcess.md` 中 domain 层"无 electron / infra 依赖，可脱机单测"的定义。
- `AcpSession` 在 services 层，依赖 domain 接口；具体 store 实现在 infra 层；调用方在 ipc 层组装。依赖方向完全合规。
- 把接口 leak 到 services 层（如 `services/chat/acp-session-store.ts`）会导致 `services` 内部的两个文件互相依赖，且增加未来"想在 domain 内引用此接口"时的搬迁成本。
- "infra 依赖 domain"这条方向已被 `eslint.config.mjs:134-149` 明确允许，注释原文 `infra IS allowed to use domain pure helpers — domain is "knowledge" and infra is "capability"; capabilities using knowledge is fine.`。本次 `AcpSessionStore` 仅导出 type-only `interface`，比注释要求的 "pure helpers" 更轻；既有先例为 `electron/main/infra/process/acp-process-pool.ts:7` 从 `@main/domain/acp/detector` 引入函数。

**为什么不让 `AcpSession` 直接接受两个回调（`load: () => Promise<...>` / `save: (id) => Promise<void>`）：**

- 三个 owner 的实现都需要内部状态（projectPath、changeId、stageIndex 等闭包变量），用接口 + 类比裸函数更利于测试 mock 与代码组织。
- 后续若需要扩展接口（如"清理 store"），加方法不破坏调用方。

### Decision 2：三个 store 实现分别落到 `infra/storage/`

| Store                       | 文件                                                           | 行为                                                                               |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `ChatAcpSessionStore`       | `electron/main/infra/storage/chat-acp-session-store.ts`        | 委托给现有 `loadSessionMeta` / `upsertSessionMeta`（保持 chat 列表所需字段写入）。 |
| `ApplyStageAcpSessionStore` | `electron/main/infra/storage/apply-stage-acp-session-store.ts` | 读写 `run.json` 的 `stageAcpSessionIds[stageIndex]`。                              |
| `ArchiveAcpSessionStore`    | `electron/main/infra/storage/archive-acp-session-store.ts`     | 读写 `archive.json` 的 `acpSessionId` 字段（新增）。                               |

`ChatAcpSessionStore` 接受 `(projectPath, sessionId, agentId)` 构造参数；`load` 调 `loadSessionMeta` 取 `acpSessionId`；`persist` 调用 `upsertSessionMeta` 的字段级更新接口（patch 仅含 `acpSessionId / agentId / turnCount / updatedAt`），其余字段由 store 内部按现有 chat 流程逻辑兜底（参考 `acp-session.ts:521-548` 的当前实现）。

`ApplyStageAcpSessionStore` 接受 `(projectPath, changeId, runId, stageIndex)`：

- `load`：`loadApplyRunMeta(projectPath, changeId)` → 校验 `runId` 一致 → 返回 `meta.stageAcpSessionIds[stageIndex] ?? null`。
- `persist`：通过 `updateRunMetaIfCurrent(projectPath, changeId, runId, ...)` 更新 `stageAcpSessionIds[stageIndex]`（已有逻辑见 `apply-run-service.ts`）。

`ArchiveAcpSessionStore` 接受 `(projectPath, changeId)`：

- `load`：`loadArchiveRunMeta(projectPath, changeId)` → 返回 `meta?.acpSessionId ?? null`。
- `persist`：新增字段级更新 `updateArchiveRunAcpSessionId(projectPath, changeId, acpSessionId)`，避免整对象覆盖（遵守 `session-meta-storage` 约束）。

**为什么 chat 实现不直接搬到 store 内、而是包一层：**

- `session-store.ts` 还在被 chat 的其他流程（meta 创建、token usage、available_commands、message 持久化）使用，本次变更不重构它。
- 用 store 包一层等于在抽象边界上把 chat 的"完整 meta"语义压缩为"只暴露 acpSessionId"，让接口对三个 owner 对称。

### Decision 3：`AcpSession` 内部完全不再触达 `session-store`

`AcpSession.start` 当前依赖 `loadSessionMeta` 与 `persistSessionMeta`（`acp-session.ts:112` / `:526`）。本次将这两个调用替换为：

- `loadSessionMeta(...)` → `await this.opts.sessionStore.loadAcpSessionId()`
- `persistSessionMeta(...)` → `await this.opts.sessionStore.persistAcpSessionId(acpSessionId)`

`prepareStartContext` 中的 `meta` 字段（`StartContext.meta: SessionMeta | null`）SHALL 移除；recovery 子模块（`acp-session-recovery.ts`）目前接受 `meta: SessionMeta | null` 仅用于读 `meta?.acpSessionId`，改为接受 `persistedSessionId: string | null` 直接传入。

`AcpSessionOpts` 新增字段：

```ts
sessionStore: AcpSessionStore; // 必填
```

`logPrefix` 中的 `[fyllo=...]` 仍由 `opts.fylloSessionId` 渲染，store 实现内部的细节（哪个文件、哪个 changeId）不参与日志。

### Decision 4：archive 使用独立 `fylloSessionId`

```ts
// electron/main/infra/ids/index.ts
export function newArchiveFylloSessionId(runId: string): string {
  return `${runId}-archive`;
}
```

archive handler 中：

```ts
const fylloSessionId = newArchiveFylloSessionId(runMeta.runId);
```

**为什么是 `${runId}-archive` 而不是 `archive-{changeId}`：**

- 用户已确认"archive 是 apply 完成后的最终收尾"，概念上与本次 apply run 1:1 绑定 → fylloSessionId 派生于 runId 最直观。
- 与 `newStageFylloSessionId(runId, N)` 形态对称（同源前缀）。
- 跨 apply run 的 archive 自然不冲突（不同 runId）。

### Decision 5：archive 启动不再读 stage session-meta

修改后的 archive handler 启动逻辑：

```ts
const runMeta = await loadApplyRunMeta(projectPath, form.changeId);
// 校验 status === "done"，找到 last stage index
const lastStageIndex = getCompletedApplyStageIndex(runMeta);
const stageAgent = runMeta.stages[lastStageIndex].agent;
const stageAcpSessionId = runMeta.stageAcpSessionIds[lastStageIndex];

if (!stageAgent) throw ipcError(VALIDATION_ERROR, ...);
if (!stageAcpSessionId)
  throw ipcError(APPLY_SESSION_NOT_READY, ...);   // 这是判据切换点

const archiveFylloSessionId = newArchiveFylloSessionId(runMeta.runId);
const sessionStore = new ArchiveAcpSessionStore(projectPath, form.changeId);

const session = new AcpSession({
  fylloSessionId: archiveFylloSessionId,
  agentId: stageAgent,
  sessionStore,
  owner: "archive",
  ...
});
```

**为什么用 `runMeta.stageAcpSessionIds[N]` 而不是 `loadSessionMeta` 判定 apply 就绪：**

- `run.json` 是 apply run 的权威 meta，结构由 `proposal-apply-run` spec 明确规定。
- `sessions/run-{runId}-{N}.json` 在新方案下不再产生，再读它就是依赖即将消失的副产物。

### Decision 6：`ArchiveRunMeta` 新增 `acpSessionId` 字段，向前兼容读

```ts
// shared/types/proposal.ts
export interface ArchiveRunMeta {
  runId: string;
  changeId: string;
  status: "running" | "done" | "error";
  startedAt: string;
  updatedAt: string;
  acpSessionId?: string; // 新增
}
```

`loadArchiveRunMeta` 已 `JSON.parse` 后直接返回，旧文件缺该字段时自然为 `undefined`，无需迁移。

`saveArchiveRunMeta` 当前是整对象写入。为遵守 `session-meta-storage` 关于"字段级更新不得覆盖未变更字段"的精神，新增字段级更新函数：

```ts
// electron/main/infra/storage/apply-run-store.ts
export async function updateArchiveRunAcpSessionId(
  projectPath: string,
  changeId: string,
  acpSessionId: string
): Promise<void> {
  const existing = await loadArchiveRunMeta(projectPath, changeId);
  if (!existing) return;
  await saveArchiveRunMeta(projectPath, {
    ...existing,
    acpSessionId,
    updatedAt: new Date().toISOString(),
  });
}
```

`ArchiveAcpSessionStore.persistAcpSessionId` 调用此函数。

### Decision 7：`session-store.ts` 不动；服务边界由文档明确

不重构 `session-store.ts` 实现：

- 它仍是 chat 路径的字段级更新入口，被 `chat-service.ts`、`ChatAcpSessionStore` 等多处调用。
- `session-meta-storage` spec 描述的是"通过 session-store 完成 chat 字段级更新"，本变更只需更新该 spec 强调"apply / archive 不通过 session-store 持久化"。

### Decision 8：`SessionRegistry` 与 owner 语义不变

`owner` 字段保留以下用途：

- `SessionRegistry` 命名空间（已在 `MainProcess.md:130-143` 规定）。
- `logPrefix` 渲染。
- `resolveSystemReminder` 路由。

不在本变更内引入"reminder resolver 注入函数"以替代 owner —— 那是更大范围的重构，且当前 owner 语义不会带来 bug，留待后续 change。

## Risks / Trade-offs

- **[风险] 旧 archive.json 缺 `acpSessionId` 字段，导致页面重开后 archive recovery 行为发生变化** → 缓解：`AcpSessionStore.loadAcpSessionId` 返回 `null` 时，`AcpSession` 走 newSession 路径并触发 reminder 注入，等同于"重启 archive turn"，符合"archive 是收尾动作"的语义。已存在但未完成的 archive turn（极少见的非典型态）会重新执行。
- **[风险] chat 路径 `ChatAcpSessionStore` 的 `persistAcpSessionId` 实现需要保留 `title / turnCount / tokenUsage / available_commands` 兜底逻辑，否则会丢字段** → 缓解：实现内严格复用现有 `acp-session.ts:521-548` 的 patch 形状，并通过单测覆盖"持久化 acpSessionId 不丢 available_commands"的场景。
- **[风险] `apply-stage-acp-session-store` 在 `persist` 时若 `runId` 与 `runMeta.runId` 不一致（用户重新触发 apply），`updateRunMetaIfCurrent` 会静默 no-op** → 缓解：保持现行 `updateRunMetaIfCurrent` 语义（已是预期行为），并在 store 实现里 logger.warn 记录该情况。
- **[Trade-off] 增加三个 store 实现文件 vs 复用单一接口的代码量** → 接受：每个实现都很薄（~30 行），换取三个 owner 的持久化路径完全分离的清晰度，符合用户提出的"三阶段互相解耦但必要部分可复用"的方向。
- **[Trade-off] 不重构 reminder resolver 的 owner 路由** → 接受：本变更聚焦于 store 解耦，避免 blast radius。

## Migration Plan

1. 新增 domain 接口 + 三个 store 实现 + id 工厂；不修改 `AcpSession` 与 IPC handler。`AcpSession` 仍通过 `session-store` 工作（旧路径并存）。
2. `AcpSessionOpts` 新增可选 `sessionStore?: AcpSessionStore`；`AcpSession.start` 内若 `sessionStore` 提供则优先使用，否则 fallback 到旧逻辑。这是 IDE 编辑期临时态，本 PR 内合并完成不发布。
3. chat IPC handler 注入 `ChatAcpSessionStore`，运行所有 chat 相关测试。
4. apply IPC handler 注入 `ApplyStageAcpSessionStore`，运行 apply 相关测试。
5. archive IPC handler 注入 `ArchiveAcpSessionStore` + 切换 fylloSessionId/agentId 来源/就绪判据，运行 archive 相关测试。
6. `AcpSessionOpts.sessionStore` 改为必填；删除 `AcpSession` 内部对 `session-store` 的所有 import 与 fallback；移除 `StartContext.meta`；调整 recovery 子模块签名。运行全量测试。
7. 更新 `proposal-apply-run`、`acp-chat-backend`、`session-meta-storage` 三个 spec。

回滚策略：本变更未涉及对外 IPC 通道与文件 schema 的 BREAKING 变更（`acpSessionId` 是新增可选字段）。回滚只需恢复 IPC handler 的注入 + 删除三个 store 实现，旧 `session-store` 调用路径仍然完整。

## Open Questions

无。所有方向问题（fylloSessionId 命名、是否清理旧 `run-xxx-N.*` 文件、reminder resolver 是否一并重构、archive 是否需要看 apply 历史）已在前置讨论中决议。
