## MODIFIED Requirements

### Requirement: Main 进程在 stage 完成时持久化 UIMessage

系统 SHALL 在 main 进程维护 `MessageAssembler`，将 `SessionEvent` 流组装为 `UIMessage<MessageMeta>`，在收到 `done` 事件时将完整消息写入 `apply-runs/<changeId>/stage-{N}.messages.jsonl`，格式与 `session-store` 的 `appendMessage` 完全一致。

持久化不依赖 renderer 存活：即使 renderer 在 stage 执行过程中关闭，main 进程仍会在 stage 完成时写入磁盘。

`MessageAssembler` 组装规则（与 `chat:stream:message` 的 `MessageAssembler` 以及 renderer `useUIMessageAssembler` 的规则完全一致）：

- `text_delta`：追加到当前 assistant message 的 active text part；若无则新建 text part；重置 `activeReasoningPartIdx`
- `reasoning_delta`：追加到当前 assistant message 的 active reasoning part；若无则新建 `{ type: "reasoning", text }` part；重置 `activeTextPartIdx`
- `tool_call_start`：在当前 assistant message 追加 `DynamicToolUIPart`，state 为 `"input-available"`；同时重置 `activeTextPartIdx` 与 `activeReasoningPartIdx`
- `tool_call_update`（`in_progress`）：更新对应 `DynamicToolUIPart` 的 input/title
- `tool_call_update`（`completed` / `failed`）：将对应 part 的 state 改为 `"output-available"`，填入 output
- `done`：将当前 assistant message（含 reasoning / text / dynamic-tool 各类 part）写入磁盘，更新 `run.json` 的 `currentStageIndex` 和 `updatedAt`
- `available_commands_update` / `usage_update` / `session_info_update`：`MessageAssembler.apply` **不处理**这些事件，由外部 IPC handler 另行决策

**事件白名单（stage stream handler）**：`proposal:stageStream` 的事件 switch SHALL 将 `text_delta`、`reasoning_delta`、`tool_call_start`、`tool_call_update` 四类事件分派到 "assembler.apply(ev) + toMessageChunk(ev) + sink.sendChunk(chunk)" 组合。对 `available_commands_update` 事件 SHALL 显式忽略：不调用 assembler、不 sendChunk、不写磁盘、不修改 `run.json`。其余事件（`session_info_update` / `done` / `error` / `session_id_resolved`）按既有逻辑处理。

#### Scenario: Stage 正常完成

- **WHEN** `AcpSession` emit `done` 事件
- **THEN** main 进程将 `MessageAssembler` 中的当前 assistant message（含 reasoning / text / dynamic-tool 各类 part）写入 `stage-{N}.messages.jsonl`
- **AND** 更新 `run.json` 的 `currentStageIndex`（+1）和 `updatedAt`
- **AND** 通过 port 发送 `{ type: "done", data: { totalTokens } }`

#### Scenario: Stage 流透传 reasoning_delta

- **WHEN** stage 执行中 `AcpSession` emit `reasoning_delta` 事件
- **THEN** main 进程调用 `assembler.apply(ev)`（按 reasoning 轨道合并到当前 assistant message）
- **AND** 通过 sink 发送 `{ type: "chunk", data: { kind: "reasoning_delta", text } }`

#### Scenario: Stage 流忽略 available_commands_update

- **WHEN** stage 执行中 `AcpSession` emit `available_commands_update` 事件
- **THEN** main 进程不调用 `assembler.apply(ev)`
- **AND** 不通过 sink 发送任何 chunk
- **AND** 不修改 `run.json`
- **AND** 不写任何磁盘文件

#### Scenario: Renderer 在 stage 执行中途关闭

- **WHEN** renderer 关闭，MessagePort 断开
- **THEN** main 进程的 `AcpSession` 继续运行
- **AND** `MessageAssembler` 继续组装消息（含 reasoning / text / dynamic-tool）
- **AND** stage 完成时正常写入磁盘

#### Scenario: Stage 执行出错

