## Why

`shared/types/chat.ts` 中的旧消息类型（`UserMessage`、`ThinkingMessage`、`FileOpMessage` 等）是自定义的 discriminated union，与 ai-sdk 的 `UIMessage` 体系完全割裂。随着 `ChatContainer` 已切换到 ai-sdk，旧类型已无组件引用，继续保留会造成类型系统分裂，阻碍后续 AI 功能开发。

## What Changes

- **BREAKING** 删除 `shared/types/chat.ts` 中所有旧消息类型：`BaseMessage`、`UserMessage`、`ThinkingMessage`、`FileOpMessage`、`CommandMessage`、`ConfirmMessage`、`TextMessage`、`Message`（联合类型）、`MessageType`、`Attachment`
- 新增 `MessageMeta` interface，承载业务扩展字段（`sessionId`、`createdAt`）
- 新增 `Message` 类型别名：`UIMessage<MessageMeta>`，保持导出名不变，调用方 import 路径无需修改
- `Session.messages` 类型从旧 `Message[]` 改为新 `Message[]`（即 `UIMessage<MessageMeta>[]`）
- 清理 `chat.ts` store 中依赖旧消息类型的 mock 数据和操作逻辑
- 清理 `pipeline.mock.ts` 中的旧 `Message` mock 数据
- 更新 `api/chat.ts` 和 `preload/api/chat.ts` 中的类型引用

## Capabilities

### New Capabilities

无新增独立 capability。

### Modified Capabilities

- `chat-interface`：消息渲染的数据结构从自定义 discriminated union 改为 `UIMessage<MessageMeta>`，各消息类型（thinking、file-op、command、confirm）通过 `parts` 和 `metadata` 表达，而非独立 message type 字段。

## Impact

- `shared/types/chat.ts` — 核心类型文件重写
- `frontend/src/stores/chat.ts` — store 中 messages 相关逻辑
- `frontend/src/stores/pipeline.mock.ts` — mock 数据
- `frontend/src/api/chat.ts` — API 层类型
- `electron/preload/api/chat.ts` — preload 层类型
- 无新增外部依赖（`ai` 包已存在）
