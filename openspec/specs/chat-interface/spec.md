# chat-interface Specification

## Purpose

TBD - created by archiving change workspace-page. Update Purpose after archive.

## Requirements

### Requirement: Chat area displays a scrollable message stream

The system SHALL render a vertically scrolling sequence of messages in the central main area，消息数据类型为 `UIMessage<MessageMeta>`，每条消息通过 `parts` 数组描述内容。

#### Scenario: Message stream renders

- **WHEN** a session is active
- **THEN** the chat area displays all messages in chronological order, scrollable from top to bottom
- **AND** messages are of type `UIMessage<MessageMeta>` with `metadata.sessionId` and `metadata.createdAt`

### Requirement: Chat sidebar supports tab switching between Sessions and Files

The system SHALL render the Chat sidebar with a tab switcher at the top, allowing the user to switch between "Sessions" and "Files" views. The tab switcher SHALL use the nuxt/ui `UTabs` component with `variant="link"`.

#### Scenario: Default tab

- **WHEN** the user opens the Chat sidebar
- **THEN** the "Sessions" tab is active by default
- **AND** the SessionList is displayed

#### Scenario: Switch to Files tab

- **WHEN** the user clicks the "Files" tab
- **THEN** the FileTree is displayed
- **AND** the "Files" tab shows the active visual state

#### Scenario: Tab switcher visual style

- **WHEN** the sidebar tab switcher is rendered
- **THEN** it uses `UTabs` with `variant="link"`
- **AND** the active tab has a bottom border indicator in primary color
- **AND** the active tab has primary-colored text
- **AND** inactive tabs show muted text with hover highlight
