## MODIFIED Requirements

### Requirement: ACP sessionUpdate 映射为 SessionEvent

系统 SHALL 将 ACP `session/update` notification 映射为 `SessionEvent` 联合类型，通过 MessagePort 推送给渲染进程。

ACP 的 tool call 是独立的一等公民事件（不依附于某条 assistant message），因此不使用旧的 `message_upsert`/`message_patch` 模式，改为直接映射 ACP tool call 语义的新事件类型。

ACP `agent_thought_chunk` 与 `agent_message_chunk` 语义对称（同为 `ContentChunk`），区别仅在前者代表 agent 的思考过程（reasoning），后者代表用户可见输出（text）；两者分别映射到独立的 `SessionEvent` 成员。

ACP `available_commands_update` 是 session 级 slash 命令声明（`{ availableCommands: AvailableCommand[] }`），与单条消息流动无关，映射为独立 `SessionEvent` 成员，不进入 `MessageAssembler` 的消息组装通路。

**`SessionEvent` 联合类型定义（替换旧定义）：**

```typescript
type AcpAvailableCommand = {
  name: string;
  description: string;
  hint?: string;
};

type SessionEvent =
  | { type: "text_delta"; text: string }
  | { type: "reasoning_delta"; text: string }
  | { type: "tool_call_start"; toolCallId: string; title: string; kind: string }
  | {
      type: "tool_call_update";
      toolCallId: string;
      status: "in_progress" | "completed" | "failed";
      input?: Record<string, unknown>;
      content?: string;
    }
  | {
      type: "usage_update";
      used: number;
      size: number;
      cost?: { amount: number; currency: string };
    }
  | { type: "session_info_update"; title: string }
  | { type: "available_commands_update"; commands: AcpAvailableCommand[] }
  | { type: "done"; totalTokens: number }
  | { type: "error"; code: string; message: string }
  | { type: "session_id_resolved"; acpSessionId: string };
```

#### Scenario: 文本流式输出

- **WHEN** ACP 推送 `sessionUpdate === "agent_message_chunk"` 且 `content.type === "text"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "text_delta", text } }`

#### Scenario: 思考片段流式输出

- **WHEN** ACP 推送 `sessionUpdate === "agent_thought_chunk"` 且 `content.type === "text"`
- **THEN** `acp-mapper` 产出 `SessionEvent { type: "reasoning_delta", text }`
- **AND** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "reasoning_delta", text } }`

#### Scenario: 思考片段非文本内容忽略

- **WHEN** ACP 推送 `sessionUpdate === "agent_thought_chunk"` 且 `content.type !== "text"`
- **THEN** `acp-mapper` 返回 `null`（与 `agent_message_chunk` 非文本分支一致），不产生任何下游 chunk

#### Scenario: 工具调用开始

- **WHEN** ACP 推送 `sessionUpdate === "tool_call"` 且 `status === "pending"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "tool_call_start", toolCallId, title, toolKind } }`

#### Scenario: 工具调用进度或完成

- **WHEN** ACP 推送 `sessionUpdate === "tool_call_update"`，`status` 为 `"in_progress"`、`"completed"` 或 `"failed"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "tool_call_update", toolCallId, status, input, content } }`
- **AND** `content` 为 `tool_call_update.content` 中所有 text 类型 ContentBlock 的拼合文本（无 content 时为 `undefined`）

#### Scenario: usage_update 实时推送

- **WHEN** ACP 推送 `sessionUpdate === "usage_update"`
- **THEN** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "usage_update", used, size, cost } }`
- **AND** `used`、`size`、`cost` 直接透传 ACP 推送的原始值

#### Scenario: session_info_update 推送

- **WHEN** ACP 推送 `sessionUpdate === "session_info_update"` 且 `title` 为非空字符串
- **THEN** `acp-mapper` 产出 `SessionEvent { type: "session_info_update", title }`

#### Scenario: 可用命令列表推送

