## REMOVED Requirements

### Requirement: User messages are visually distinct

**Reason**: 旧消息类型 `UserMessage` 已废弃，消息数据结构迁移到 `UIMessage<MessageMeta>`，用户消息通过 `role: "user"` 标识，渲染逻辑由 `UChatMessages` 组件处理。
**Migration**: 使用 `UIMessage.role === "user"` 判断用户消息，内容通过 `TextUIPart` 表达。

### Requirement: Thinking process messages are collapsible

**Reason**: 旧消息类型 `ThinkingMessage` 已废弃，thinking 内容通过 `ReasoningUIPart` 表达，折叠行为由 `UChatReasoning` 组件处理。
**Migration**: 使用 `isReasoningUIPart(part)` 识别 thinking 内容，渲染使用 `UChatReasoning`。

### Requirement: File operation messages show compact cards

**Reason**: 旧消息类型 `FileOpMessage` 已废弃，文件操作通过 `ToolUIPart` 表达。
**Migration**: 文件操作作为 tool call 结果，使用 `isToolUIPart(part)` 识别，渲染使用 `UChatTool`。

### Requirement: Command execution messages show command and result

**Reason**: 旧消息类型 `CommandMessage` 已废弃，命令执行通过 `ToolUIPart` 表达。
**Migration**: 命令执行作为 tool call 结果，使用 `isToolUIPart(part)` 识别。

### Requirement: Confirmation request messages require user action

**Reason**: 旧消息类型 `ConfirmMessage` 已废弃，确认请求通过 `ToolUIPart` 的 `state: "call"` 状态表达。
**Migration**: 待确认的 tool call 通过 `part.state === "call"` 识别。

### Requirement: Text replies support markdown rendering

**Reason**: 旧消息类型 `TextMessage` 已废弃，文本内容通过 `TextUIPart` 表达。
**Migration**: 使用 `isTextUIPart(part)` 识别文本内容，markdown 渲染逻辑不变。

## MODIFIED Requirements

### Requirement: Chat area displays a scrollable message stream

The system SHALL render a vertically scrolling sequence of messages in the central main area，消息数据类型为 `UIMessage<MessageMeta>`，每条消息通过 `parts` 数组描述内容。

#### Scenario: Message stream renders

- **WHEN** a session is active
- **THEN** the chat area displays all messages in chronological order, scrollable from top to bottom
- **AND** messages are of type `UIMessage<MessageMeta>` with `metadata.sessionId` and `metadata.createdAt`
