## ADDED Requirements

### Requirement: AcpSession 通过注入的 AcpSessionStore 完成 acpSessionId 持久化

`AcpSessionOpts` SHALL 新增必填字段 `sessionStore: AcpSessionStore`，其中 `AcpSessionStore` 由 `electron/main/domain/chat/acp-session-store.ts` 导出，接口契约为：

```ts
export interface AcpSessionStore {
  loadAcpSessionId(): Promise<string | null>;
  persistAcpSessionId(acpSessionId: string): Promise<void>;
}
```

`AcpSession.start` SHALL 通过 `await this.opts.sessionStore.loadAcpSessionId()` 获取 `persistedSessionId`，SHALL NOT 直接调用 `loadSessionMeta`。`AcpSession` 在以下两种时机 SHALL 调用 `await this.opts.sessionStore.persistAcpSessionId(acpSessionId)`：

1. `tryHandlePersistedSession` 中 direct prompt 成功后（保持原 `persistResolvedSession` 时机）
2. `completeRecoveredPrompt` 中 recovery 完成、即将发起最终 prompt 之前（保持原 `persistResolvedSession` 时机）

`AcpSession` 模块 SHALL NOT 再 import `@main/infra/storage/session-store`。

#### Scenario: AcpSession.start 通过 sessionStore 读取 persistedSessionId

- **WHEN** `AcpSession.start(prompt)` 被调用
- **THEN** 系统通过 `await this.opts.sessionStore.loadAcpSessionId()` 获得 `persistedSessionId`
- **AND** 不调用 `loadSessionMeta`
- **AND** 后续 direct prompt / resume / load / new 路径决策仅依赖该值

#### Scenario: direct prompt 成功后通过 sessionStore 持久化

- **WHEN** `AcpSession.start` 走 `tryHandlePersistedSession` 分支并 direct prompt 成功
- **THEN** 系统调用 `await this.opts.sessionStore.persistAcpSessionId(persistedSessionId)`
- **AND** 不调用 `upsertSessionMeta`
- **AND** emit `session_id_resolved` 事件

#### Scenario: newSession 成功后通过 sessionStore 持久化

- **WHEN** `AcpSession.start` 走 `completeRecoveredPrompt` 分支，且 `recovery.createdNewSession === true`
- **THEN** 系统调用 `await this.opts.sessionStore.persistAcpSessionId(recovery.sessionId)`
- **AND** 不调用 `upsertSessionMeta`
- **AND** 随后按 `system-reminder-injection` spec 完成 reminder 注入流程

#### Scenario: chat IPC handler 构造 AcpSession 时注入 ChatAcpSessionStore

- **WHEN** `chat:stream:message` 的 handler 构造 `AcpSession`
- **THEN** `opts.sessionStore` 为 `ChatAcpSessionStore` 实例
- **AND** `opts.owner` 为 `"chat"`

#### Scenario: proposal-apply stage handler 构造 AcpSession 时注入 ApplyStageAcpSessionStore

- **WHEN** `proposal:stageStream` 的 handler 构造 `AcpSession`
- **THEN** `opts.sessionStore` 为 `ApplyStageAcpSessionStore` 实例，构造参数包含 `(projectPath, changeId, runId, stageIndex)`
- **AND** `opts.owner` 为 `"apply"`

#### Scenario: proposal-archive handler 构造 AcpSession 时注入 ArchiveAcpSessionStore

- **WHEN** `proposal:archive` 的 handler 构造 `AcpSession`
- **THEN** `opts.sessionStore` 为 `ArchiveAcpSessionStore` 实例，构造参数包含 `(projectPath, changeId)`
- **AND** `opts.owner` 为 `"archive"`

## MODIFIED Requirements

### Requirement: ACP session 生命周期管理

系统 SHALL 在每次 `streamMessage` 时，将“FylloCode 持久化的 `acpSessionId`”视为恢复线索，而非“当前 agent 进程内 session 必然仍然存活”的证明。`acpSessionId` 的读取与持久化 SHALL 通过 `AcpSessionOpts.sessionStore`（`AcpSessionStore` 接口）完成，`AcpSession` 模块自身 SHALL NOT 引用 `electron/main/infra/storage/session-store.ts`。

当不存在持久化的 `acpSessionId` 时（`sessionStore.loadAcpSessionId()` 返回 `null`），系统 SHALL 调用 `connection.newSession()` 创建真实 ACP session；当存在持久化 `acpSessionId` 时，系统 SHALL 先尝试直接对该 `sessionId` 调用 `connection.prompt()` 发起当前 turn，而不是默认先调用 `resumeSession` 或 `loadSession`。

若 direct prompt 在当前 turn 尚未收到任何 ACP `session/update` 事件之前失败，且失败被 FylloCode 归类为“session missing”错误，系统 SHALL 进入恢复流。系统 SHALL 优先依据 agent 在 `initialize` 握手中声明的能力决定恢复顺序，而不是写死某一个 ACP adapter 的行为：

