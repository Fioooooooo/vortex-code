# session-management Specification

## Purpose

TBD - created by archiving change workspace-page. Update Purpose after archive.

## Requirements

### Requirement: Sessions tab lists all project sessions

The system SHALL display a list of sessions in the left sidebar's "Sessions" tab, sorted by most recent first, with the newest session at the top.

#### Scenario: Session list populated

- **WHEN** the project has existing sessions
- **THEN** the list displays each session with title, timestamp, turn count, and status indicator

#### Scenario: Session title truncation

- **WHEN** a session title exceeds one line
- **THEN** the title is truncated with ellipsis

### Requirement: Session list shows session metadata

Each session item SHALL display a title derived from the first user message, a timestamp and turn count on a secondary line (e.g., "Today 14:32 · 12 turns"), and a status dot (green for running, gray for ended).

#### Scenario: Running session indicator

- **WHEN** a session's agent is still working
- **THEN** a green dot appears on the session item

#### Scenario: Ended session indicator

- **WHEN** a session has completed
- **THEN** a gray dot appears on the session item

### Requirement: New Session button creates a blank session

The system SHALL provide a "New Session" button at the top of the Sessions tab that creates a new blank session in the central main area when clicked.

#### Scenario: Creating a new session

- **WHEN** the user clicks the "New Session" button
- **THEN** a new blank session opens in the chat area and appears at the top of the session list

### Requirement: Session items support selection and actions

The system SHALL highlight the currently selected session, and show a more-actions menu (rename, delete, archive) on hover.

#### Scenario: Selecting a session

- **WHEN** the user clicks a session item
- **THEN** the session becomes selected with a highlighted background and its content loads in the chat area

#### Scenario: Session more-actions menu

- **WHEN** the user hovers over a session item and clicks the three-dot menu
- **THEN** a dropdown menu appears with options to rename, delete, or archive the session

### Requirement: Empty state guidance

The system SHALL display a引导 message "Start a new session to begin working with your agent." when the session list is empty.

#### Scenario: No sessions exist

- **WHEN** the project has no sessions
- **THEN** the list area shows the empty state message instead of a list
