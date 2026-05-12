## ADDED Requirements

### Requirement: AcpSession 构造参数承载 owner 与 reminder 注入钩子

`AcpSessionOpts` SHALL 新增以下字段：

- `owner: SessionOwner`（复用 `@main/services/chat/session-registry#SessionOwner`）
- 可选 `reminderContext: { changeId?: string; stageIndex?: number; runId?: string }`
- 可选钩子 `onReminderInjected: (reminderPart: TextUIPart) => Promise<void>`，其中 `TextUIPart` 由 `ai` 包提供

`AcpSession.start` SHALL 仅在 `connection.newSession()` 成功返回后，调用 `resolveSystemReminder({ owner, projectPath, cwd, fylloSessionId, agentId, ...reminderContext })`。若返回非 null 的 `TextUIPart`：

1. 在 `try/catch` 中 `await onReminderInjected(reminderPart)`。任何异常 SHALL 被 `logger.error` 记录，SHALL NOT 上抛，SHALL NOT 中断 stream
2. 无论钩子成功或失败，系统 SHALL 继续把 reminder part 置于 `connection.prompt()` 的 `prompt` 数组首位

所有构造 `AcpSession` 的 IPC handler（`chat.ts`、`proposal-apply.ts`）SHALL 传入正确的 `owner` 与对应 `reminderContext`、`onReminderInjected`。

#### Scenario: chat IPC handler 构造 AcpSession 时传入 chat owner

- **WHEN** `chat:stream:message` 的 handler 构造 `AcpSession`
- **THEN** `opts.owner` 为 `"chat"`
- **AND** `opts.onReminderInjected` 传入对 `<sessionId>.messages.jsonl` 调 `prependReminderToLastUserMessage` 的实现

#### Scenario: proposal-apply stage handler 构造 AcpSession 时传入 apply owner 与 stage 上下文

- **WHEN** `proposal:stageStream` 的 handler 构造 `AcpSession`
- **THEN** `opts.owner` 为 `"apply"`
- **AND** `opts.reminderContext` 包含 `{ changeId, stageIndex, runId }`
- **AND** `opts.onReminderInjected` 传入对 `stage-{stageIndex}.messages.jsonl` 的 prepend 实现

#### Scenario: proposal-archive handler 构造 AcpSession 时传入 archive owner

- **WHEN** `proposal:archive` 的 handler 构造 `AcpSession`
- **THEN** `opts.owner` 为 `"archive"`
- **AND** `opts.reminderContext` 包含 `{ changeId, runId }`
- **AND** `opts.onReminderInjected` 传入对 `archive.messages.jsonl` 的 prepend 实现

#### Scenario: 钩子异常不中断 prompt 发起

- **WHEN** `onReminderInjected(reminderPart)` 抛出异常
- **THEN** `AcpSession.start` 通过 `logger.error` 记录异常
- **AND** 不再上抛该异常
- **AND** `connection.prompt()` 的 `prompt` 数组仍以 `[reminderPart, userTextBlock]` 形式发起

## MODIFIED Requirements

### Requirement: ACP session 生命周期管理

系统 SHALL 在每次 `streamMessage` 时，根据是否存在持久化的 `acpSessionId` 决定调用 `newSession` 或 `resumeSession`。`acpSessionId` SHALL 在 `newSession`/`resumeSession` 返回后**立即**持久化，不等待 prompt 完成。

`newSession` 与 `resumeSession` 的 `mcpServers` 参数 SHALL 统一由 `@main/infra/mcp/bundled-mcp-servers#getBundledMcpServers({ projectPath })` 计算得出，而非硬编码空数组或忽略不传。系统 SHALL 不在 `services/chat/acp-session.ts` 内部拼装 MCP server 的 `command`/`args`/`env`；所有启动描述符单点通过 `getBundledMcpServers` 获取。虽然 ACP 协议中 `ResumeSessionRequest.mcpServers` 为 optional，但为了保持恢复后的 session 内可用 tool 集合与 new session 一致，系统 SHALL 在 resume 调用中也显式传入该参数。

