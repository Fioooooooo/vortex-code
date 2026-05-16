## MODIFIED Requirements

### Requirement: UChatPromptSubmit 支持停止流式回复

系统 SHALL 在 `chatStatus` 为 `streaming` 或 `submitted` 时，响应 `UChatPromptSubmit` 的 `stop` 事件，调用 cancel 函数终止当前流式请求。

同时，系统 SHALL 将 chat 页面当前流式错误作为 chatStore 的瞬时状态维护，并在聊天主区域可见渲染；该错误状态 SHALL 不写入 `Session` 的持久模型，且 SHALL 通过统一 reset action 在切换会话、开始新一轮发送或完成清理时复位。

#### Scenario: 用户点击 stop 按钮

- **WHEN** `chatStatus` 为 `streaming` 或 `submitted`
- **AND** 用户点击 `UChatPromptSubmit` 的 stop 按钮
- **THEN** 前端调用 cancel 函数，通过 `ChatStreamChannels.streamCancel` IPC 通道通知主进程取消
- **AND** `chatStatus` 最终回到 `ready`（由 `onDone` 或 `onError` 回调处理）

#### Scenario: 无活跃流时 stop 无效

- **WHEN** `chatStatus` 为 `ready` 或 `error`
- **THEN** stop 事件不触发 cancel 调用

## ADDED Requirements

### Requirement: Chat 页面 SHALL 可见渲染流式错误

系统 SHALL 在 chat 页面消息流区域内联展示当前流式错误信息。当流式回调触发 error 时，chatStore SHALL 记录错误详情并让 UI 在当前消息流结束位置显示该错误；当用户切换会话、重新开始发送、或流式流程正常结束时，错误状态 SHALL 被统一清理。

chat 页面错误状态 SHALL 满足：

- 错误详情由 chatStore 持有，不由 sessionStore 持有
- 错误详情至少包含错误消息；UI SHALL 以 `message` 为主文案，并将 `code` 作为次级信息展示
- 错误状态只作用于当前 chat 上下文，不持久化到 session meta 或 session 列表
- 错误展示 SHALL 与消息列表同屏可见，避免隐藏在仅日志输出中
- 错误展示 SHALL 使用现有 UI 体系的轻量 inline error alert 风格，不使用 toast、全局通知或页面顶部 banner
- 错误展示 SHALL 渲染在 assistant 回复本应出现或继续出现的位置，避免与侧边栏、输入框和全局页面状态混淆
- 错误展示不要求提供手动关闭入口；清理 SHALL 由下一次发送、切换会话或统一 reset action 完成

#### Scenario: 流式回调触发 error

- **WHEN** `chat:stream:message` 的 `onError` 回调收到 `{ code, message }`
- **THEN** chatStore 记录当前流式错误详情
- **AND** chat 页面在当前消息流结束位置以内联错误块显示该错误
- **AND** 错误块主要展示 `message`，并以次级信息展示 `code`
- **AND** 当前会话状态结束为非运行态

#### Scenario: 切换会话清理错误状态

- **WHEN** 用户在侧边栏选择另一个 session
- **THEN** chatStore 通过统一 reset action 清空当前流式错误并恢复默认 chat 状态
- **AND** 新选中的 session 不继承上一个 session 的错误展示

#### Scenario: 新一轮发送清理上一次错误

- **WHEN** 用户在当前 chat 中再次发送消息
- **THEN** chatStore 在进入新一轮流式前清理上一次错误状态
- **AND** 页面只展示当前这轮流式结果
