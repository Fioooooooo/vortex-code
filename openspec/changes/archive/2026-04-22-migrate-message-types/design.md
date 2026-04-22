## Context

`shared/types/chat.ts` 目前定义了一套自定义消息类型体系（`UserMessage`、`ThinkingMessage` 等 discriminated union），与 ai-sdk 的 `UIMessage` 完全独立。`ChatContainer` 已切换到 ai-sdk，旧消息组件（`MessageUser.vue` 等）已删除，旧类型成为死代码。

当前引用旧类型的存活文件：

- `frontend/src/stores/chat.ts` — store 中 `Session.messages` 及相关 mock 逻辑
- `frontend/src/stores/pipeline.mock.ts` — mock 数据
- `frontend/src/api/chat.ts` — API 层
- `electron/preload/api/chat.ts` — preload 层
- `frontend/src/components/chat/SessionList.vue` — 引用 `Session`
- `frontend/src/components/chat/FileTree.vue` — 引用 `FileNode`（与消息无关，保留）

## Goals / Non-Goals

**Goals:**

- 删除所有旧消息类型，以 `UIMessage<MessageMeta>` 作为统一消息类型
- 保持导出名 `Message` 不变，调用方 import 路径无需修改
- 通过 `MessageMeta` 保留业务扩展字段（`sessionId`、`createdAt`）
- 清理 store 和 mock 中依赖旧类型的逻辑

**Non-Goals:**

- 不修改 `FileNode`、`FileChange`、`DiffLine` 等文件树/diff 相关类型
- 不修改 `AgentType`、`AgentStatus`、`ModeType` 等 UI 状态类型
- 不实现真实的消息收发逻辑（mock 数据更新即可）
- 不修改 `ChatContainer.vue` 的渲染逻辑

## Decisions

### 决策 1：用类型别名而非 extends

```ts
// 方案 A（采用）：类型别名
export type Message = UIMessage<MessageMeta>;

// 方案 B（放弃）：interface extends
export interface Message extends UIMessage<MessageMeta> { ... }
```

采用方案 A。`UIMessage` 是泛型 interface，`METADATA` 泛型参数已提供扩展点，无需 extends。类型别名更简洁，且与 ai-sdk 工具函数（`isTextUIPart` 等）的类型推断完全兼容。

### 决策 2：MessageMeta 只放必要的业务字段

```ts
export interface MessageMeta {
  sessionId: string;
  createdAt: Date;
}
```

不把旧消息类型的字段（`command`、`operations` 等）搬进 `MessageMeta`。这些内容在新体系里通过 `ToolUIPart` 或 `DataUIPart` 表达，`MessageMeta` 只承载消息级别的业务元数据。

### 决策 3：Session.messages 直接改类型，不做兼容层

`Session` 是内部类型，不是对外 API 契约，直接修改 `messages: Message[]` 即可。store 中的 mock 数据同步更新为 `UIMessage` 格式。

## Risks / Trade-offs

- **[风险] store 中 mock 数据量较大** → mock 数据只需保留少量示例，其余可简化
- **[风险] `pipeline.mock.ts` 依赖旧 `Message` 类型** → 同步更新，mock 数据改为 `UIMessage` 格式
- **[Trade-off] `createdAt` 放在 `metadata` 里** → 访问路径从 `msg.createdAt` 变为 `msg.metadata?.createdAt`，略显冗长，但符合 ai-sdk 的扩展约定

## Migration Plan

1. 修改 `shared/types/chat.ts`：删除旧消息类型，新增 `MessageMeta`，重新导出 `Message`
2. 修改 `Session` interface：`messages: Message[]` 类型自动对齐
3. 修改 `frontend/src/api/chat.ts` 和 `electron/preload/api/chat.ts`：类型引用无需改动（`Message` 名称不变），检查是否有操作消息字段的逻辑需更新
4. 修改 `frontend/src/stores/chat.ts`：更新 mock 数据格式，清理旧消息操作逻辑
5. 修改 `frontend/src/stores/pipeline.mock.ts`：更新 mock 数据格式
6. 运行 `pnpm typecheck` 验证无类型错误

回滚：git revert，无数据库或外部系统影响。

## Open Questions

无。