当 `AcpSession.start` 本次调用真正执行了 `connection.newSession()`（包括首次创建与 resume 失败降级两种路径），系统 SHALL 在 `newSession` 成功返回后、调用 `connection.prompt()` 之前，尝试注入 system-reminder：调用 `resolveSystemReminder({ owner, projectPath, cwd, fylloSessionId, agentId, ...opts.reminderContext })`，若返回非 null 的 `TextUIPart`，在 `try/catch` 中 `await opts.onReminderInjected(reminderPart)`（捕获任何异常仅 `logger.error` 记录、不上抛、不中断 stream），再把 reminder block 插入 `connection.prompt` 的 `prompt` 数组首位。`resumeSession` 成功分支 SHALL NOT 注入 reminder。

系统 SHALL 在 `acp-session.ts` 中为 `catch { acpSessionId = undefined }` 的 fallback 分支保留注释，说明"resumeSession 失败降级的完整治理（历史消息回放、sessionId 迁移等）不在本 change 范围内，遗留独立后续任务"。

#### Scenario: 首次发送消息创建新 ACP session

- **WHEN** IPC handler 收到 `chat:stream:message`，且该 `sessionId` 无持久化的 `acpSessionId`
- **THEN** 调用 `connection.newSession({ cwd, mcpServers })`，其中 `mcpServers` 为 `getBundledMcpServers({ projectPath })` 的返回值
- **AND** 在正常启用内置 MCP 的场景下，`mcpServers` 至少包含一个 `name === "fyllo-specs"` 的 spec
- **AND** `newSession` 返回后立即将 `acpSessionId` 持久化到 session 元数据文件
- **AND** emit `{ type: "session_id_resolved", acpSessionId }` 事件，IPC 层监听后写入 session-store
- **AND** 调用 `resolveSystemReminder(...)`；若返回非 null 的 `TextUIPart`，在 `try/catch` 中 `await onReminderInjected(reminderPart)`（异常仅 `logger.error`、不上抛），再把 reminder part 置于 `connection.prompt()` 的 `prompt` 数组首位

#### Scenario: 续接已有 ACP session

- **WHEN** IPC handler 收到 `chat:stream:message`，且该 `sessionId` 存在持久化的 `acpSessionId`
- **THEN** 调用 `connection.resumeSession({ sessionId: acpSessionId, cwd, mcpServers })`，其中 `mcpServers` 为 `getBundledMcpServers({ projectPath })` 的返回值
- **AND** 在正常启用内置 MCP 的场景下，`mcpServers` 至少包含一个 `name === "fyllo-specs"` 的 spec
- **AND** 若 `resumeSession` 成功，SHALL NOT 注入 system-reminder；`connection.prompt()` 的 `prompt` 为单一 user text block
- **AND** 若 `resumeSession` 返回错误，降级为 `newSession`，降级时 `mcpServers` 同样由 `getBundledMcpServers({ projectPath })` 计算，更新持久化记录，并 emit `session_id_resolved`；降级成功后 SHALL 按首次分支执行 reminder 注入

#### Scenario: 取消流式传输

- **WHEN** IPC handler 收到 `chat:stream:cancel`，包含 `{ sessionId }`
- **THEN** 调用 `connection.cancel({ sessionId: acpSessionId })` 取消当前 prompt
- **AND** 通过 MessagePort 发送 `{ type: "done" }` 并关闭 port1

#### Scenario: 禁用内置 MCP 环境变量生效

- **WHEN** 主进程启动前环境变量 `FYLLO_DISABLE_BUNDLED_MCP=1`
- **AND** IPC handler 收到 `chat:stream:message`，无论走 `newSession` 还是 `resumeSession` 分支
- **THEN** 对应调用的 `mcpServers` 为空数组
- **AND** chat 流程其余行为保持不变

#### Scenario: Fallback 分支保留 TODO 注释

- **WHEN** `resumeSession` 抛出异常、系统将 `acpSessionId` 置为 undefined 降级到 `newSession`
- **THEN** 该 `catch` 分支上方或内部 SHALL 有注释指出"resumeSession 失败降级治理（历史消息回放、sessionId 迁移等）为独立后续工作"
