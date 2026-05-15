## MODIFIED Requirements

### Requirement: 接收流式 chunk

系统 SHALL 通过 MessagePort 传输 `StreamMessage<MessageChunkData>` 类型的消息，其中 `MessageChunkData` 为联合类型，支持 `text_delta`、`reasoning_delta`、`tool_call_start`、`tool_call_update`、`session_info_update`、`user_message`、`available_commands_update`、`usage_update`、`status` 九种 chunk 语义。Preload 层的 `StreamCallbacks.onChunk` 回调参数类型 SHALL 更新为新的 `MessageChunkData`。

`MessageChunkData` 定义：

```typescript
type AcpAvailableCommand = {
  name: string;
  description: string;
  hint?: string;
};

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

`user_message` 分支 SHALL 由 `proposal:stageStream` / `proposal:archive` handler 在流启动初期直接通过 sink 发送（不经 `session-event-mapper`，因为 user message 源自主进程落盘动作，不是 ACP `SessionEvent`）。`chat:stream:message` handler SHALL NOT 发送 `user_message` chunk（chat 的 user message 由渲染进程本地 push + `chat:persistMessage` 落盘）。

`reasoning_delta` 分支 SHALL 由 `acp-mapper` 从 ACP `agent_thought_chunk` 映射产生，经 `session-event-mapper` 透传为 chunk；`chat:stream:message` / `proposal:stageStream` / `proposal:archive` 三处 handler 均 SHALL 将该事件分派到 `MessageAssembler.apply` 与 sink.sendChunk 双通路。

`available_commands_update` 分支 SHALL 由 `acp-mapper` 从 ACP `available_commands_update` 映射产生，经 `session-event-mapper` 透传为 chunk；仅 `chat:stream:message` handler SHALL 将该 chunk 透传到渲染端（绕过 `MessageAssembler`），并同时通过 `session-store` 的统一 session meta 更新入口将 commands 持久化到当前 session meta 的 `available_commands` 字段；`proposal:stageStream` / `proposal:archive` handler SHALL 对该事件显式忽略（不进 assembler、不透传、不写磁盘）。

所有消费 `MessageChunkData` 的 switch/分支 SHALL 处理 `reasoning_delta` 与 `available_commands_update` 分支；TypeScript 穷尽检查 SHALL 在编译期发现漏处理。

#### Scenario: 接收 text_delta chunk

- **WHEN** main 进程从 ACP agent 收到文本增量
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "text_delta", text: string } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "text_delta", text })` 回调

#### Scenario: 接收 reasoning_delta chunk

- **WHEN** main 进程从 ACP agent 收到 `agent_thought_chunk`，经 mapper 产出 `reasoning_delta` 事件
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "reasoning_delta", text: string } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "reasoning_delta", text })` 回调

#### Scenario: 接收 tool_call_start chunk

- **WHEN** main 进程收到工具调用开始事件
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "tool_call_start", toolCallId, title, toolKind } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "tool_call_start", ... })` 回调

#### Scenario: 接收 tool_call_update chunk

- **WHEN** main 进程收到工具调用更新事件
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "tool_call_update", toolCallId, status, input, content } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "tool_call_update", ... })` 回调

#### Scenario: 接收 user_message chunk

- **WHEN** `proposal:stageStream` 或 `proposal:archive` handler 在流启动初期落盘 user 消息后
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "user_message", message } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "user_message", message })` 回调

#### Scenario: 接收 available_commands_update chunk 并持久化

- **WHEN** `chat:stream:message` handler 从 `AcpSession` 收到 `available_commands_update` 事件
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "available_commands_update", commands } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "available_commands_update", commands })` 回调
- **AND** 主进程通过 `session-store` 的统一 session meta 更新入口将 `commands` 写入当前 session meta 的 `available_commands` 字段
- **AND** `commands` 为空数组时仍然发送并持久化（用于传达"agent 明确声明无命令"语义）

#### Scenario: proposal 流不透传 available_commands_update

- **WHEN** `proposal:stageStream` 或 `proposal:archive` handler 从 `AcpSession` 收到 `available_commands_update` 事件
- **THEN** handler 显式忽略该事件：不调用 `MessageAssembler.apply`、不调用 `sink.sendChunk`、不写磁盘
- **AND** renderer 不会从 proposal 流收到 `available_commands_update` chunk
