## REMOVED Requirements

### Requirement: Claude CLI 子进程以 stream-json 模式启动

**Reason**: 被 `acp-chat-backend` 取代，Chat 底层改用 ACP 协议通信，不再直接 spawn `claude` CLI。
**Migration**: 使用 `acp-chat-backend` 中的 ACP session 管理替代，`electron/main/cli/claude/` 目录在验证通过后删除。

#### Scenario: 新会话首次发送消息

- **WHEN** IPC handler 收到 `chat:stream:message`
- **THEN** （已移除）不再 spawn claude CLI 子进程

#### Scenario: 已有会话续接发送消息

- **WHEN** IPC handler 收到 `chat:stream:message`，且存在 Claude sessionId
- **THEN** （已移除）不再使用 `--resume` 参数

#### Scenario: claude 命令不存在时返回错误

- **WHEN** spawn 抛出 `ENOENT` 错误
- **THEN** （已移除）改由 ACP 进程不可用时的错误处理覆盖

### Requirement: 从首条 system 消息中提取并持久化 Claude sessionId

**Reason**: ACP 协议通过 `newSession` / `resumeSession` 管理 session，不再依赖 Claude CLI 的 system 消息提取 sessionId。
**Migration**: 使用 `session-store.ts` 持久化 ACP sessionId，替代内存映射 `session-map.ts`。

#### Scenario: 新会话提取 Claude sessionId

- **WHEN** 子进程输出含 `session_id` 的 system 消息
- **THEN** （已移除）

#### Scenario: 续接会话不覆盖已有映射

- **WHEN** 子进程输出含 `session_id` 的 system 消息，且映射已存在
- **THEN** （已移除）

### Requirement: NDJSON 输出逐行解析为强类型

**Reason**: ACP 协议通过 `ClientSideConnection` 的回调接收结构化事件，不再需要手动解析 NDJSON。
**Migration**: 删除 `parser.ts`，使用 ACP SDK 的事件回调替代。

#### Scenario: 解析有效 JSON 行

- **WHEN** 子进程输出一行有效 JSON
- **THEN** （已移除）

#### Scenario: 跳过无效行

- **WHEN** 子进程输出无法解析的内容
- **THEN** （已移除）

### Requirement: stream_event text_delta 实时推送

**Reason**: 由 `acp-chat-backend` 的 `agent_message_chunk` 映射替代。
**Migration**: 见 `acp-chat-backend` spec 中的"文本流式输出"场景。

#### Scenario: 接收文本 delta

- **WHEN** 解析到 `stream_event` text_delta
- **THEN** （已移除）

### Requirement: assistant 完整消息映射为 UIMessage 并 upsert

**Reason**: 由 `acp-chat-backend` 的 `tool_call` 映射替代。
**Migration**: 见 `acp-chat-backend` spec 中的"工具调用开始"场景。

#### Scenario: 纯文本 assistant 消息

- **WHEN** 解析到 `type: "assistant"` 纯文本消息
- **THEN** （已移除）

#### Scenario: 含 tool_use 的 assistant 消息

- **WHEN** 解析到含 `tool_use` 的 assistant 消息
- **THEN** （已移除）

### Requirement: user tool_result 回填 assistant UIMessage

**Reason**: 由 `acp-chat-backend` 的 `tool_call_update` 映射替代。
**Migration**: 见 `acp-chat-backend` spec 中的"工具调用完成"场景。

#### Scenario: tool_result 在 assistant 消息之后到达

- **WHEN** 解析到 `type: "user"` tool_result
- **THEN** （已移除）

#### Scenario: tool_result 在 assistant 消息之前到达（缓存）

- **WHEN** tool_result 先于 assistant 消息到达
- **THEN** （已移除）

### Requirement: result 消息触发流式完成

**Reason**: 由 `acp-chat-backend` 的 `prompt` 返回处理替代。
**Migration**: 见 `acp-chat-backend` spec 中的"prompt 完成"场景。

#### Scenario: 成功完成

- **WHEN** 解析到 `type: "result", subtype: "success"`
- **THEN** （已移除）

#### Scenario: CLI 返回错误结果

- **WHEN** 解析到 `type: "result", subtype: "error"`
- **THEN** （已移除）

### Requirement: 支持取消流式传输

**Reason**: 由 `acp-chat-backend` 的 `connection.cancel` 替代。
**Migration**: 见 `acp-chat-backend` spec 中的"取消流式传输"场景。

#### Scenario: 用户取消

- **WHEN** IPC handler 收到 `chat:stream:cancel`
- **THEN** （已移除）改由 ACP cancel 处理
