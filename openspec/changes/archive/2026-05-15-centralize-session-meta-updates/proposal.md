## Why

`sessionMeta` 目前在 `chat-service`、`ipc/chat`、`acp-session` 等多处以整对象方式读写，新增 `available_commands` 后已经出现字段被旧快照覆盖丢失的问题。未来 session meta 还会继续扩展，因此需要把读写责任收拢到单一 store，并把更新语义明确为字段级合并。

## What Changes

- 将 session meta 的读取、创建、字段更新与消息外的持久化写入职责收拢到 `electron/main/infra/storage/session-store.ts`
- 新增 session meta 的字段级 patch / mutate API，保证更新已有字段时不会覆盖未参与本次变更的其他字段
- 调整 chat 主线程与 ACP session 流程，禁止在 store 外手写 `load -> merge -> save` 或构造不完整 meta 整体回写
- 补充覆盖 `available_commands`、`tokenUsage`、`title`、`acpSessionId` 等交错更新场景的测试，防止后续新增 meta 字段时再次发生覆盖回归

## Capabilities

### New Capabilities

- `session-meta-storage`: 统一约束 session meta 的字段级持久化与单点存储边界

### Modified Capabilities

- `acp-chat-backend`: session meta 持久化流程改为通过 store 字段级更新，避免 `newSession`/后续 turn 覆盖已有 meta 字段
- `ipc-streaming`: `chat:stream:message` 对 session meta 的流式持久化改为调用 session-store 的统一更新入口

## Impact

- 受影响代码主要在 `electron/main/infra/storage/session-store.ts`、`electron/main/ipc/chat.ts`、`electron/main/services/chat/acp-session.ts`、`electron/main/services/chat/chat-service.ts`
- 会新增或调整 session-store 相关单元测试与 chat IPC 测试
- 不引入新依赖，不修改 renderer IPC 接口，但会调整主进程内部持久化边界