- 若 agent 声明 `session.resume` capability，则 SHALL 先尝试 `connection.resumeSession({ sessionId, cwd, mcpServers })`
- 若 `resumeSession` 不受支持，或其结果仍被归类为“session missing”，且 agent 声明 `loadSession: true` capability，则 SHALL 再尝试 `connection.loadSession({ sessionId, cwd, mcpServers })`
- 若 ACP-native 恢复均不可用或失败，则 SHALL 退化为 `connection.newSession()`，并使用 FylloCode 本地持久化的历史消息对上下文做 best-effort 重建后，再发送当前用户消息

系统 SHALL 将以下两类信号视为“session missing”判定依据：

- 优先使用结构化错误信号（例如 ACP `resource_not_found` / `-32002`）
- 若 adapter 未提供统一结构化错误，则使用 FylloCode 维护的已知缺失-session 文案签名集合（例如 `Session not found`、`No conversation found with session ID`）对 `message` / `data.details` 做匹配

系统 SHALL NOT 因任意 prompt 错误自动进入恢复流。若当前 turn 已经收到任意 ACP `session/update` 事件，或错误未被归类为“session missing”，系统 SHALL 直接按当前 turn 失败处理，不再自动重试，以避免重复的 tool side effects 或重复输出。

`newSession`、`resumeSession`、`loadSession` 所需的 `mcpServers` 参数 SHALL 统一由 `@main/infra/mcp/bundled-mcp-servers#getBundledMcpServers({ projectPath })` 计算得出，而非硬编码空数组或在 `services/chat/acp-session.ts` 内部拼装。虽然 ACP 协议中 `ResumeSessionRequest.mcpServers` 为 optional，但只要执行 `resumeSession`，系统 SHALL 显式传入该参数；执行 `loadSession` 时 SHALL 同样传入该参数。

当 `AcpSession.start` 本次调用真正执行了 `connection.newSession()`（包括首次创建与所有恢复失败后的 fresh-session fallback）时，系统 SHALL 在 `newSession` 成功返回后、调用 `connection.prompt()` 之前尝试注入 system-reminder：调用 `resolveSystemReminder({ owner, projectPath, cwd, fylloSessionId, agentId, ...opts.reminderContext })`，若返回非 null 的 `TextUIPart`，在 `try/catch` 中 `await opts.onReminderInjected(reminderPart)`（捕获任何异常仅 `logger.error` 记录、不上抛、不中断 stream），再把 reminder block 插入 `connection.prompt` 的 `prompt` 数组首位。`resumeSession` 与 `loadSession` 成功分支 SHALL NOT 注入 reminder。

当恢复流选择 `loadSession`，且 FylloCode 对该 owner/session 已拥有本地持久化历史消息时，agent 通过 `session/update` 回放的历史消息 SHALL 被视为“恢复控制面副作用”而非新的 UI 消息来源。系统 SHALL 抑制这些 replay 事件的消息流落盘与 UI 组装，避免重复消息；但 `available_commands_update`、`session_info_update` 等 session 级元数据更新 SHALL 继续生效。

若最终退化为 `newSession + 本地历史重建`，系统 SHALL 将其定义为 best-effort 恢复：使用本地持久化历史消息和当前用户输入重建上下文，但 SHALL NOT 声称该路径能无损还原 ACP adapter 的内部 session state。

该 fresh-session fallback 的 prompt 结构 SHALL 为：

1. 现有 `newSession` 分支生成的 `reminderPart`
2. 一条额外的历史转录 `system-reminder`，内容以纯文本形式包裹在 `<system-reminder> ... </system-reminder>` 中，并至少包含一条“请根据以下对话历史，继续与用户进行对话”的引导语以及提取出的 `assistant:` / `user:` 历史转录
3. 当前用户的真实文本消息

这两条 `system-reminder` 都 MAY 被持久化到 FylloCode 本地消息文件；前端由于已屏蔽 `system-reminder` 的 UI 展示，SHALL NOT 将它们作为用户可见消息展示出来。

#### Scenario: 首次发送消息创建新 ACP session

- **WHEN** IPC handler 收到 `chat:stream:message`，且该 `sessionId` 无持久化的 `acpSessionId`（`sessionStore.loadAcpSessionId()` 返回 `null`）
- **THEN** 调用 `connection.newSession({ cwd, mcpServers })`，其中 `mcpServers` 为 `getBundledMcpServers({ projectPath })` 的返回值
- **AND** 在正常启用内置 MCP 的场景下，`mcpServers` 至少包含一个 `name === "fyllo-specs"` 的 spec
- **AND** `newSession` 返回后立即调用 `await sessionStore.persistAcpSessionId(acpSessionId)` 持久化
- **AND** emit `{ type: "session_id_resolved", acpSessionId }` 事件
- **AND** 调用 `resolveSystemReminder(...)`；若返回非 null 的 `TextUIPart`，在 `try/catch` 中 `await onReminderInjected(reminderPart)`（异常仅 `logger.error`、不上抛），再把 reminder part 置于 `connection.prompt()` 的 `prompt` 数组首位

