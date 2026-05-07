## ADDED Requirements

### Requirement: 流式 handler 必须通过 `makeStreamChannel` 实现

所有基于 `MessageChannelMain` 的流式 IPC handler（包括但不限于 `chat:stream:message`、`proposal:stageStream`、`proposal:archive`）SHALL 通过 `ipc/_kit/stream-channel.ts` 导出的 `makeStreamChannel` 创建。禁止在 handler 内部自行调用 `new MessageChannelMain()`、手动维护 `portClosed` 守卫、手写 `sendChunk` / `sendDone` / `sendError` 三件套、或复制 `SessionEvent → MessageChunkData` 映射。

#### Scenario: 流式 handler 使用 kit

- **WHEN** 查看 `main/ipc/chat.ts` 的 `streamMessage` handler 实现
- **THEN** handler 通过 `makeStreamChannel({ event, portChannel, onReady, mapEvent })` 创建 channel
- **AND** 不包含 `new MessageChannelMain()`、`port1.close()`、`portClosed.value = true` 等模式

#### Scenario: 流式映射统一

- **WHEN** 在代码库中搜索将 `SessionEvent` 转换为 `MessageChunkData` 的实现
- **THEN** 仅存在一份位于 `services/chat/session-event-mapper.ts`，`chat` / `proposal-apply` / `archive` 三处流式 handler 共用

#### Scenario: kit 处理提前关闭

- **WHEN** renderer 在流式过程中关闭 port
- **THEN** `makeStreamChannel` 检测到 port close，自动调用 runner 的 `cancel()`
- **AND** 随后 handler 产生的 chunk 被静默丢弃，不再 postMessage 到已关闭 port

### Requirement: 流式 handler 具备统一的 ready 握手与错误归一

`makeStreamChannel` SHALL 实现以下协议：向 renderer `postMessage(portChannel, null, [port2])` → 等待 renderer 通过 port 发送 `{ type: "ready" }` → 调用业务提供的 `onReady(send)` 获取 `{ start, cancel }` → 调用 `start()`；过程中 kit 负责将业务事件映射为 `chunk`、业务完成映射为 `done`、业务异常或 port 关闭映射为 `cancel` 并在必要时发送 `error`。

#### Scenario: ready 之前不启动业务

- **WHEN** handler 被调用但 renderer 尚未回复 ready
- **THEN** 业务侧 `start()` 尚未被调用，AcpSession 等资源未分配

#### Scenario: 业务抛错归一化

- **WHEN** `start()` 抛出 Error（或 reject）
- **THEN** kit 通过 port 发送 `{ type: "error", data: { code: "ACP_ERROR", message } }`
- **AND** 关闭 port，并调用 runner 的 `cancel()`（如已启动）
