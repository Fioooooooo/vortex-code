# system-reminder-injection Specification

## Purpose

定义主进程在 ACP session 新建时，按 owner 分发并持久化一次性 system-reminder 的能力，以及前端对该 reminder 的隐藏约束。

## Requirements

### Requirement: 主进程全权控制 system-reminder 注入

系统 SHALL 在主进程内提供 `resolveSystemReminder(ctx: SystemReminderContext): Promise<TextUIPart | null>` 函数，按 `owner` 分派到对应 provider。返回非 null 时返回值 SHALL 为 `TextUIPart`（`ai` 包中的类型，形如 `{ type: "text", text: string }`），其 `text` 字段首位为 `<system-reminder>`、末位为 `</system-reminder>`（允许内部换行）。返回 null 表示不注入。

`SystemReminderContext` 的字段 SHALL 为：`owner`（复用 `@main/services/chat/session-registry#SessionOwner`，即 `"chat" | "apply" | "archive"`）、`projectPath`、`cwd`、`fylloSessionId`、`agentId`、以及可选的 `changeId` / `stageIndex` / `runId`。

reminder 相关代码（provider、模板、类型）SHALL 全部位于 `electron/main/services/chat/system-reminder/`，`frontend/` 与 `electron/preload/` SHALL NOT import 该目录下的任何模块。系统 SHALL NOT 新增任何 IPC 通道、preload 暴露、`shared/` 类型，用以让用户或渲染进程影响 reminder 内容或触发时机。

#### Scenario: 已注册的 owner 返回 TextUIPart

- **WHEN** 使用 `owner ∈ {"chat", "apply", "archive"}` 调用 `resolveSystemReminder`
- **AND** 对应 provider 存在且模板插值成功
- **THEN** 返回 `TextUIPart`（`type === "text"`），其 `text` 经 trim 后以 `<system-reminder>` 开头、以 `</system-reminder>` 结尾

#### Scenario: 未识别 owner 返回 null

- **WHEN** `owner` 不在已注册 provider 列表中
- **THEN** 返回 `null`
- **AND** 不抛出异常

### Requirement: 注入判定严格绑定 `connection.newSession()` 成功调用

系统 SHALL 在 `AcpSession.start` 的生命周期内，仅当本次调用执行了 `connection.newSession()` 并成功返回时，才执行 system-reminder 注入。`resumeSession` 成功时 SHALL NOT 注入。

系统 SHALL NOT 使用 `sessionMeta.turnCount`、任何实例级 `hasInjected` 标志、或 `wasResumed` 参数作为判定依据。

#### Scenario: 真·首次发送消息时注入

- **WHEN** `AcpSession.start` 被调用，且对应 `fylloSessionId` 无持久化的 `acpSessionId`
- **THEN** 系统调用 `connection.newSession()`
- **AND** 在 `newSession` 成功返回后、`connection.prompt()` 调用前，解析并注入 system-reminder

#### Scenario: resumeSession 成功时不注入

- **WHEN** `AcpSession.start` 被调用，且对应 `fylloSessionId` 有持久化 `acpSessionId`
- **AND** `connection.resumeSession(...)` 成功返回
- **THEN** 系统 SHALL NOT 注入 system-reminder
- **AND** `connection.prompt()` 的 `prompt` 数组结构保持为单一 user text block

#### Scenario: resumeSession 失败降级到 newSession 时注入

- **WHEN** `connection.resumeSession(...)` 抛出异常
- **AND** 系统降级调用 `connection.newSession()` 并成功返回
- **THEN** 系统 SHALL 按首次分支执行 reminder 注入

### Requirement: Reminder 以独立 text block 注入 ACP prompt 数组

系统 SHALL 将 `resolveSystemReminder` 返回的 `TextUIPart` 直接放入 `connection.prompt()` 的 `prompt` 数组**首位**，随后跟随原有的 user text block，即 `prompt: [reminderPart, { type: "text", text: userPrompt }]`。

系统 SHALL NOT 将 reminder 文本与 user prompt 拼接为单个 text block。

#### Scenario: 注入时 prompt 数组为 `[reminder, user]`

- **WHEN** 注入条件满足且 `resolveSystemReminder` 返回非 null
- **THEN** `connection.prompt` 调用参数的 `prompt` 字段为两元素数组，第一个 element 为 reminder text block，第二个 element 为 user text block

#### Scenario: 无 reminder 时 prompt 数组为 `[user]`

- **WHEN** 注入条件满足但 `resolveSystemReminder` 返回 `null`
- **THEN** `connection.prompt` 调用参数的 `prompt` 字段为单元素数组，仅含 user text block

### Requirement: Reminder 持久化到 user message 的 parts 首位

系统 SHALL 在 reminder 注入发生时，将 `resolveSystemReminder` 返回的 `TextUIPart` **pre-pend 到当前 owner 对应 `*.messages.jsonl` 中最后一条 `role === "user"` 消息的 `parts` 数组首位**，随后才调用 `connection.prompt()`。

系统 SHALL 提供磁盘原语 `prependReminderToLastUserMessage(filePath, reminderPart): Promise<void>`，三个 owner（chat / apply / archive）通过传入不同 jsonl 路径复用同一实现。原语实现 SHALL 为"全量读取 jsonl → 定位最后一条 `role === "user"` 消息 → 在其 `parts[0]` 位置插入 reminder part → 全量覆盖写回"。

