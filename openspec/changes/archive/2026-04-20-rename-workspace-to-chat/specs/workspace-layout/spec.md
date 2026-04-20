## MODIFIED Requirements

### Requirement: Workspace page has a five-region layout

The system SHALL render the Chat experience by composing a shared application shell with Chat-specific content, where the shared shell provides a top header and left activity bar, and the Chat page provides the left sidebar, central main area, and right Diff panel. The shared application shell header SHALL have a fixed height of 35px.

#### Scenario: Full desktop layout

- **WHEN** the user is on the `/chat` route
- **THEN** the shared application shell header and activity bar are visible
- **AND** the shared application shell header has height of 35px
- **AND** the Chat sidebar and central main area are visible in their default sizes

#### Scenario: Diff panel is shown on demand

- **WHEN** the user opens a file diff in the Chat
- **THEN** the right Diff panel is displayed alongside the central main area

### Requirement: Layout regions are responsive

The system SHALL keep the Chat layout optimized for desktop usage, ensuring the central main area always occupies the maximum available space when optional panels are closed.

#### Scenario: Central area expands when diff panel closes

- **WHEN** the right Diff panel is closed
- **THEN** the central main area expands to fill the freed space

#### Scenario: Sidebar remains visible in chat

- **WHEN** the user is on the `/chat` route
- **THEN** the left sidebar remains visible as part of the desktop Chat layout
