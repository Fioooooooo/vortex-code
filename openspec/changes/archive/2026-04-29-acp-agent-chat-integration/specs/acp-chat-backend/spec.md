## ADDED Requirements

### Requirement: ACP agent 进程池管理（按 agentId 懒启动复用）

系统 SHALL 维护一个 `Map<agentId, AcpAgentProcess>` 进程池（`acp-process-pool.ts`），不在应用启动时预启动任何进程。首次使用某个 `agentId` 时，系统 SHALL 懒启动对应子进程并通过 `ClientSideConnection.initialize` 完成握手；后续同 `agentId` 的请求复用同一连接。进程退出时 SHALL 自动重启并重新握手。

#### Scenario: 首次使用某 agentId 时懒启动进程

- **WHEN** `getOrStartProcess(agentId)` 被调用，且该 `agentId` 尚无运行中的进程
- **THEN** 系统从 `AcpInstalledRecord` 读取 `installMethod`，按以下规则组装 spawn 命令：
  - `npx`：`spawn("npx", ["--no-install", distribution.npx.package, ...(distribution.npx.args ?? [])])`
  - `uvx`：`spawn("uvx", [distribution.uvx.package, ...(distribution.uvx.args ?? [])])`
  - `binary`：`spawn(installPath, [])` （`installPath` 来自 `installed.json` 中的记录，指向 `getDataSubPath('acp')/bin/<agent-id>/` 下的可执行文件）
- **AND** 所有方式均使用 `stdio: ["pipe", "pipe", "inherit"]`
- **AND** spawn 后通过 `ClientSideConnection.initialize` 完成握手
- **AND** 将连接实例存入进程池，供后续同 `agentId` 的请求复用

#### Scenario: 同 agentId 复用已有进程

- **WHEN** `getOrStartProcess(agentId)` 被调用，且该 `agentId` 已有运行中的进程
- **THEN** 直接返回已有的 `ClientSideConnection`，不重新 spawn

#### Scenario: ACP agent 进程意外退出后自动重启

- **WHEN** 某 `agentId` 对应的子进程意外退出
- **THEN** 系统重新 spawn 该子进程并完成 `initialize` 握手
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

系统 SHALL 在每次 `streamMessage` 时，根据是否存在持久化的 `acpSessionId` 决定调用 `newSession` 或 `resumeSession`。`acpSessionId` SHALL 在 `newSession`/`resumeSession` 返回后**立即**持久化，不等待 prompt 完成。

#### Scenario: 首次发送消息创建新 ACP session

- **WHEN** IPC handler 收到 `chat:stream:message`，且该 `sessionId` 无持久化的 `acpSessionId`
- **THEN** 调用 `connection.newSession({ cwd, mcpServers: [] })` 创建新 ACP session
- **AND** `newSession` 返回后立即将 `acpSessionId` 持久化到 session 元数据文件
- **AND** emit `{ type: "session_id_resolved", acpSessionId }` 事件，IPC 层监听后写入 session-store

#### Scenario: 续接已有 ACP session

- **WHEN** IPC handler 收到 `chat:stream:message`，且该 `sessionId` 存在持久化的 `acpSessionId`
- **THEN** 调用 `connection.resumeSession({ sessionId: acpSessionId, cwd })` 恢复上下文
- **AND** 若 `resumeSession` 返回错误，降级为 `newSession`，更新持久化记录，并 emit `session_id_resolved`

#### Scenario: 取消流式传输

- **WHEN** IPC handler 收到 `chat:stream:cancel`，包含 `{ sessionId }`
- **THEN** 调用 `connection.cancel({ sessionId: acpSessionId })` 取消当前 prompt
- **AND** 通过 MessagePort 发送 `{ type: "done" }` 并关闭 port1

### Requirement: ACP sessionUpdate 映射为 SessionEvent

系统 SHALL 将 ACP `session/update` notification 映射为 `SessionEvent` 联合类型，通过 MessagePort 推送给渲染进程。

ACP 的 tool call 是独立的一等公民事件（不依附于某条 assistant message），因此不使用旧的 `message_upsert`/`message_patch` 模式，改为直接映射 ACP tool call 语义的新事件类型。

**`SessionEvent` 联合类型定义（替换旧定义）：**

```typescript
type SessionEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call_start"; toolCallId: string; title: string; kind: string }
  | {
      type: "tool_call_update";
      toolCallId: string;
      status: "in_progress" | "completed" | "failed";
      content?: string;
    }
  | { type: "done"; totalTokens: number }
  | { type: "error"; code: string; message: string }
  | { type: "session_id_resolved"; acpSessionId: string };
```

#### Scenario: 文本流式输出

- **WHEN** ACP 推送 `sessionUpdate === "agent_message_chunk"` 且 `content.type === "text"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "text_delta", text } }`

