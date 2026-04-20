# chat-interface Specification

## Purpose

TBD - created by archiving change workspace-page. Update Purpose after archive.

## Requirements

### Requirement: Chat area displays a scrollable message stream

The system SHALL render a vertically scrolling sequence of messages in the central main area, with each message displayed as a distinct visual card.

#### Scenario: Message stream renders

- **WHEN** a session is active
- **THEN** the chat area displays all messages in chronological order, scrollable from top to bottom

### Requirement: User messages are visually distinct

The system SHALL render user messages with a visual style that clearly distinguishes them from agent messages.

#### Scenario: User message display

- **WHEN** a user message is part of the session
- **THEN** it is rendered with a distinct background or alignment compared to agent messages

### Requirement: Thinking process messages are collapsible

The system SHALL render agent thinking processes as collapsed by default, showing a one-line summary (e.g., "Analyzing project structure..."), expandable to reveal the full content on click.

#### Scenario: Thinking block collapsed

- **WHEN** a thinking message appears
- **THEN** only the summary line is visible

#### Scenario: Thinking block expanded

- **WHEN** the user clicks the thinking summary
- **THEN** the full thinking content expands below the summary

### Requirement: File operation messages show compact cards

The system SHALL render file operations (create, edit, delete) as compact cards containing an operation type icon, file path, and change summary (e.g., "+32 -5 lines").

#### Scenario: File operation card displayed

- **WHEN** an agent performs a file operation
- **THEN** a compact card appears in the chat with the operation icon, path, and line change summary

#### Scenario: File operation card opens diff

- **WHEN** the user clicks a file operation card
- **THEN** the right Diff panel opens showing the full diff for that file

### Requirement: Command execution messages show command and result

The system SHALL render shell command executions with the command text and a result summary, expandable for full output. Success SHALL be indicated in green, failure in red.

#### Scenario: Successful command

- **WHEN** an agent runs a command that succeeds
- **THEN** the command card shows the command text and a green success indicator with output summary

#### Scenario: Failed command

- **WHEN** an agent runs a command that fails
- **THEN** the command card shows the command text and a red failure indicator with error summary

### Requirement: Confirmation request messages require user action

The system SHALL render confirmation requests as distinct cards with a description of the requested action and "Allow" and "Deny" buttons. These cards SHALL NOT appear if the session is in auto mode.

#### Scenario: Manual mode confirmation

- **WHEN** the agent requests confirmation in manual mode
- **THEN** a confirmation card appears with action description and Allow/Deny buttons
- **AND** the agent waits for user input before proceeding

#### Scenario: Auto mode skips confirmation

- **WHEN** the session is in auto mode and the agent requests confirmation
- **THEN** no confirmation card appears and the agent proceeds automatically

### Requirement: Text replies support markdown rendering

The system SHALL render agent text replies with full markdown support including headers, lists, code blocks, and inline formatting.

#### Scenario: Markdown reply

- **WHEN** the agent returns a text reply containing markdown
- **THEN** the reply is rendered with proper markdown formatting

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
