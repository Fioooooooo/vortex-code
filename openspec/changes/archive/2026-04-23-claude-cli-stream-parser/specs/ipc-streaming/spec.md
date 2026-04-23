## MODIFIED Requirements

### Requirement: 接收流式 chunk

系统 SHALL 通过 MessagePort 传输 `StreamMessage<MessageChunkData>` 类型的消息，其中 `MessageChunkData` 为联合类型，支持 `text_delta`、`message_upsert`、`message_patch`、`status` 四种 chunk 语义。Preload 层的 `StreamCallbacks.onChunk` 回调参数类型 SHALL 更新为 `MessageChunkData`。

#### Scenario: 接收 text_delta chunk

- **WHEN** main 进程从 Claude CLI 收到文本增量
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "text_delta", text: string } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "text_delta", text })` 回调

#### Scenario: 接收 message_upsert chunk

- **WHEN** main 进程收到完整的 assistant 消息
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "message_upsert", message: UIMessage } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "message_upsert", message })` 回调

#### Scenario: 接收 message_patch chunk

- **WHEN** main 进程收到 tool_result 并回填 assistant 消息
- **THEN** 通过 port1 发送 `{ type: "chunk", data: { kind: "message_patch", id: string, parts: UIMessagePart[] } }`
- **AND** preload 层调用 `callbacks.onChunk({ kind: "message_patch", id, parts })` 回调
