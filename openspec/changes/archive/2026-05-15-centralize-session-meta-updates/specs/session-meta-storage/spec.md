## ADDED Requirements

### Requirement: Session meta updates are centralized in session-store

系统 SHALL 将 session meta 的读取、创建、字段更新和删除能力集中在 `electron/main/infra/storage/session-store.ts`。除 session-store 外，其他主进程模块 MUST NOT 直接通过 `loadSessionMeta` 读取后自行 `saveSessionMeta` 回写，也 MUST NOT 构造缺失现存字段的整对象覆盖写入。

#### Scenario: Chat flow updates title through session-store

- **WHEN** chat 主线程处理 `session_info_update`
- **THEN** 它通过 session-store 提供的字段级更新入口修改 `title` 与 `updatedAt`
- **AND** 不在 `ipc/chat.ts` 内手写 `loadSessionMeta -> spread -> saveSessionMeta`

#### Scenario: ACP session updates acpSessionId through session-store

- **WHEN** `AcpSession.start()` 在 `newSession` 或恢复分支中需要写入 `acpSessionId`、`turnCount` 或 `updatedAt`
- **THEN** 它通过 session-store 的统一更新入口完成写入
- **AND** 现存的 `available_commands`、`tokenUsage.cost` 以及未来新增字段 SHALL 被保留

### Requirement: Session meta field updates preserve unrelated fields

系统 SHALL 将 session meta 的增量修改视为字段级合并，而不是整对象覆盖。任何一次更新只允许改变本次明确指定的字段，其余已持久化字段 MUST 原样保留，包括当前未知但合法的扩展字段。

#### Scenario: available_commands survives second-turn session writes

- **WHEN** 某 session 在第一轮对话中已持久化 `available_commands`
- **AND** 第二轮对话启动时 `AcpSession.start()` 更新 `acpSessionId`、`turnCount` 或 `updatedAt`
- **THEN** 写回后的 session meta 仍包含原有 `available_commands`

#### Scenario: usage update does not erase future meta fields

- **WHEN** chat 流式处理 `usage_update` 并更新 `tokenUsage`
- **THEN** session-store 仅修改 `tokenUsage` 与本次需要变化的字段
- **AND** 不删除 `available_commands`、`acpSessionId` 或未来新增的其他 meta 字段

#### Scenario: explicit empty available_commands remains persisted

- **WHEN** agent 推送 `available_commands_update`，其 `commands` 为空数组
- **THEN** session-store 将 `available_commands` 持久化为 `[]`
- **AND** 后续任何其他 session meta 更新都 SHALL 保留该空数组，而不是删除该字段