- **WHEN** ACP 推送 `sessionUpdate === "available_commands_update"`，携带 `availableCommands` 数组
- **THEN** `acp-mapper` 遍历 `availableCommands`，对每条命令仅取 `name`（string，必填）、`description`（string，必填）以及 `input.hint`（当 `input != null && input.type === "unstructured"` 且 `input.hint` 为字符串时取之，否则 `hint` 为 `undefined`）
- **AND** 丢弃 `_meta` 与其他未识别字段
- **AND** 产出 `SessionEvent { type: "available_commands_update", commands: AcpAvailableCommand[] }`
- **AND** 即使 `availableCommands` 为空数组，仍产出事件（用于告知下游"agent 明确声明无可用命令"）

#### Scenario: prompt 完成

- **WHEN** `connection.prompt` 返回（`stopReason` 为 `"end_turn"` 或其他终止原因）
- **THEN** 通过 MessagePort 发送 `{ type: "done", data: { totalTokens } }`
- **AND** 关闭 port1

#### Scenario: ACP 通信异常

- **WHEN** `connection.prompt` 抛出异常或 ACP 进程不可用
- **THEN** 通过 MessagePort 发送 `{ type: "error", data: { code: "ACP_ERROR", message } }`
- **AND** 关闭 port1

#### Scenario: 未识别 sessionUpdate 类型

- **WHEN** ACP 推送其他未识别的 `sessionUpdate` 类型（例如 `plan`、`user_message_chunk`、`current_mode_update` 等协议将来扩展的类型）
- **THEN** `acp-mapper` 在 default 分支记录 debug 日志，返回 `null`，不产生任何下游 chunk

### Requirement: 前端 chat store 从流式事件组装 assistant UIMessage

前端 chat store SHALL 在流式过程中实时组装 `role: "assistant"` 的 `UIMessage`，不等待 prompt 完成。ACP 没有"assistant message"的概念，text chunk、reasoning chunk 和 tool call 均为独立事件，store 通过 `useUIMessageAssembler` 将它们归并到同一条 assistant message 的 `parts` 数组中。

**组装规则：**

- 收到第一个 `text_delta` 时，若当前无活跃 assistant message，则创建一条新的 `UIMessage`（生成临时 id），追加到 `session.messages`，并记录为 `activeAssistantId`
- 后续 `text_delta` 追加到 `activeAssistantId` 对应消息的 text part；若当前 part 不是 text part（如刚结束一段 reasoning 或 tool），新建 text part 并更新 `activeTextPartIdx`
- 收到 `reasoning_delta` 时，与 text 轨道对称处理：若当前无活跃 assistant message，先创建一条；维护独立的 `activeReasoningPartIdx`，连续 reasoning delta 合并到同一 `{ type: "reasoning", text }` part；任意 `reasoning_delta` 到达时重置 `activeTextPartIdx`（并反向亦然）
- 收到 `tool_call_start` 时，向 `activeAssistantId` 对应消息追加一个 `dynamic-tool` part（`state: "input-available"`，携带 `toolCallId`、`toolName: title`、`input: {}`）；若当前无活跃 assistant message，先创建一条；同时重置 `activeTextPartIdx` 与 `activeReasoningPartIdx`
- 收到 `tool_call_update`（completed/failed）时，找到对应 `toolCallId` 的 `dynamic-tool` part，更新 `state` 为 `"output-available"`，写入 `output: content`
- 收到 `usage_update` 时，更新 `activeSession.tokenUsage`
- 收到 `available_commands_update` 时，**不触碰消息容器**，调用 `useSessionStore().setSessionAvailableCommands(activeSession.id, commands)` 写入会话级字段
- 收到 `done` 时，清空 `activeAssistantId`、`activeTextPartIdx`、`activeReasoningPartIdx`

**`MessageChunkData` 类型（替换旧定义）：**

