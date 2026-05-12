# chat-interface 规范

## Purpose

Chat 界面定义了消息流的渲染方式、流式事件组装边界、侧边栏展示行为，以及 Chat 主区域与相关组件的复用约束。

## Requirements

### Requirement: Chat 区域显示可滚动的消息流

系统 SHALL 在中央主区域渲染垂直滚动的消息序列，消息数据类型为 `UIMessage<MessageMeta>`，每条消息通过 `parts` 数组描述内容。

#### Scenario: 消息流渲染

- **WHEN** session 处于活跃状态
- **THEN** Chat 区域按时间顺序显示所有消息，可从上到下滚动
- **AND** 消息类型为 `UIMessage<MessageMeta>`，包含 `metadata.sessionId` 和 `metadata.createdAt`

### Requirement: ChatAgentSelect 在 agent 锁定时隐藏

系统 SHALL 在 `ChatContainer.vue` 的 `UChatPrompt` footer slot 中，当 session 已有消息（agent 锁定）时，完全隐藏 `ChatAgentSelect` 组件，不渲染禁用态。

#### Scenario: 新 session 或草稿态显示 Agent 选择器

- **WHEN** 用户处于草稿态（无活跃 session）或活跃 session 尚无消息
- **THEN** `ChatAgentSelect` 正常显示，用户可选择 agent

#### Scenario: session 有消息后隐藏 Agent 选择器

- **WHEN** 活跃 session 的消息数量大于 0（agent 已锁定）
- **THEN** `ChatAgentSelect` 不渲染（`v-if="!isAgentLocked"`）
- **AND** 不显示禁用态的选择器

### Requirement: UChatPromptSubmit 支持停止流式回复

系统 SHALL 在 `chatStatus` 为 `streaming` 或 `submitted` 时，响应 `UChatPromptSubmit` 的 `stop` 事件，调用 cancel 函数终止当前流式请求。

#### Scenario: 用户点击 stop 按钮

- **WHEN** `chatStatus` 为 `streaming` 或 `submitted`
- **AND** 用户点击 `UChatPromptSubmit` 的 stop 按钮
- **THEN** 前端调用 cancel 函数，通过 `ChatStreamChannels.streamCancel` IPC 通道通知主进程取消
- **AND** `chatStatus` 最终回到 `ready`（由 `onDone` 或 `onError` 回调处理）

#### Scenario: 无活跃流时 stop 无效

- **WHEN** `chatStatus` 为 `ready` 或 `error`
- **THEN** stop 事件不触发 cancel 调用

### Requirement: Chat 侧边栏仅显示 Sessions 标签

系统 SHALL 在 Chat 侧边栏直接渲染 SessionList，不提供标签切换器。

#### Scenario: 侧边栏默认显示 SessionList

- **WHEN** 用户打开 Chat 页面
- **THEN** 侧边栏直接显示 SessionList，无标签切换器

### Requirement: Chat 主区域与 Proposal SidePanel 共享 UIMessage 列表组件

系统 SHALL 将 `UIMessageList` 组件通过 `type: "chat" | "side"` prop 标识使用场景，并新增可选 `agentId?: string` prop 用于在 `type="chat"` 时解析 assistant 头像。`ChatContainer.vue` 与 `ProposalApplySidePanel.vue` 的消息列表部分 SHALL 都通过该组件渲染，不再各自编写 `v-for message / v-for part` 的渲染逻辑。

共享组件的必要 props：

- `messages: UIMessage<MessageMeta>[]`
- `status: ChatStatus`
- `type: "chat" | "side"`
- `agentId?: string`（可选，仅在 `type="chat"` 时用于解析 assistant 头像）

组件内部 SHALL 使用 `ai` 包的 `isReasoningUIPart` / `isTextUIPart` / `isToolUIPart` 派发到对应子组件（`UChatMessages` / `UChatTool` / `ChatComark` 等），保持与当前 chat 主区域一致的渲染通路。

当 `type="chat"` 且 `agentId` 提供时，assistant 头像 SHALL 显示该 agent 对应的 ACP agent icon（来自 `useAcpAgentsStore.icons`）。若 `agentId` 未提供或对应 icon 不存在，则不显示头像（保持与 `type="side"` 一致的行为）。

渲染端 SHALL 使用 `UIMessage.id` 作为 `v-for :key`；该 id 在流式活跃期间为渲染进程生成的临时 id，在 resume 后为磁盘加载的 id，系统 SHALL NOT 做跨进程 id 匹配。

