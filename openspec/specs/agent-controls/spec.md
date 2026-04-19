# agent-controls Specification

## Purpose

TBD - created by archiving change workspace-page. Update Purpose after archive.

## Requirements

### Requirement: Input bar is fixed at the bottom of the chat area

The system SHALL render a fixed input bar at the bottom of the central chat area that does not scroll with the message stream.

#### Scenario: Scrolling messages

- **WHEN** the user scrolls through the message history
- **THEN** the input bar remains fixed at the bottom of the chat area

### Requirement: Input bar supports multi-line text entry

The system SHALL provide a multi-line text input that supports Shift+Enter for line breaks and Enter for sending the message.

#### Scenario: Shift+Enter inserts newline

- **WHEN** the user presses Shift+Enter in the input field
- **THEN** a newline is inserted in the text

#### Scenario: Enter sends message

- **WHEN** the user presses Enter without Shift
- **THEN** the message is sent and the input field clears

### Requirement: Input bar has a send button

The system SHALL provide a send button to the right of the input field that submits the current message.

#### Scenario: Clicking send button

- **WHEN** the user clicks the send button
- **THEN** the current message is sent

### Requirement: Input bar supports attachments

The system SHALL provide an attachment entry point near the input field allowing users to attach images or files as context.

#### Scenario: Attaching a file

- **WHEN** the user selects a file via the attachment entry
- **THEN** the file appears as an attachment preview in the input area
- **AND** the file is included as context when the message is sent

### Requirement: Function bar shows agent selector and auto/manual toggle

The system SHALL render a function bar above the input bar containing the current agent name (clickable to switch agents) on the left and an Auto/Manual mode toggle on the right.

#### Scenario: Agent name display

- **WHEN** the function bar is visible
- **THEN** the left side shows the current agent name (e.g., "Claude Code")

#### Scenario: Switching agents

- **WHEN** the user clicks the agent name
- **THEN** an agent selection dropdown or modal appears

#### Scenario: Auto/Manual toggle

- **WHEN** the user toggles between Auto and Manual mode
- **THEN** the mode changes immediately and affects whether confirmation request cards appear in future agent actions
