## 1. 设计 chatStore 瞬时错误状态与 reset 语义

- [x] 1.1 将本次新增的错误详情建模为 `chatStore` 的瞬时状态；`chatStatus`、`streamError`、`cancelFn` 均由 `frontend/src/stores/chat.ts` 管理，不写入 `sessionStore`、`Session` 或 session meta
- [x] 1.2 统一 reset action 必须命名为 `resetChatState`，职责固定为一次性恢复 chat 瞬时默认值：`chatStatus = "ready"`、`streamError = null`，并清理不应跨会话保留的当前流式控制状态
- [x] 1.3 `resetChatState` 的必需调用场景：用户切换会话时调用；开始新一轮发送前调用或等价地清理上一轮 `streamError` 并进入 submitted 状态；不得在 `onError` 写入错误后立即调用，避免错误块无法渲染
- [x] 1.4 流式正常结束时不得把 `chatStatus` 留在 `submitted` 或 `streaming`；流式异常结束时必须保留 `streamError` 供 UI 渲染，并将 `chatStatus` 置为 `error`
- [x] 1.5 `Session.status` 不扩展为 `error`，不得把“最近一次失败”写进持久 session 模型或会话列表状态

## 2. 实现 chatStore 状态和事件收敛

- [x] 2.1 在 `frontend/src/stores/chat.ts` 新增 `streamError` 状态，类型与 `window.api.chat.streamMessage` 的 `onError` 回调对齐，至少可表示 `code` 与 `message`
- [x] 2.2 实现并导出 `resetChatState`，确保它只复位 chat 瞬时状态，不触碰 sessionStore 里的会话列表数据、消息数据或 session 持久字段
- [x] 2.3 调整 `streamSessionMessage` 的发送开始逻辑：每次新发送开始前清空上一轮 `streamError`，设置本轮 `cancelFn`，并将 `chatStatus` 从 `ready` 或 `error` 进入 `submitted`
- [x] 2.4 调整流式内容回调逻辑：收到首个或任意增量内容时，将 `chatStatus` 从 `submitted` 进入 `streaming`；不得清理当前消息内容
- [x] 2.5 调整 `onDone` 逻辑：正常完成时清理本轮 `cancelFn`，将 `chatStatus` 恢复为 `ready`，并确保没有旧的 `streamError` 继续展示
- [x] 2.6 调整 `onError` 逻辑：收到 `{ code, message }` 时写入 `streamError`，清理本轮 `cancelFn`，将 `chatStatus` 置为 `error`；不得在该路径调用 `resetChatState` 或把 `streamError` 立即清空
- [x] 2.7 调整取消流式逻辑：用户 stop 后沿用现有 cancel/onDone/onError 收尾；若最终进入 `onError`，必须按 2.6 保留错误；若最终进入 `onDone`，必须按 2.5 回到 ready
- [x] 2.8 保留现有日志输出时，`console.error` 只能作为调试日志，不能替代 `streamError` 状态写入和 UI 渲染

## 3. 将会话切换逻辑改为统一 reset

- [x] 3.1 修改 `frontend/src/components/chat/SessionItem.vue`，把 `chatStore.chatStatus = "ready"` 的手动赋值替换为调用 `chatStore.resetChatState()`
- [x] 3.2 确保切换会话时不会遗留上一个会话的 `streamError` 或其他 chat 瞬时状态
- [x] 3.3 `SessionItem` 不得直接写入 `chatStatus`、`streamError` 或 `cancelFn`；会话切换导致的 chat 瞬时状态恢复必须统一通过 `resetChatState` 完成

## 4. 增加 chat 页面内联错误展示

- [x] 4.1 将错误展示位置固定为聊天区内联错误块：渲染在当前消息流结束位置，即 assistant 回复本应出现或继续出现的区域
- [x] 4.2 明确不使用 toast、全局通知、页面顶部 banner 或侧边栏错误标记，避免错误反馈脱离本轮聊天上下文
- [x] 4.3 在 `frontend/src/components/chat/` 下新增 `ChatStreamError.vue`，或复用同目录下已有等价错误组件；该组件的唯一数据来源必须是 `chatStore.streamError`
- [x] 4.4 错误组件样式优先使用 @nuxt/ui 或项目已有的 alert/error 组件实现轻量 inline error alert；若现有组件不适合，再使用局部样式实现同等视觉层级
- [x] 4.5 错误组件内容以 `streamError.message` 为主文案，`streamError.code` 作为次级信息展示；当空间有限时优先保证 message 可读
- [x] 4.6 不新增手动关闭按钮；错误清理由下一次发送、切换会话或 `resetChatState` 完成
- [x] 4.7 错误块必须插入消息流布局中，不得覆盖正常消息列表、空态、加载态或输入框；在无 assistant 内容生成时，错误块仍应出现在用户本轮消息之后
- [x] 4.8 新一轮发送开始后，上一轮错误块必须消失；页面不得同时展示上一轮错误和当前轮 submitted/streaming 状态

## 5. 补充测试与验收

- [x] 5.1 为 `frontend/src/stores/chat.ts` 补单测，覆盖 `onError` 后 `streamError` 写入且保留、`chatStatus = "error"`、`cancelFn` 被清理
- [x] 5.2 为 `resetChatState` 补单测，验证调用后 `chatStatus = "ready"`、`streamError = null`，且不会修改 sessionStore 的会话列表、消息数据或 session 持久字段
- [x] 5.3 为 chat 页面错误展示补组件或页面测试，验证 `onError` 时错误以内联错误块可见，且位置位于消息流结束处
- [x] 5.4 验证错误块以 `message` 为主、`code` 为次级信息，不通过 toast、全局通知或顶部 banner 呈现
- [x] 5.5 为 `frontend/src/components/chat/SessionItem.vue` 或其交互路径补测试，验证点击另一个会话后表现为 `chatStatus` 恢复 ready、`streamError` 清空；测试可以 spy `resetChatState`，但最终断言必须覆盖状态结果
- [x] 5.6 验证 `onDone` 后错误不展示、新发送后上一轮错误不展示、切换会话后上一轮错误不展示
- [x] 5.7 回归确认 `Session.status`、会话列表、消息持久化逻辑未因错误态改动而变化
- [x] 5.8 验证用户可从错误态继续发送下一轮消息，且 UI 状态按 `error -> submitted -> streaming/ready` 转换，不会卡死在 error
