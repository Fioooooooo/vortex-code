## MODIFIED Requirements

### Requirement: Chat 主区域与 Proposal SidePanel 共享 UIMessage 列表组件

系统 SHALL 将 `UIMessageList` 组件通过 `type: "chat" | "side"` prop 标识使用场景，并新增可选 `agentId?: string` prop 用于在 `type="chat"` 时解析 assistant 头像。`ChatContainer.vue` 与 `ProposalApplySidePanel.vue` 的消息列表部分 SHALL 都通过该组件渲染，不再各自编写 `v-for message / v-for part` 的渲染逻辑。

共享组件的必要 props：

- `messages: UIMessage<MessageMeta>[]`
- `status: ChatStatus`
- `type: "chat" | "side"`
- `agentId?: string`（可选，仅在 `type="chat"` 时用于解析 assistant 头像）

组件内部 SHALL 使用 `ai` 包的 `isReasoningUIPart` / `isTextUIPart` / `isToolUIPart` 派发到对应子组件：`UChatMessages` 承载消息容器、`UChatTool` 承载工具调用；assistant text part 与 reasoning part 中的 markdown 文本 SHALL 统一交由项目内统一的 markdown 渲染组件渲染（输入语义为 `content: string` 与 `isStreaming: boolean`），保持与当前 chat 主区域一致的渲染通路。该 markdown 渲染组件的具体实现细节由代码层决定，spec 不绑定具体组件名或第三方库。

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
