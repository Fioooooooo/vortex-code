## MODIFIED Requirements

### Requirement: Workspace page has a five-region layout

The system SHALL render the Workspace experience by composing a shared application shell with Workspace-specific content, where the shared shell provides a top header and left activity bar, and the Workspace page provides the left sidebar, central main area, and right Diff panel.

#### Scenario: Full desktop layout

- **WHEN** the user is on the `/workspace` route
- **THEN** the shared application shell header and activity bar are visible
- **AND** the Workspace sidebar and central main area are visible in their default sizes

#### Scenario: Diff panel is shown on demand

- **WHEN** the user opens a file diff in the Workspace
- **THEN** the right Diff panel is displayed alongside the central main area

### Requirement: Layout regions are responsive

The system SHALL keep the Workspace layout optimized for desktop usage, ensuring the central main area always occupies the maximum available space when optional panels are closed.

#### Scenario: Central area expands when diff panel closes

- **WHEN** the right Diff panel is closed
- **THEN** the central main area expands to fill the freed space

#### Scenario: Sidebar remains visible in workspace

- **WHEN** the user is on the `/workspace` route
- **THEN** the left sidebar remains visible as part of the desktop Workspace layout