```typescript
type MessageChunkData =
  | { kind: "text_delta"; text: string }
  | { kind: "reasoning_delta"; text: string }
  | { kind: "tool_call_start"; toolCallId: string; title: string; toolKind: string }
  | {
      kind: "tool_call_update";
      toolCallId: string;
      status: "in_progress" | "completed" | "failed";
      input?: Record<string, unknown>;
      content?: string;
    }
  | {
      kind: "usage_update";
      used: number;
      size: number;
      cost?: { amount: number; currency: string };
    }
  | { kind: "session_info_update"; title: string }
  | { kind: "user_message"; message: UIMessage<MessageMeta> }
  | { kind: "available_commands_update"; commands: AcpAvailableCommand[] }
  | { kind: "status"; agentStatus: ChatStatus };
```

#### Scenario: 纯文本回复的流式渲染

- **WHEN** 流式过程中连续收到多个 `text_delta`
- **THEN** store 创建一条 assistant UIMessage，每个 delta 追加到其 text part，UI 实时更新

#### Scenario: 纯 reasoning 回复的流式渲染

- **WHEN** 流式过程中连续收到多个 `reasoning_delta`
- **THEN** store 创建一条 assistant UIMessage，每个 delta 追加到同一 `{ type: "reasoning", text }` part，UI 实时在 `UChatReasoning` 折叠区域中渲染

#### Scenario: reasoning 与 text 交替

- **WHEN** 同一轮回复中 `reasoning_delta` 与 `text_delta` 交替到达
- **THEN** 所有内容归并到同一条 assistant UIMessage 的 `parts` 数组；reasoning part 与 text part 各自独立延续，互相重置活跃 idx，不跨类型合并

#### Scenario: 含工具调用的回复

- **WHEN** 流式过程中收到 `tool_call_start`，随后收到 `tool_call_update`（completed）
- **THEN** store 向当前 assistant message 追加 `dynamic-tool` part，初始 `state: "input-available"`
- **AND** 收到 completed 后更新该 part 的 `state` 为 `"output-available"`，写入 `output`
- **AND** `tool_call_start` 触发时同时重置 text 与 reasoning 的 active idx

#### Scenario: 文本与工具调用交替出现

- **WHEN** 同一轮回复中 `text_delta` 和 `tool_call_start` 交替到达
- **THEN** 所有内容归并到同一条 assistant UIMessage 的 `parts` 数组，顺序与到达顺序一致

#### Scenario: 流式过程中实时更新 token 用量

- **WHEN** 前端收到 `usage_update` chunk，携带 `used` 和 `size`
- **THEN** chat store 更新 `activeSession.tokenUsage.used` 为 `used`
- **AND** 更新 `activeSession.tokenUsage.size` 为 `size`
- **AND** 若 chunk 包含 `cost`，更新 `activeSession.tokenUsage.cost` 为 `cost`
- **AND** UI 环形进度条实时反映新百分比

#### Scenario: 流式完成后保持 token 用量

- **WHEN** 前端收到 `done` 事件
- **THEN** chat store 不清空 `tokenUsage`，保持当前累计值供后续轮次继续累加

#### Scenario: 流式收到 available_commands_update

- **WHEN** 前端 chat store 在 `streamSessionMessage.onChunk` 中收到 `{ kind: "available_commands_update", commands }`
- **THEN** 不经过 `useUIMessageAssembler`，不修改 `activeSession.messages`
- **AND** 调用 `useSessionStore().setSessionAvailableCommands(activeSession.id, commands)`，将 commands 覆盖到 session 的内存态字段
- **AND** `commands` 为空数组时也会原样覆盖，使 UI 可据此判定"agent 明确声明无命令"

### Requirement: Main 进程在 chat stream done 时组装并持久化 assistant UIMessage

系统 SHALL 在 `chat:stream:message` 的主进程 handler 中维护 `MessageAssembler` 实例（来自 `@main/services/chat/message-assembler`），在 `text_delta` / `reasoning_delta` / `tool_call_start` / `tool_call_update` 事件上调用 `assembler.apply(ev)`，并在收到 `done` 事件时先执行 `assembler.flush()`，将返回的 `UIMessage<MessageMeta>` 通过 `appendMessage` 写入 `sessions/<sessionId>.messages.jsonl`，随后再通过 sink 发送 `done` chunk。落盘失败 SHALL 通过 sink 以 `ACP_ERROR` 归一化抛错，不阻塞 session 注销。