#### Scenario: 持久化 ACP session 仍然存活时 direct prompt 成功

- **WHEN** IPC handler 收到 `chat:stream:message`，且 `sessionStore.loadAcpSessionId()` 返回非空的 `acpSessionId`
- **AND** 当前 agent 进程仍持有该 `acpSessionId` 对应的 live session
- **THEN** 系统 SHALL 直接调用 `connection.prompt({ sessionId: acpSessionId, prompt })`
- **AND** SHALL NOT 先调用 `resumeSession` 或 `loadSession`
- **AND** SHALL NOT 注入 system-reminder
- **AND** SHALL 调用 `await sessionStore.persistAcpSessionId(acpSessionId)` 完成元数据维护

#### Scenario: Direct prompt 因 session missing 失败后按 capability 进入恢复流

- **WHEN** IPC handler 收到 `chat:stream:message`，且 `sessionStore.loadAcpSessionId()` 返回非空的 `acpSessionId`
- **AND** 对 `connection.prompt({ sessionId: acpSessionId, prompt })` 的调用在当前 turn 未收到任何 `session/update` 事件之前失败
- **AND** 该失败被 FylloCode 归类为“session missing”
- **THEN** 系统 SHALL 根据 agent initialize 时声明的 capabilities 选择恢复路径
- **AND** 若 agent 支持 `session.resume`，则先调用 `connection.resumeSession({ sessionId: acpSessionId, cwd, mcpServers })`
- **AND** 若 `resumeSession` 不支持或仍以“session missing”失败，且 agent 支持 `loadSession`，则调用 `connection.loadSession({ sessionId: acpSessionId, cwd, mcpServers })`
- **AND** 任一恢复成功后，系统 SHALL 调用 `await sessionStore.persistAcpSessionId(recoveredSessionId)`，再仅对“当前这次用户输入”重新发起一次 `connection.prompt()`

#### Scenario: Direct prompt 失败但不满足自动恢复条件

- **WHEN** 对持久化 `acpSessionId` 的 direct prompt 调用失败
- **AND** 当前 turn 已收到至少一个 `session/update` 事件，或该错误未被归类为“session missing”
- **THEN** 系统 SHALL 将该 turn 按正常失败处理
- **AND** SHALL NOT 自动调用 `resumeSession`
- **AND** SHALL NOT 自动调用 `loadSession`
- **AND** SHALL NOT 自动创建新的 ACP session

#### Scenario: 恢复流使用 loadSession 时抑制历史 replay

- **WHEN** 系统因 session missing 进入恢复流
- **AND** 所选恢复方法为 `connection.loadSession({ sessionId, cwd, mcpServers })`
- **AND** FylloCode 对该 owner/session 已存在本地持久化历史消息
- **THEN** agent 通过 `session/update` 回放的历史消息 SHALL NOT 被追加到 UIMessage 列表
- **AND** SHALL NOT 被写回 `sessions/*.messages.jsonl`、`stage-*.messages.jsonl` 或 `archive.messages.jsonl`
- **AND** `available_commands_update` 与 `session_info_update` 等 session 级元数据更新 SHALL 继续生效
- **AND** `loadSession` 完成后，系统才对当前用户输入发起新的 `connection.prompt()`

#### Scenario: Agent 不支持 resumeSession 时直接使用 loadSession

- **WHEN** 系统因 session missing 进入恢复流
- **AND** agent initialize 时未声明 `session.resume` capability
- **AND** agent 声明 `loadSession: true`
- **THEN** 系统 SHALL NOT 调用 `resumeSession`
- **AND** SHALL 直接调用 `connection.loadSession({ sessionId, cwd, mcpServers })`

#### Scenario: ACP-native 恢复全部失败后执行本地历史伪恢复

- **WHEN** 系统因 session missing 进入恢复流
- **AND** `resumeSession`（若支持）与 `loadSession`（若支持）均不可用或失败
- **THEN** 系统 SHALL 调用 `connection.newSession({ cwd, mcpServers })` 创建新的 ACP session
- **AND** SHALL 立即调用 `await sessionStore.persistAcpSessionId(newAcpSessionId)`
- **AND** SHALL 先按 newSession 分支规则生成并注入原有 `reminderPart`
- **AND** SHALL 再基于 FylloCode 本地持久化的历史消息构造一条额外的历史转录 `system-reminder`
- **AND** 该历史转录 `system-reminder` 的文本体 SHALL 用 `<system-reminder> ... </system-reminder>` 包裹，并包含提取出的 `assistant:` / `user:` 对话历史
- **AND** 在两条 `system-reminder` 之后，系统才发送当前用户输入
- **AND** SHALL 仅将该路径视为上下文重建，而非无损恢复原 ACP session
- **AND** 两条 `system-reminder` 都 MAY 被持久化到本地消息文件
- **AND** 前端 SHALL NOT 将这两条 `system-reminder` 作为可见历史消息展示给用户

