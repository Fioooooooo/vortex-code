## ADDED Requirements

### Requirement: ACP agent 进程单例管理

系统 SHALL 在应用启动时（`app.whenReady`）spawn 一个 `claude-agent-acp` 子进程，通过 ACP SDK 的 `ClientSideConnection` 完成 `initialize` 握手，并将连接实例作为全局单例暴露。进程退出时 SHALL 自动重启并重新握手。

#### Scenario: 应用启动时启动 ACP agent 进程

- **WHEN** Electron 主进程 `app.whenReady` 触发
- **THEN** 系统 spawn `claude-agent-acp` 子进程
- **AND** 通过 `ClientSideConnection.initialize` 完成握手，协议版本为 `PROTOCOL_VERSION`
- **AND** 连接实例通过 `getAcpConnection()` 可供其他模块获取

#### Scenario: ACP agent 进程意外退出后自动重启

- **WHEN** `claude-agent-acp` 子进程意外退出
- **THEN** 系统重新 spawn 子进程并完成 `initialize` 握手
- **AND** 重启期间收到的 `streamMessage` 请求 SHALL 返回 `{ type: "error", data: { code: "ACP_NOT_READY" } }`

### Requirement: 权限请求自动允许（allow_once）

系统 SHALL 在 ACP agent 发起 `requestPermission` 时，自动选择 `allow_once` 选项（若存在），无需用户交互。

#### Scenario: 工具调用权限请求

- **WHEN** ACP agent 通过 `requestPermission` 请求工具调用权限
- **AND** options 中存在 `kind === "allow_once"` 的选项
- **THEN** 系统自动返回 `{ outcome: { outcome: "selected", optionId: allowOption.optionId } }`

#### Scenario: 无 allow_once 选项时取消

- **WHEN** ACP agent 发起 `requestPermission`
- **AND** options 中不存在 `kind === "allow_once"` 的选项
- **THEN** 系统返回 `{ outcome: { outcome: "cancelled" } }`

### Requirement: ACP session 生命周期管理

系统 SHALL 在每次 `streamMessage` 时，根据是否存在持久化的 `acpSessionId` 决定调用 `newSession` 或 `resumeSession`，并在 prompt 完成后将 `acpSessionId` 写回持久化存储。

#### Scenario: 首次发送消息创建新 ACP session

- **WHEN** IPC handler 收到 `chat:stream:message`，且该 `sessionId` 无持久化的 `acpSessionId`
- **THEN** 调用 `connection.newSession({ cwd, mcpServers: [] })` 创建新 ACP session
- **AND** 将返回的 `acpSessionId` 持久化到 `getDataSubPath('sessions')/<sessionId>.json`

#### Scenario: 续接已有 ACP session

- **WHEN** IPC handler 收到 `chat:stream:message`，且该 `sessionId` 存在持久化的 `acpSessionId`
- **THEN** 调用 `connection.resumeSession({ sessionId: acpSessionId, cwd })` 恢复上下文
- **AND** 若 `resumeSession` 返回错误，降级为 `newSession` 并更新持久化记录

#### Scenario: 取消流式传输

- **WHEN** IPC handler 收到 `chat:stream:cancel`，包含 `{ sessionId }`
- **THEN** 调用 `connection.cancel({ sessionId: acpSessionId })` 取消当前 prompt
- **AND** 通过 MessagePort 发送 `{ type: "done" }` 并关闭 port1

### Requirement: ACP sessionUpdate 映射为 SessionEvent

系统 SHALL 将 ACP `sessionUpdate` 通知映射为 `SessionEvent` 联合类型，通过 MessagePort 推送给渲染进程，格式与现有 `ClaudeSession` 输出兼容。

#### Scenario: 文本流式输出

- **WHEN** ACP 推送 `sessionUpdate.sessionUpdate === "agent_message_chunk"` 且 `content.type === "text"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "text_delta", text } }`

#### Scenario: 工具调用开始

- **WHEN** ACP 推送 `sessionUpdate.sessionUpdate === "tool_call"` 且 `status === "pending"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "message_upsert", message } }`
- **AND** message 包含 `dynamic-tool` part，`state: "input-available"`

#### Scenario: 工具调用完成

- **WHEN** ACP 推送 `sessionUpdate.sessionUpdate === "tool_call_update"` 且 `status === "completed"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "message_patch", id, parts } }`
- **AND** 对应 `dynamic-tool` part 的 `state` 更新为 `"output-available"`

#### Scenario: prompt 完成

- **WHEN** `connection.prompt` 返回（`stopReason` 为 `"end_turn"` 或其他终止原因）
- **THEN** 通过 MessagePort 发送 `{ type: "done", data: { totalTokens } }`
- **AND** 关闭 port1

#### Scenario: ACP 通信异常

- **WHEN** `connection.prompt` 抛出异常或 ACP 进程不可用
- **THEN** 通过 MessagePort 发送 `{ type: "error", data: { code: "ACP_ERROR", message } }`
- **AND** 关闭 port1

### Requirement: Session 信息持久化

系统 SHALL 将每个 session 的元数据（含 `acpSessionId`、`agentId`）持久化到 `getDataSubPath('sessions')/<sessionId>.json`，支持应用重启后恢复 ACP session 上下文。

#### Scenario: 首次创建 session 时写入持久化文件

- **WHEN** 新 ACP session 创建成功
- **THEN** 系统在 `getDataSubPath('sessions')/<sessionId>.json` 写入 `{ fylloSessionId, acpSessionId, agentId, projectId, title, createdAt, updatedAt }`

#### Scenario: 应用重启后读取持久化 session

- **WHEN** IPC handler 收到 `chat:stream:message`，且 `getDataSubPath('sessions')/<sessionId>.json` 存在
- **THEN** 读取文件中的 `acpSessionId` 用于 `resumeSession`