`MessageAssembler.flush()` 产生的 `UIMessage.id` 由主进程自行 `generateId()` 生成，与渲染进程活跃期间使用的临时 id 独立。

`MessageAssembler` 维护三个 active idx：`activeTextPartIdx` / `activeReasoningPartIdx` / （tool 由 `toolCallId` 直接索引，无独立 idx）。reasoning 轨道与 text 轨道互相重置，tool_call_start 同时重置两者。reasoning part 结构为 `{ type: "reasoning", text: string }`，与 AI SDK `ReasoningUIPart` 一致。

#### Scenario: usage_update 透传并实时持久化

- **WHEN** `chat:stream:message` 的 `AcpSession` emit `usage_update` 事件
- **THEN** 主进程直接通过 sink 发送 `{ type: "chunk", data: { kind: "usage_update", used, size, cost } }`
- **AND** 不经过 `MessageAssembler`
- **AND** 立即更新 session 元数据的 `tokenUsage` 为 `{ used, size, cost }` 并调用 `saveSessionMeta` 持久化到磁盘
- **AND** 当 `cost` 不存在时，`tokenUsage.cost` SHALL 保持为 `undefined`

#### Scenario: available_commands_update 透传但不持久化

- **WHEN** `chat:stream:message` 的 `AcpSession` emit `available_commands_update` 事件
- **THEN** 主进程直接通过 sink 发送 `{ type: "chunk", data: { kind: "available_commands_update", commands } }`
- **AND** 不经过 `MessageAssembler`
- **AND** 不修改 `SessionMeta`，不调用 `saveSessionMeta`，不写任何磁盘
- **AND** `commands` 为空数组时仍然透传

#### Scenario: reasoning_delta 进入 MessageAssembler 并透传

- **WHEN** `chat:stream:message` 的 `AcpSession` emit `reasoning_delta` 事件
- **THEN** 主进程调用 `assembler.apply(ev)`，assembler 按 reasoning 轨道规则合并到当前 assistant message 的 `{ type: "reasoning", text }` part
- **AND** 主进程通过 sink 发送 `{ type: "chunk", data: { kind: "reasoning_delta", text } }`

#### Scenario: Stage 正常完成时主进程组装并落盘 assistant 消息

- **WHEN** `chat:stream:message` 的 `AcpSession` emit `done` 事件
- **THEN** 主进程调用 `assembler.flush()` 得到完整 `UIMessage<MessageMeta>`
- **AND** 通过 `appendMessage(projectPath, sessionId, message)` 将该消息写入磁盘
- **AND** 通过 sink 发送 `{ type: "done", data: { totalTokens } }`
- **AND** 更新 session 元数据的 `tokenUsage.used` 字段（累加 `totalTokens`）
- **AND** 保留 session 元数据中已有的 `tokenUsage.cost`
- **AND** 从 `sessionRegistry` 注销对应的 `chat` session

#### Scenario: 渲染进程在流中途关闭仍完成 assistant 落盘

- **WHEN** 渲染进程在 chat stream 进行中关闭 MessagePort
- **THEN** 主进程的 `AcpSession` 继续运行
- **AND** `MessageAssembler` 继续累积事件（包括 reasoning_delta）
- **AND** `done` 到达时 assistant 消息正常写入 `sessions/<sessionId>.messages.jsonl`，包含 reasoning part

#### Scenario: Assistant 消息落盘失败

- **WHEN** `appendMessage` 抛出异常
- **THEN** 主进程通过 sink 发送 `{ type: "error", data: { code: "ACP_ERROR", message } }`
- **AND** 从 `sessionRegistry` 注销对应的 `chat` session

## ADDED Requirements

### Requirement: MessageAssembler 支持 reasoning 轨道

