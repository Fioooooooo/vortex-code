## Overview

这次改动不改变 renderer IPC 形态，重点是把 session meta 的持久化语义从“调用方自行拼完整对象并覆盖写入”改成“session-store 提供字段级更新能力，所有主线程调用方只声明要改什么字段”。核心目标是消除 stale snapshot 导致的字段丢失，并为后续新增 meta 字段提供天然兼容性。

## Current Problem

当前 session meta 的写入入口分散在三个地方：

- `chat-service.ts` 负责创建和更新 session 时直接 `saveSessionMeta`
- `ipc/chat.ts` 在流式事件中自己做 `loadSessionMeta -> merge -> saveSessionMeta`
- `acp-session.ts` 在 `start()` 中构造一份新的完整 meta 直接 `saveSessionMeta`

这个结构的问题有两层：

1. 写入边界分散，任何新字段都要求所有调用方同步保留，否则容易丢字段。
2. `AcpSession.start()` 当前使用 `meta?.title`、`meta?.tokenUsage` 等已知字段重建整对象，但没有把 `available_commands` 带回去，第二轮消息启动时就会把该字段从文件里擦掉。

## Design Decisions

### 1. 在 session-store 中提供统一的 session meta 更新 API

保留 `loadSessionMeta` / `listSessionMetas` / `appendMessage` / `deleteSession`，并新增面向主线程调用方的统一更新入口，例如：

- `createSessionMeta(projectPath, meta)`
- `updateSessionMeta(projectPath, sessionId, updater)`

`updateSessionMeta` 内部负责：

- 读取当前 meta
- 规范化字段
- 调用 `updater(currentMeta)` 生成下一份 meta 或 patch
- 以 merge 语义写回磁盘

这样 `ipc/chat.ts`、`acp-session.ts`、`chat-service.ts` 不再需要自行维护 `load -> spread -> save`。

### 2. merge 语义以“保留未改字段”为第一原则

session-store 的更新实现需要满足：

- 调用方只改本次关心的字段
- 未被本次更新覆盖的字段全部保留
- 允许显式把 `available_commands` 写成空数组
- 对未来新增但当前类型尚未建模的字段尽量保持透传，而不是静默丢弃

由于当前 `normalizeSessionMeta()` 会筛正 `tokenUsage` 和 `available_commands`，实现上可以继续以它为规范化入口，但写回前应基于“当前磁盘内容 + 本次 patch”的结果生成下一份对象，避免从零重构。

### 3. 调用方职责收缩

- `chat-service.ts`
  - 创建 session 调用 `createSessionMeta`
  - 修改标题/agentId 调用 `updateSessionMeta`
- `ipc/chat.ts`
  - 流式中的 `usage_update`、`available_commands_update`、`session_info_update`、`done` 只调用 session-store 的更新 API
  - 删除本地 `updateSessionMeta` helper
- `acp-session.ts`
  - `newSession` / `resumeSession` 后更新 `acpSessionId`、`turnCount`、`updatedAt` 时调用 session-store 更新 API
  - 不再拼装完整 meta 对象

## Test Strategy

新增和调整两层测试：

- `session-store.spec.ts`
  - 验证字段级更新会保留 `available_commands`
  - 验证更新 `tokenUsage` / `title` / `acpSessionId` 时不会擦掉其他字段
  - 验证显式空数组和历史未知字段可保留
- `ipc/chat.spec.ts` / `acp-session.spec.ts`
  - 覆盖“第一轮收到 available_commands_update，第二轮 start 后字段仍存在”的回归场景
  - 验证 chat 流式事件通过新的 session-store API 持久化
