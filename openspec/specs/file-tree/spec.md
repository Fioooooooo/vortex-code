# file-tree Specification

## Purpose

TBD - created by archiving change workspace-page. Update Purpose after archive.

## Requirements

### Requirement: Files tab displays project directory tree

The system SHALL display a standard file tree in the left sidebar's "Files" tab, showing the current project's directory structure.

#### Scenario: File tree rendered

- **WHEN** the user switches to the Files tab
- **THEN** the project directory structure is displayed as an expandable tree

### Requirement: File tree shows session change markers

The system SHALL annotate file names in the tree with change markers for the current session: green for added files, yellow for modified files, and red strikethrough for deleted files. These markers represent agent-generated changes, distinct from git status markers.

#### Scenario: Added file marker

- **WHEN** the agent creates a new file in the current session
- **THEN** the file name in the tree displays a green indicator

#### Scenario: Modified file marker

- **WHEN** the agent modifies an existing file in the current session
- **THEN** the file name in the tree displays a yellow indicator

#### Scenario: Deleted file marker

- **WHEN** the agent deletes a file in the current session
- **THEN** the file name in the tree displays a red indicator with strikethrough

### Requirement: File click opens diff or read-only preview

The system SHALL open the clicked file in the right Diff panel: showing a diff comparison if the file has session changes, or a read-only preview if it has no changes.

#### Scenario: Clicking a changed file

- **WHEN** the user clicks a file that has session changes
- **THEN** the right Diff panel opens showing the file's diff comparison

#### Scenario: Clicking an unchanged file

- **WHEN** the user clicks a file with no session changes
- **THEN** the right Diff panel opens showing a read-only preview of the file content