持久化到磁盘的 reminder part 的 `type` 字段 SHALL 固定为 `"text"`（即 `TextUIPart`），系统 SHALL NOT 新增自定义 `part.type` 值。

系统 SHALL NOT 为 reminder 创建独立的 `UIMessage`，也 SHALL NOT 通过 sink 把 reminder chunk 同步到渲染进程的内存消息容器。"渲染进程当前 turn 内存中的 user message 与磁盘 user message 的 parts 结构不一致"是预期行为，不是缺陷。

#### Scenario: chat owner 把 reminder 写入 `<sessionId>.messages.jsonl`

- **WHEN** chat owner 满足注入条件并完成注入
- **THEN** 系统更新 `sessions/<sessionId>.messages.jsonl` 中当前 turn 的 user 消息，`parts[0]` 为 reminder text part（`type === "text"`）

#### Scenario: apply owner 把 reminder 写入 `stage-{N}.messages.jsonl`

- **WHEN** apply owner 满足注入条件并完成注入
- **THEN** 系统更新对应 `apply-runs/<changeId>/stage-{stageIndex}.messages.jsonl` 中的 user 消息，`parts[0]` 为 reminder text part

#### Scenario: archive owner 把 reminder 写入 `archive.messages.jsonl`

- **WHEN** archive owner 满足注入条件并完成注入
- **THEN** 系统更新 `apply-runs/<changeId>/archive.messages.jsonl` 中的 user 消息，`parts[0]` 为 reminder text part

#### Scenario: 持久化失败不阻塞 prompt 继续

- **WHEN** `prependReminderToLastUserMessage`（由 `onReminderInjected` 钩子调用）抛出异常
- **THEN** `AcpSession.start` 捕获异常并通过 `logger.error` 记录
- **AND** 不再上抛、不中断 stream
- **AND** 仍继续把 reminder block 加入 ACP prompt 数组并调用 `connection.prompt()`

### Requirement: 模板变量白名单与 sanitize

系统 SHALL 使用文本模板（每个 owner 一份 `.md` 文件）配合白名单变量插值生成 reminder 正文。允许的变量名 SHALL 限定为 `{{changeId}}`、`{{stageIndex}}`、`{{runId}}`、`{{projectPath}}`；其他 `{{...}}` 占位符保持字面量不替换。

若任一白名单变量的实际值包含 `<` 或 `>` 字符，provider SHALL 返回 `null`（跳过该 session 的 reminder 注入），并通过 `logger.warn` 记录。日志字段 SHALL 至少包含 `owner`、被拒字段名、`fylloSessionId`。

系统 SHALL 提供内部 util `wrapAsSystemReminder(body: string): string`，以 `<system-reminder>\n{body}\n</system-reminder>` 包裹正文。若 `body` 字面量已包含 `<system-reminder>` 或 `</system-reminder>` 字符串，`wrapAsSystemReminder` SHALL 抛 `Error`（开发期即暴露模板错误，不做静默 sanitize）。该 util 不对外导出给 IPC handler。

#### Scenario: 白名单变量被替换

- **WHEN** provider 读取模板，上下文提供 `changeId = "add-foo-bar"`
- **THEN** 模板中的 `{{changeId}}` 被替换为 `"add-foo-bar"`

#### Scenario: 非白名单占位符保留字面量

- **WHEN** 模板中出现 `{{unknownField}}`
- **THEN** 渲染后仍为 `{{unknownField}}` 字符串

#### Scenario: 变量值含尖括号时跳过注入

- **WHEN** 任一白名单变量的值包含 `<` 或 `>` 字符
- **THEN** provider 返回 `null`
- **AND** 写入 `logger.warn` 日志，至少包含 owner、被拒字段名、`fylloSessionId`

#### Scenario: 模板正文已含 system-reminder 标签时抛错

- **WHEN** `wrapAsSystemReminder(body)` 被调用，`body` 字面量包含 `<system-reminder>` 或 `</system-reminder>` 字符串
- **THEN** 抛 `Error`
- **AND** provider 将该异常冒泡（非 sanitize 能处理的 user 输入，是模板 bug）

### Requirement: v1 仅对 Claude Code 家族 agent 输出 reminder

系统 SHALL 在 v1 实现中，维护一个主进程内置的 Claude Code 家族 `agentId` **精确列表**，初始锁定为单元素 `[DEFAULT_ACP_AGENT_ID]`。仅当 `ctx.agentId` 严格等于该列表中任一元素时，`resolveSystemReminder` 才返回非 null；其他 agentId SHALL 返回 `null`。

判定逻辑 SHALL 使用严格相等，SHALL NOT 使用子串匹配、前缀匹配或正则。列表定义所在源文件 SHALL 在头部注释中说明："未来新增兼容 agent 时需主动加入此列表"。

#### Scenario: 默认 agent 正常输出 reminder

- **WHEN** `ctx.agentId` 严格等于 `DEFAULT_ACP_AGENT_ID`
- **AND** 其他条件满足
- **THEN** `resolveSystemReminder` 返回非 null 的 `TextUIPart`

#### Scenario: 未知 agent 跳过 reminder

- **WHEN** `ctx.agentId` 不在内置精确列表中
- **THEN** `resolveSystemReminder` 返回 `null`
- **AND** 会话继续，不中断 prompt 流程
