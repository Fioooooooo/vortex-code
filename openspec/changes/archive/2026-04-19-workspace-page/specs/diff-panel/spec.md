## ADDED Requirements

### Requirement: Diff panel is collapsed by default

The system SHALL render the right Diff panel hidden by default.

#### Scenario: Initial workspace load

- **WHEN** the Workspace page loads
- **THEN** the Diff panel is collapsed and only a grab handle is visible on the right edge

### Requirement: Diff panel expands via multiple triggers

The system SHALL expand the Diff panel when the user clicks a file operation card in the chat, clicks a changed file in the file tree, or manually drags/click the right-edge handle.

#### Scenario: Expand from file operation card

- **WHEN** the user clicks a file operation message card in the chat area
- **THEN** the Diff panel expands showing that file's diff

#### Scenario: Expand from file tree

- **WHEN** the user clicks a file with changes in the file tree
- **THEN** the Diff panel expands showing that file's diff

#### Scenario: Manual expand via handle

- **WHEN** the user clicks or drags the right-edge handle
- **THEN** the Diff panel expands

### Requirement: Diff panel shows file path and close button

The system SHALL display the current file path in the Diff panel header with a close button to collapse the panel.

#### Scenario: Diff panel header

- **WHEN** the Diff panel is open
- **THEN** the header shows the file path and a close button

#### Scenario: Closing the panel

- **WHEN** the user clicks the close button
- **THEN** the Diff panel collapses

### Requirement: Diff panel supports side-by-side and inline modes

The system SHALL provide a toggle to switch between side-by-side and inline diff rendering modes.

#### Scenario: Side-by-side mode

- **WHEN** the user selects side-by-side mode
- **THEN** the diff is rendered with original and modified versions side by side

#### Scenario: Inline mode

- **WHEN** the user selects inline mode
- **THEN** the diff is rendered as a single column with additions and deletions inline

### Requirement: Diff panel supports multiple changed files

The system SHALL provide a file list dropdown or tab bar at the top of the Diff panel when multiple files have changes in the current session, allowing the user to switch between them.

#### Scenario: Multiple file changes

- **WHEN** the current session has changes in multiple files
- **THEN** the Diff panel header includes a file selector to switch between diffs