- **WHEN** `AcpSession` emit `error` 事件
- **THEN** main 进程更新 `run.json` 的 `status` 为 `"error"`
- **AND** 通过 port 发送 `{ type: "error", data: { code, message } }`（如果 port 仍活着）

### Requirement: Archive 流独立落盘与状态持久化

系统 SHALL 在 `proposal:archive` handler 的 `onReady` 阶段：

1. 构造 `ArchiveRunMeta`，结构为 `{ runId: "archive-<timestamp>", changeId, status: "running", startedAt, updatedAt }`，通过 `saveArchiveRunMeta` 写入 `apply-runs/<changeId>/archive.json`
2. 构造 archive 的 user message（`role: "user"`，`parts: [{ type: "text", text: prompt }]`），通过 `appendArchiveMessage` 写入 `apply-runs/<changeId>/archive.messages.jsonl`，并通过 sink 发送 `{ kind: "user_message", message }` chunk
3. 使用 `MessageAssembler` 收集 assistant 事件（含 `text_delta`、`reasoning_delta`、`tool_call_start`、`tool_call_update` 四类）；`done` 时 `flush()` → `appendArchiveMessage` → 更新 `archive.json` 的 `status` 为 `"done"` 与 `updatedAt`
4. 若 `AcpSession` emit `error`，更新 `archive.json` 的 `status` 为 `"error"` 后再通过 sink 发送错误 chunk

archive 的持久化路径 SHALL 与 stage 完全解耦：不写入 `stage-*.messages.jsonl`，不修改 `run.json` 的 `stages` 数组。

**事件白名单（archive stream handler）**：`proposal:archive` 的事件判定 SHALL 将 `text_delta`、`reasoning_delta`、`tool_call_start`、`tool_call_update` 四类事件分派到 "assembler.apply(ev) + toMessageChunk(ev) + sink.sendChunk(chunk)" 组合。对 `available_commands_update` 事件 SHALL 显式忽略：不调用 assembler、不 sendChunk、不写磁盘、不修改 `archive.json`。其余事件（`session_info_update` / `done` / `error`）按既有逻辑处理。

#### Scenario: Archive 流启动时初始化 meta 与 user 消息

- **WHEN** `proposal:archive` handler 的 `onReady` 执行
- **THEN** 主进程写入 `archive.json`（status: "running"）
- **AND** 落盘 archive user message 到 `archive.messages.jsonl`
- **AND** 通过 sink 发送 `user_message` chunk
- **AND** 启动 `AcpSession`

#### Scenario: Archive 流透传 reasoning_delta

- **WHEN** archive 执行中 `AcpSession` emit `reasoning_delta` 事件
- **THEN** main 进程调用 `assembler.apply(ev)`（按 reasoning 轨道合并到当前 assistant message）
- **AND** 通过 sink 发送 `{ type: "chunk", data: { kind: "reasoning_delta", text } }`

#### Scenario: Archive 流忽略 available_commands_update

- **WHEN** archive 执行中 `AcpSession` emit `available_commands_update` 事件
- **THEN** main 进程不调用 `assembler.apply(ev)`
- **AND** 不通过 sink 发送任何 chunk
- **AND** 不修改 `archive.json`
- **AND** 不写任何磁盘文件

#### Scenario: Archive 正常完成

- **WHEN** `AcpSession` emit `done` 事件
- **THEN** 主进程调用 `assembler.flush()` 得到完整 assistant `UIMessage<MessageMeta>`（可能含 reasoning / text / dynamic-tool 各类 part）
- **AND** 通过 `appendArchiveMessage` 将该消息追加到 `archive.messages.jsonl`
- **AND** 更新 `archive.json` 的 `status` 为 `"done"`，更新 `updatedAt`
- **AND** 通过 sink 发送 `{ type: "done" }`

#### Scenario: Archive 执行出错

- **WHEN** `AcpSession` emit `error` 事件
- **THEN** 主进程更新 `archive.json` 的 `status` 为 `"error"`，更新 `updatedAt`
- **AND** 通过 sink 发送 `{ type: "error", data: { code, message } }`