系统 SHALL 在 `electron/main/domain/chat/message-assembler.ts#MessageAssembler` 中引入独立的 reasoning 轨道，与既有 text 轨道对等独立。

具体规则：

- 新增字段 `private activeReasoningPartIdx = -1`，在 `constructor` 初始化与每次 `flush()` 结束时重置为 -1；`ensureMessage()` 在**新建** assistant message 的路径（`this.currentMessage` 为 `null` 时）上一并重置为 -1。
- `apply(ev)` 新增 `ev.type === "reasoning_delta"` 分支：
  1. 调用 `ensureMessage()` 获取当前 assistant message；
  2. 若 `activeReasoningPartIdx >= 0` 且 `message.parts[activeReasoningPartIdx]?.type === "reasoning"`，将 `ev.text` 追加到该 part 的 `.text`；
  3. 否则 `message.parts.push({ type: "reasoning", text: ev.text })` 并将 `activeReasoningPartIdx` 设为新 part 的索引；
  4. 重置 `this.activeTextPartIdx = -1`。
- `apply(ev)` 的既有 `text_delta` 分支 SHALL 在新建 text part 或 append 到 text part 后，重置 `this.activeReasoningPartIdx = -1`。
- `apply(ev)` 的既有 `tool_call_start` 分支 SHALL 同时重置 `this.activeTextPartIdx = -1` 与 `this.activeReasoningPartIdx = -1`。
- `apply(ev)` 方法体内 SHALL 仅分派 `text_delta` / `reasoning_delta` / `tool_call_start` / `tool_call_update` 四个分支；其余 `SessionEvent` 成员（`available_commands_update` / `usage_update` / `session_info_update` / `done` / `error` / `session_id_resolved`）经过时不做任何处理（方法签名 `apply(ev: SessionEvent): void` 不变，只是函数体无对应分支）。
- `flush()` 产出的 `UIMessage.parts` 可包含任意顺序的 text / reasoning / dynamic-tool part，顺序严格与事件到达顺序一致。
- reasoning part 的结构为 `{ type: "reasoning", text: string }`（与 AI SDK `ReasoningUIPart` 对齐）。SHALL NOT 写入 `state` 字段；流式视觉由外层 `UChatMessages :status` 与 `isPartStreaming(part)` 判定，不依赖 part 自身 state 字段。

#### Scenario: 单条 reasoning 流合并到同一 part

- **WHEN** assembler 连续收到 3 个 `reasoning_delta` 事件（text 分别为 "abc"、"de"、"fg"）
- **THEN** `flush()` 返回的 `UIMessage.parts` 长度为 1
- **AND** 该 part 为 `{ type: "reasoning", text: "abcdefg" }`

#### Scenario: reasoning 与 text 交替产出多 part

- **WHEN** assembler 依次收到 reasoning "r1"、text "t1"、reasoning "r2"、text "t2"
- **THEN** `flush()` 返回的 `UIMessage.parts` 为 `[reasoning("r1"), text("t1"), reasoning("r2"), text("t2")]`，顺序严格对应

#### Scenario: reasoning 被 tool 中断后再次续写

- **WHEN** assembler 依次收到 reasoning "r1"、tool_call_start、tool_call_update(completed)、reasoning "r2"
- **THEN** `flush()` 返回的 `UIMessage.parts` 为 `[reasoning("r1"), dynamic-tool(output-available), reasoning("r2")]`
- **AND** `activeReasoningPartIdx` 在 `tool_call_start` 后被重置，因此 "r2" 进入新的 reasoning part

#### Scenario: reasoning 作为 assistant message 首个 part

- **WHEN** assembler 尚未处理任何事件（`this.currentMessage === null`），直接收到 `reasoning_delta`
- **THEN** `ensureMessage` 创建新的 assistant `UIMessage` 并赋值给 `this.currentMessage`
- **AND** 该消息的首个 part 为新建的 reasoning part，`activeReasoningPartIdx` 指向该 part
- **AND** 后续 text / tool 事件可继续追加到同一 `this.currentMessage`，直到 `flush()` 被调用