#### Scenario: 取消流式传输

- **WHEN** IPC handler 收到 `chat:stream:cancel`，包含 `{ sessionId }`
- **THEN** 调用 `connection.cancel({ sessionId: acpSessionId })` 取消当前 prompt
- **AND** 通过 MessagePort 发送 `{ type: "done" }` 并关闭 port1

#### Scenario: 禁用内置 MCP 环境变量在所有恢复路径生效

- **WHEN** 主进程启动前环境变量 `FYLLO_DISABLE_BUNDLED_MCP=1`
- **AND** IPC handler 收到 `chat:stream:message`，无论最终走 `newSession`、`resumeSession` 还是 `loadSession`
- **THEN** 对应调用的 `mcpServers` 为空数组
- **AND** session 恢复流程其余行为保持不变

### Requirement: AcpSession 构造参数承载 owner 与 reminder 注入钩子

`AcpSessionOpts` SHALL 包含以下字段：

- `fylloSessionId: string`
- `agentId: string`
- `projectPath: string`
- `cwd: string`
- `owner: SessionOwner`（复用 `@main/services/chat/session-registry#SessionOwner`）
- `sessionStore: AcpSessionStore`（必填，新增）
- 可选 `reminderContext: { changeId?: string; stageIndex?: number; runId?: string }`
- 可选钩子 `onReminderInjected: (reminderPart: TextUIPart) => Promise<void>`，其中 `TextUIPart` 由 `ai` 包提供
- 可选 `recoveryContext: Partial<RecoveryContext>`

`AcpSession.start` SHALL 仅在 `connection.newSession()` 成功返回后，调用 `resolveSystemReminder({ owner, projectPath, cwd, fylloSessionId, agentId, ...reminderContext })`。若返回非 null 的 `TextUIPart`：

1. 在 `try/catch` 中 `await onReminderInjected(reminderPart)`。任何异常 SHALL 被 `logger.error` 记录，SHALL NOT 上抛，SHALL NOT 中断 stream
2. 无论钩子成功或失败，系统 SHALL 继续把 reminder part 置于 `connection.prompt()` 的 `prompt` 数组首位

所有构造 `AcpSession` 的 IPC handler（`chat.ts`、`proposal-apply.ts`）SHALL 传入正确的 `owner`、`sessionStore`、对应 `reminderContext`、`onReminderInjected`。

#### Scenario: chat IPC handler 构造 AcpSession 时传入 chat owner

- **WHEN** `chat:stream:message` 的 handler 构造 `AcpSession`
- **THEN** `opts.owner` 为 `"chat"`
- **AND** `opts.sessionStore` 为 `ChatAcpSessionStore` 实例
- **AND** `opts.onReminderInjected` 传入对 `<sessionId>.messages.jsonl` 调 `prependReminderToLastUserMessage` 的实现

#### Scenario: proposal-apply stage handler 构造 AcpSession 时传入 apply owner 与 stage 上下文

- **WHEN** `proposal:stageStream` 的 handler 构造 `AcpSession`
- **THEN** `opts.owner` 为 `"apply"`
- **AND** `opts.sessionStore` 为 `ApplyStageAcpSessionStore` 实例
- **AND** `opts.reminderContext` 包含 `{ changeId, stageIndex, runId }`
- **AND** `opts.onReminderInjected` 传入对 `stage-{stageIndex}.messages.jsonl` 的 prepend 实现

#### Scenario: proposal-archive handler 构造 AcpSession 时传入 archive owner

- **WHEN** `proposal:archive` 的 handler 构造 `AcpSession`
- **THEN** `opts.owner` 为 `"archive"`
- **AND** `opts.sessionStore` 为 `ArchiveAcpSessionStore` 实例
- **AND** `opts.reminderContext` 包含 `{ changeId, runId }`（其中 `runId` 为 archive run id）
- **AND** `opts.onReminderInjected` 传入对 `archive.messages.jsonl` 的 prepend 实现

#### Scenario: 钩子异常不中断 prompt 发起

- **WHEN** `onReminderInjected(reminderPart)` 抛出异常
- **THEN** `AcpSession.start` 通过 `logger.error` 记录异常
- **AND** 不再上抛该异常
- **AND** `connection.prompt()` 的 `prompt` 数组仍以 `[reminderPart, userTextBlock]` 形式发起
