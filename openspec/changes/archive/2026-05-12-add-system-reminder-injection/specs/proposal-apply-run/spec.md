## MODIFIED Requirements

### Requirement: Stage user message 由主进程落盘并通过 user_message chunk 实时推送

系统 SHALL 在 `proposal:stageStream` handler 的 `onReady` 阶段，在调用 `session.start(prompt)` 之前：

1. 构造 `UIMessage<MessageMeta>`，`role` 为 `"user"`，`parts` 为单个 `{ type: "text", text: prompt }`，`metadata.sessionId` 为 `stageFylloSessionId`，`metadata.createdAt` 为当前时间
2. 通过 `appendApplyRunMessage(projectPath, changeId, stageIndex, userMessage)` 将该消息作为 `stage-{stageIndex}.messages.jsonl` 的首行写入
3. 通过 sink 发送 `{ type: "chunk", data: { kind: "user_message", message: userMessage } }` 给渲染进程

构造 `AcpSession` 时 SHALL 传入 `owner: "apply"`、`reminderContext: { changeId, stageIndex, runId }`、以及 `onReminderInjected` 钩子。钩子实现 SHALL 调用 `prependReminderToLastUserMessage(<stage-{stageIndex}.messages.jsonl 的绝对路径>, reminderPart)`，把 reminder text part pre-pend 到刚落盘的 user 消息 `parts` 首位。钩子 SHALL NOT 通过 sink 推送 `user_message` chunk——渲染进程内存中的 user message 保持"无 reminder"版本。

`MessageAssembler` 随后只处理 assistant 相关事件；`done` 时 `flush()` 的 assistant `UIMessage` 通过 `appendApplyRunMessage` 追加到同一 jsonl 文件（磁盘顺序：user 首行，assistant 后续）。

#### Scenario: Stage stream 启动时落盘 user 消息

- **WHEN** `proposal:stageStream` 的 handler 完成 runMeta 校验、prompt 构造
- **THEN** 主进程构造 role 为 `"user"` 的 `UIMessage<MessageMeta>`
- **AND** 通过 `appendApplyRunMessage` 将该消息写入 `apply-runs/<changeId>/stage-{stageIndex}.messages.jsonl`
- **AND** 通过 sink 发送 `{ type: "chunk", data: { kind: "user_message", message } }`
- **AND** 之后才调用 `session.start(prompt)`

#### Scenario: 首次 stage 运行触发 reminder 注入

- **WHEN** 本次 stage 的 `AcpSession.start` 真正调用了 `connection.newSession()`（含 resume 失败降级）
- **AND** `resolveSystemReminder({ owner: "apply", ... })` 返回非 null 的 `TextUIPart`
- **THEN** 主进程在 `try/catch` 中 `await onReminderInjected(reminderPart)`；成功时磁盘上 `stage-{stageIndex}.messages.jsonl` 中最后一条 user 消息的 `parts` 首位被 prepend 为 reminder text part
- **AND** 随后 `connection.prompt()` 的 `prompt` 数组首位为 reminder part，次位为 user text block
- **AND** 不通过 sink 推送额外的 `user_message` chunk

#### Scenario: Stage resume 场景不注入 reminder

- **WHEN** 本次 stage 的 `AcpSession.start` 成功走 `resumeSession` 分支
- **THEN** 不调用 `onReminderInjected`
- **AND** 磁盘上 user 消息 `parts` 保持仅含原 text part
- **AND** `connection.prompt()` 的 `prompt` 为单一 user text block

#### Scenario: user 落盘失败

- **WHEN** 首次 `appendApplyRunMessage` 写入 user 消息时抛出异常
- **THEN** 主进程通过 sink 发送 `{ type: "error", data: { code: "APPLY_RUN_PERSIST_FAILED", message } }`
- **AND** 不启动 `AcpSession`
- **AND** 从 `sessionRegistry` 注销（或不注册）对应的 `apply` session

