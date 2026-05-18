## MODIFIED Requirements

### Requirement: Session meta updates are centralized in session-store

系统 SHALL 将 chat owner 的 session meta（位于 `data/projects/<encoded>/sessions/<sessionId>.json`）的读取、创建、字段更新和删除能力集中在 `electron/main/infra/storage/session-store.ts`。除 session-store 外，其他主进程模块 MUST NOT 直接通过 `loadSessionMeta` 读取后自行 `saveSessionMeta` 回写，也 MUST NOT 构造缺失现存字段的整对象覆盖写入。

`session-store.ts` 的服务边界 SHALL 限定为 `owner === "chat"` 的会话；apply 与 archive owner 的 ACP 会话状态（`acpSessionId`）SHALL 通过各自专属的 `AcpSessionStore` 实现持久化（详见 `proposal-apply-run` spec），SHALL NOT 读写 `sessions/` 目录下的任何文件。

`AcpSession` 与 `session-store` 之间 SHALL 通过 `AcpSessionStore` 接口（`electron/main/domain/chat/acp-session-store.ts`）解耦，`ChatAcpSessionStore`（`electron/main/infra/storage/chat-acp-session-store.ts`）作为 chat owner 的实现，包装 `loadSessionMeta` / `upsertSessionMeta` 调用。`AcpSession` 模块本身 SHALL NOT 直接 import `session-store.ts`。

`ChatAcpSessionStore` 在 `persistAcpSessionId(acpSessionId)` 中 SHALL 通过 session-store 的字段级更新接口写入 `acpSessionId`、`agentId`、`turnCount`（自增）、`updatedAt`，并保留 session meta 中已有的 `title`、`tokenUsage`、`available_commands` 等所有未变更字段。

#### Scenario: Chat flow updates title through session-store

- **WHEN** chat 主线程处理 `session_info_update`
- **THEN** 它通过 session-store 提供的字段级更新入口修改 `title` 与 `updatedAt`
- **AND** 不在 `ipc/chat.ts` 内手写 `loadSessionMeta -> spread -> saveSessionMeta`

#### Scenario: ChatAcpSessionStore writes acpSessionId via session-store

- **WHEN** `AcpSession.start()` 在 `newSession` 或恢复分支中需要写入 `acpSessionId`、`turnCount` 或 `updatedAt`
- **AND** 当前 owner 为 `"chat"`
- **THEN** 它通过注入的 `ChatAcpSessionStore.persistAcpSessionId` 完成写入
- **AND** `ChatAcpSessionStore` 内部通过 session-store 的字段级更新入口完成写入
- **AND** 现存的 `available_commands`、`tokenUsage.cost` 以及未来新增字段 SHALL 被保留

#### Scenario: ApplyStageAcpSessionStore does not touch session-store

- **WHEN** `AcpSession.start()` 在 apply owner 下调用 `sessionStore.persistAcpSessionId(acpSessionId)`
- **THEN** 持久化通过 `updateRunMetaIfCurrent` 写入 `run.json` 的 `stageAcpSessionIds[stageIndex]`
- **AND** 不调用 `loadSessionMeta` / `upsertSessionMeta` / `saveSessionMeta`
- **AND** 不创建 `data/projects/<encoded>/sessions/` 下的任何文件

#### Scenario: ArchiveAcpSessionStore does not touch session-store

- **WHEN** `AcpSession.start()` 在 archive owner 下调用 `sessionStore.persistAcpSessionId(acpSessionId)`
- **THEN** 持久化通过 `updateArchiveRunAcpSessionId` 写入 `archive.json` 的 `acpSessionId` 字段
- **AND** 不调用 `loadSessionMeta` / `upsertSessionMeta` / `saveSessionMeta`
- **AND** 不创建 `data/projects/<encoded>/sessions/` 下的任何文件
