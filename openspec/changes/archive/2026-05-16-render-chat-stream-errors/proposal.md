## Why

当前 chat 页面已经能接收流式 error 事件，但只记录日志，没有可见的错误反馈。这样会导致主进程异常、ACP session 异常或流式中断时，用户只能看到停住的会话状态，无法判断失败原因，也无法区分“正在流式”与“已失败”。

## What Changes

- 在 `chatStore` 中新增流式错误详情状态，用于保存当前这轮聊天的 error 信息并供 UI 渲染。
- 新增一个统一的 chat 状态重置 action，用于在切换会话、开始新一轮发送或清理流式状态时，一次性恢复 `chatStatus` 与错误状态。
- 将 `components/SessionItem` 中切换会话时对 `chatStatus` 的手动重置，替换为调用上述统一 reset action。
- 在聊天主区域增加内联错误展示区块，让流式 error 在当前消息流结束位置直接呈现；样式使用现有 UI 体系的轻量 error alert，展示 `message` 为主、`code` 为次级信息。
- 错误反馈不使用 toast、全局通知或页面顶部 banner，避免脱离本轮聊天上下文。
- 保持 `Session.status` 的现有持久语义不变，不把“最近一次流式失败”写入 session 持久模型。

## Capabilities

### New Capabilities

- `chat-stream-error-feedback`: chat 页面可见渲染流式错误，并通过统一 reset action 管理 chat 瞬时状态。

### Modified Capabilities

- `chat-interface`: 增加流式错误展示与状态清理约束；切换会话时必须通过 chatStore reset action 统一恢复聊天瞬时状态。

## Impact

- `frontend/src/stores/chat.ts`：新增错误状态、reset action、onError 清理逻辑。
- `frontend/src/components/chat/`：新增或调整错误渲染组件。
- `frontend/src/components/chat/SessionItem.vue`：切换会话时改为调用 chatStore reset action。
- `frontend/src/pages/chat.vue` / `ChatContainer.vue`：在消息流区域承接内联错误展示，位置应与 assistant 回复区域一致或紧邻当前消息流末尾。
- `frontend/src/__tests__/`：需要补充状态重置、错误渲染、会话切换行为测试。
- `openspec/specs/chat-interface/spec.md`：补充行为规范，确保状态归属和 UI 表现不漂移。