在 `message.role === 'user'` 的 text part 渲染分支中，系统 SHALL 通过 `isSystemReminderPart(part)` 工具函数识别 system-reminder 内容并**跳过渲染**。识别规则：`part.type === "text"` 且 `part.text` 经过 trim 后以 `<system-reminder>` 开头、以 `</system-reminder>` 结尾。该工具函数位于 `frontend/src/utils/system-reminder.ts`，`UIMessageList.vue` 直接调用。类型 `system-reminder` 的 part 仅在磁盘与 `UIMessage.parts` 数据中保留，UI 不展示。

#### Scenario: Chat 主区域使用共享组件渲染消息列表并显示 agent 头像

- **WHEN** 用户打开 chat 页面
- **THEN** `ChatContainer.vue` 通过 `<UIMessageList :messages :status type="chat" :agentId />` 渲染 `activeSession.messages`
- **AND** assistant 消息的头像显示当前 session 对应 ACP agent 的 icon
- **AND** 渲染结果与当前 chat 消息表现一致（text / tool / reasoning 分派保持现状）

#### Scenario: Proposal SidePanel 使用共享组件保持现有行为

- **WHEN** 用户打开 proposal 详情页，SidePanel 展开
- **THEN** `ProposalApplySidePanel.vue` 通过 `<UIMessageList :messages :status type="side" />` 渲染 `messages`
- **AND** SidePanel 外壳（stage 进度条、关闭按钮、空态、流式指示器）保持现状
- **AND** 消息列表渲染通路与 chat 一致，能显示 text part 与 dynamic-tool part
- **AND** assistant 不显示头像（与变更前行为一致）

#### Scenario: user 消息中的 system-reminder part 不在 UI 展示

- **WHEN** user 消息的 `parts` 首位为 system-reminder text part（`part.text` 经 trim 后以 `<system-reminder>` 开头并以 `</system-reminder>` 结尾）
- **THEN** `UIMessageList.vue` 的 `message.role === 'user'` 分支跳过该 part 的渲染
- **AND** 同条 user 消息的其余 text part 正常渲染
- **AND** 数据层 `message.parts` 不做修改

#### Scenario: user 消息仅含 system-reminder 时不输出可见文本

- **WHEN** user 消息的 `parts` 全部为 system-reminder text part（理论上不会发生的退化场景）
- **THEN** 该消息气泡不渲染任何 text 内容
- **AND** 不抛错、不影响其他消息渲染

### Requirement: 渲染进程 UIMessage 组装逻辑抽为共享 composable

系统 SHALL 在 `frontend/src/composables/useUIMessageAssembler.ts` 提供共享 composable，封装流式 chunk 到 `UIMessage<MessageMeta>[]` 的组装逻辑。`chat` store 与 `proposal-run` store SHALL 使用同一实现，`frontend/src/stores/chat.ts#streamSessionMessage` 与 `frontend/src/stores/proposal-run.ts#applyChunk` 中的重复组装代码 SHALL 被移除。

composable 对外暴露至少以下能力：

- 接受或创建一个 `Ref<UIMessage<MessageMeta>[]>` 作为消息容器
- `applyChunk(chunk: MessageChunkData)` 按 chunk kind 分派：
  - `text_delta` / `tool_call_start` / `tool_call_update`：按现有 `MessageAssembler` 组装规则更新容器中的 assistant message
  - `user_message`：将 chunk 自带的 `UIMessage` 原样 push 到容器，并清空 `activeAssistantId`
  - 其他 kind（如 `usage_update`、`session_info_update`、`status`）：不影响消息容器，由调用方按需处理
- `resetActive()`：清空 `activeAssistantId` / `activeTextPartIdx`（在 `done`、`error`、切换 stage 时调用）

#### Scenario: chat store 使用共享 composable

- **WHEN** `stores/chat.ts#streamSessionMessage` 启动
- **THEN** 使用 `useUIMessageAssembler` 处理 chunk
- **AND** store 内部不再包含 `ensureAssistantMessage` / chunk 分派实现

#### Scenario: proposal-run store 使用共享 composable

- **WHEN** `stores/proposal-run.ts#streamCurrentStage` 或 `startArchive` 启动
- **THEN** 使用 `useUIMessageAssembler` 处理 chunk
- **AND** store 内部不再包含 `ensureAssistantMessage` / chunk 分派实现
