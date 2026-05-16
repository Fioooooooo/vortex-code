## Context

chat 页面当前的流式链路已经把 `onError` 回调接到 renderer，但错误处理只输出日志，缺少可见状态。与此同时，`Session` 是持久化会话模型，`chatStore` 才是当前聊天往返的瞬时状态入口，已有 `chatStatus`、cancelFn、流式组装与消息回调都集中在这里。

另一个现状是，`components/SessionItem.vue` 在切换会话时直接把 `chatStatus` 改回 `ready`，这说明切换会话的状态清理逻辑已经开始侵入 UI 组件。若后续再补 `streamError`，继续手动清字段会更容易漂移。

## Goals / Non-Goals

**Goals:**

- 让 chat 流式错误在页面上可见。
- 将聊天瞬时错误状态收拢到 `chatStore`。
- 提供一个统一 reset action，供切换会话、重新开始发送、取消流等场景复用。
- 保持 `Session.status` 的持久语义不变。

**Non-Goals:**

- 不修改主进程 ACP 错误协议。
- 不把“最近一次失败”写入 session meta 或 Session 列表状态。
- 不引入全局通知体系；错误只作用于 chat 页面当前上下文。

## Decisions

1. 错误详情归属 `chatStore` 的瞬时 state，而不是 `sessionStore`。
   - 原因：错误属于当前消息往返的运行态，不是会话元数据。
   - 备选方案：放入 `sessionStore.activeSession` 或扩展 `Session.status` 为 `error`。
   - 取舍：后者会污染持久模型，并把“失败”语义扩散到 session 列表、存储和跨页面行为。

2. 新增一个统一 reset action，建议命名为 `resetChatState`。
   - 原因：当前只重置 `chatStatus` 的做法无法覆盖未来新增的瞬时字段。
   - 备选方案：分别暴露 `resetStatus`、`clearError`。
   - 取舍：单一 reset action 更适合会话切换与初始化场景，调用方更少，也更不容易漏字段。

3. UI 通过 chat 页面消息区域内的显式错误区块渲染 `streamError`。
   - 原因：错误与聊天上下文强相关，放在消息列表附近最容易被用户理解。
   - 备选方案：用 toast 或全局通知。
   - 取舍：toast 会丢失上下文，不利于在同一会话中持续查看错误状态。

4. 错误区块采用“聊天区内联错误块”的 UI 方案。
   - 位置：渲染在当前消息流结束的位置，也就是 assistant 回复本应出现或继续出现的区域；不放在页面顶部、输入框下方的全局位置，也不放进侧边栏。
   - 样式：使用现有 UI 体系里的轻量 error alert / inline alert 风格，视觉上是消息流的一部分，而不是全局通知。
   - 内容：优先展示 `message`，`code` 作为次级信息展示；如果布局空间有限，`code` 不应抢占错误主文案。
   - 交互：不要求新增手动关闭按钮；错误状态由下一次发送、切换会话或统一 reset action 清理。
   - 原因：该错误表示“本轮聊天流式回复失败”，内联展示能保留上下文，用户能直接理解是哪次发送失败。

5. `SessionItem` 只负责触发会话切换，不再直接操作 chat 瞬时状态细节。
   - 原因：状态复位应由 store 统一管理。
   - 备选方案：继续在组件内手动设置 `chatStatus = "ready"` 并额外清理错误字段。
   - 取舍：组件手动维护字段会让清理逻辑分散，后续新增字段时容易遗漏。

## Risks / Trade-offs

- [风险] 错误区块设计不清晰会和空态、加载态、无消息态互相遮挡 → [缓解] 让错误展示只在 `streamError` 存在时出现，并明确放在当前消息流结束位置，使用轻量 inline alert 样式。
- [风险] 切换会话时忘记调用统一 reset action → [缓解] 在 `SessionItem` 中只保留对 reset action 的调用，并补测试覆盖切换行为。
- [风险] 新增状态后 stream 完成/取消路径未同步清理 → [缓解] 在 `onDone`、`onError`、cancel、切换会话等路径统一检查 reset 语义。

## Migration Plan

1. 先在 `chatStore` 内实现 `streamError` 和统一 reset action。
2. 调整 `streamSessionMessage` 的 `onError` 和相关收尾路径。
3. 更新 `SessionItem` 切换会话逻辑，改用 reset action。
4. 增加 chat 页面内联错误展示组件或区块。
5. 补充 store 和组件测试，确认切换会话后状态确实恢复为默认值。

## Resolved UI Decisions

- 错误区块展示 `message` 为主，`code` 为次级信息。
- 错误展示不需要手动关闭入口，由下一次发送、切换会话或统一 reset action 自动清理。
- 错误反馈不使用 toast、全局通知或顶部 banner。
