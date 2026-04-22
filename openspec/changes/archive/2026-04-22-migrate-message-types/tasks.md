## 1. 更新核心类型定义

- [x] 1.1 删除 `shared/types/chat.ts` 中的旧消息类型：`BaseMessage`、`UserMessage`、`ThinkingMessage`、`FileOpMessage`、`CommandMessage`、`ConfirmMessage`、`TextMessage`、`Message`（联合类型）、`MessageType`、`Attachment`
- [x] 1.2 新增 `MessageMeta` interface（`sessionId: string`、`createdAt: Date`）并导出
- [x] 1.3 新增 `Message` 类型别名：`type Message = UIMessage<MessageMeta>`，从 `ai` 导入 `UIMessage`

## 2. 更新 chat store

- [x] 2.1 删除 `generateMockMessages()` 函数，改写为返回 `Message[]`（`UIMessage<MessageMeta>`）格式的 mock 数据，用 `role`/`parts` 替代旧字段
- [x] 2.2 重写 `sendMessage()` action：构造 `role: "user"` 的 `UIMessage<MessageMeta>`，移除旧 `type: "user"` 字段
- [x] 2.3 删除 `resolveConfirm()` action（依赖旧 `ConfirmMessage.type` 字段，新体系通过 tool call state 处理）
- [x] 2.4 移除 store 中对 `Message` 旧字段的所有引用（`msg.type === "confirm"` 等判断）

## 3. 更新 pipeline mock 数据

- [x] 3.1 重写 `pipeline.mock.ts` 中的 `createMockMessages()` 函数，改为返回 `UIMessage<MessageMeta>[]` 格式

## 4. 更新 API 层

- [x] 4.1 检查 `frontend/src/api/chat.ts`：`sendMessage` 返回类型 `IpcResponse<Message>` 自动对齐，确认无旧字段访问
- [x] 4.2 检查 `electron/preload/api/chat.ts`：同上，确认无旧字段访问

## 5. 验证

- [x] 5.1 运行 `pnpm typecheck` 确认无类型错误
