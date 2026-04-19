## ADDED Requirements

### Requirement: Workspace page has a five-region layout

The system SHALL render the Workspace page with five regions from left to right: Activity Bar (~48px), left sidebar (resizable, default ~260px), central main area (flex fill), right Diff panel (collapsible, ~400px when expanded), and a top header spanning the full width above all regions.

#### Scenario: Full desktop layout

- **WHEN** the viewport width is at least 1280px
- **THEN** all five regions are visible in their default sizes

#### Scenario: Diff panel collapses on medium screens

- **WHEN** the viewport width is between 1024px and 1279px
- **THEN** the right Diff panel is hidden by default and can be toggled as an overlay

#### Scenario: Sidebar collapses on small screens

- **WHEN** the viewport width is less than 1024px
- **THEN** the left sidebar is hidden and can be toggled via the Activity Bar or hamburger menu

### Requirement: Layout regions are responsive

The system SHALL adapt the visibility and arrangement of layout regions based on viewport breakpoints, ensuring the central main area always occupies the maximum available space.

#### Scenario: Central area expands when side panels collapse

- **WHEN** either the left sidebar or right Diff panel is collapsed
- **THEN** the central main area expands to fill the freed space

#### Scenario: Overlay panels do not shrink central area

- **WHEN** a collapsed panel is opened as an overlay
- **THEN** the central main area width remains unchanged