#### Scenario: 工具调用开始

- **WHEN** ACP 推送 `sessionUpdate === "tool_call"` 且 `status === "pending"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "tool_call_start", toolCallId, title, kind } }`

#### Scenario: 工具调用进度或完成

- **WHEN** ACP 推送 `sessionUpdate === "tool_call_update"`，`status` 为 `"in_progress"`、`"completed"` 或 `"failed"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "tool_call_update", toolCallId, status, content } }`
- **AND** `content` 为 `tool_call_update.content` 中所有 text 类型 ContentBlock 的拼合文本（无 content 时为 `undefined`）

#### Scenario: prompt 完成

- **WHEN** `connection.prompt` 返回（`stopReason` 为 `"end_turn"` 或其他终止原因）
- **THEN** 通过 MessagePort 发送 `{ type: "done", data: { totalTokens } }`
- **AND** 关闭 port1

#### Scenario: ACP 通信异常

- **WHEN** `connection.prompt` 抛出异常或 ACP 进程不可用
- **THEN** 通过 MessagePort 发送 `{ type: "error", data: { code: "ACP_ERROR", message } }`
- **AND** 关闭 port1

### Requirement: 前端 chat store 从流式事件组装 assistant UIMessage

前端 chat store SHALL 在流式过程中实时组装 `role: "assistant"` 的 `UIMessage`，不等待 prompt 完成。ACP 没有"assistant message"的概念，text chunk 和 tool call 均为独立事件，store 负责将它们归并到同一条 assistant message 的 `parts` 数组中。

**组装规则：**

- 收到第一个 `text_delta` 时，若当前无活跃 assistant message，则创建一条新的 `UIMessage`（生成临时 id），追加到 `session.messages`，并记录为 `activeAssistantId`
- 后续 `text_delta` 追加到 `activeAssistantId` 对应消息的 text part
- 收到 `tool_call_start` 时，向 `activeAssistantId` 对应消息追加一个 `dynamic-tool` part（`state: "input-available"`，携带 `toolCallId`、`toolName: title`、`input: {}`）；若当前无活跃 assistant message，先创建一条
- 收到 `tool_call_update`（completed/failed）时，找到对应 `toolCallId` 的 `dynamic-tool` part，更新 `state` 为 `"output-available"`，写入 `output: content`
- 收到 `done` 时，清空 `activeAssistantId`

**`MessageChunkData` 类型（替换旧定义）：**

```typescript
type MessageChunkData =
  | { kind: "text_delta"; text: string }
  | { kind: "tool_call_start"; toolCallId: string; title: string; kind: string }
  | {
      kind: "tool_call_update";
      toolCallId: string;
      status: "in_progress" | "completed" | "failed";
      content?: string;
    }
  | { kind: "status"; agentStatus: ChatStatus };
```

#### Scenario: 纯文本回复的流式渲染

- **WHEN** 流式过程中连续收到多个 `text_delta`
- **THEN** store 创建一条 assistant UIMessage，每个 delta 追加到其 text part，UI 实时更新

#### Scenario: 含工具调用的回复

- **WHEN** 流式过程中收到 `tool_call_start`，随后收到 `tool_call_update`（completed）
- **THEN** store 向当前 assistant message 追加 `dynamic-tool` part，初始 `state: "input-available"`
- **AND** 收到 completed 后更新该 part 的 `state` 为 `"output-available"`，写入 `output`

#### Scenario: 文本与工具调用交替出现

- **WHEN** 同一轮回复中 `text_delta` 和 `tool_call_start` 交替到达
- **THEN** 所有内容归并到同一条 assistant UIMessage 的 `parts` 数组，顺序与到达顺序一致

### Requirement: Session 信息持久化

系统 SHALL 将每个 session 的元数据（含 `acpSessionId`、`agentId`）持久化到 `getDataSubPath('sessions')/<sessionId>.json`，支持应用重启后恢复 ACP session 上下文。

#### Scenario: 首次创建 session 时写入持久化文件

- **WHEN** 新 ACP session 创建成功
- **THEN** 系统在 `getDataSubPath('projects')/<encodeProjectPath(project.path)>/sessions/<sessionId>.json` 写入 `{ sessionId, acpSessionId, agentId, title, turnCount, createdAt, updatedAt }`
- **AND** `encodeProjectPath` 实现为：去掉路径开头的 `/`，将所有 `/` 替换为 `-`

#### Scenario: 应用重启后读取持久化 session

- **WHEN** IPC handler 收到 `chat:stream:message`，且 `getDataSubPath('projects')/<encodeProjectPath(project.path)>/sessions/<sessionId>.json` 存在
- **THEN** 读取文件中的 `acpSessionId` 用于 `resumeSession`