#### Scenario: Reminder 持久化失败不阻塞 prompt 继续

- **WHEN** `onReminderInjected` 抛出异常（例如磁盘 I/O 失败）
- **THEN** 主进程 `logger.error` 记录但不上抛、不中断 stream
- **AND** `connection.prompt()` 仍以 reminder part 置首、user text block 随后的形式正常发起

### Requirement: Archive 流独立落盘与状态持久化

系统 SHALL 在 `proposal:archive` handler 的 `onReady` 阶段：

1. 构造 `ArchiveRunMeta`，结构为 `{ runId: "archive-<timestamp>", changeId, status: "running", startedAt, updatedAt }`，通过 `saveArchiveRunMeta` 写入 `apply-runs/<changeId>/archive.json`
2. 构造 archive 的 user message（`role: "user"`，`parts: [{ type: "text", text: prompt }]`），通过 `appendArchiveMessage` 写入 `apply-runs/<changeId>/archive.messages.jsonl`，并通过 sink 发送 `{ kind: "user_message", message }` chunk
3. 构造 `AcpSession` 时传入 `owner: "archive"`、`reminderContext: { changeId, runId }`、以及 `onReminderInjected` 钩子。钩子实现 SHALL 调用 `prependReminderToLastUserMessage(<archive.messages.jsonl 的绝对路径>, reminderPart)`，把 reminder text part pre-pend 到刚落盘的 user 消息 `parts` 首位；钩子 SHALL NOT 通过 sink 推送 `user_message` chunk
4. 使用 `MessageAssembler` 收集 assistant 事件；`done` 时 `flush()` → `appendArchiveMessage` → 更新 `archive.json` 的 `status` 为 `"done"` 与 `updatedAt`
5. 若 `AcpSession` emit `error`，更新 `archive.json` 的 `status` 为 `"error"` 后再通过 sink 发送错误 chunk

archive 的持久化路径 SHALL 与 stage 完全解耦：不写入 `stage-*.messages.jsonl`，不修改 `run.json` 的 `stages` 数组。

#### Scenario: Archive 流启动时初始化 meta 与 user 消息

- **WHEN** `proposal:archive` handler 的 `onReady` 执行
- **THEN** 主进程写入 `archive.json`（status: "running"）
- **AND** 落盘 archive user message 到 `archive.messages.jsonl`
- **AND** 通过 sink 发送 `user_message` chunk
- **AND** 启动 `AcpSession`（owner 为 `"archive"`）

#### Scenario: Archive 首次运行触发 reminder 注入

- **WHEN** 本次 archive 的 `AcpSession.start` 真正调用了 `connection.newSession()`
- **AND** `resolveSystemReminder({ owner: "archive", ... })` 返回非 null 的 `TextUIPart`
- **THEN** 主进程在 `try/catch` 中 `await onReminderInjected(reminderPart)`；成功时磁盘上 `archive.messages.jsonl` 中最后一条 user 消息的 `parts` 首位被 prepend 为 reminder text part
- **AND** `connection.prompt()` 的 `prompt` 数组首位为 reminder part，次位为 user text block

#### Scenario: Archive 正常完成

- **WHEN** `AcpSession` emit `done` 事件
- **THEN** 主进程调用 `assembler.flush()` 得到完整 assistant `UIMessage<MessageMeta>`
- **AND** 通过 `appendArchiveMessage` 将该消息追加到 `archive.messages.jsonl`
- **AND** 更新 `archive.json` 的 `status` 为 `"done"`，更新 `updatedAt`
- **AND** 通过 sink 发送 `{ type: "done" }`

#### Scenario: Archive 执行出错

- **WHEN** `AcpSession` emit `error` 事件
- **THEN** 主进程更新 `archive.json` 的 `status` 为 `"error"`，更新 `updatedAt`
- **AND** 通过 sink 发送 `{ type: "error", data: { code, message } }`
