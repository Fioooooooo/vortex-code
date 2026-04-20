## MODIFIED Requirements

### Requirement: Workspace page has a five-region layout

The system SHALL render the Workspace experience by composing a shared application shell with Workspace-specific content, where the shared shell provides a top header and left activity bar, and the Workspace page provides the left sidebar, central main area, and right Diff panel. The shared application shell header SHALL have a fixed height of 35px.

#### Scenario: Full desktop layout

- **WHEN** the user is on the `/workspace` route
- **THEN** the shared application shell header and activity bar are visible
- **AND** the shared application shell header has height of 35px
- **AND** the Workspace sidebar and central main area are visible in their default sizes

#### Scenario: Diff panel is shown on demand

- **WHEN** the user opens a file diff in the Workspace
- **THEN** the right Diff panel is displayed alongside the central main area
