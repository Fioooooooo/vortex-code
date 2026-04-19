## ADDED Requirements

### Requirement: Pipeline page renders inside the shared app shell

The system SHALL render the Pipeline page within the shared application shell, displaying the Pipeline-specific content in the shell's main region, with the Activity Bar highlighting the Pipeline icon.

#### Scenario: User navigates to Pipeline

- **WHEN** the user navigates to `/pipeline`
- **THEN** the shared app shell header and activity bar are visible
- **AND** the Activity Bar's Pipeline icon is highlighted with primary color
- **AND** the main content area shows the Pipeline page layout

### Requirement: Pipeline page has a two-region layout

The system SHALL render the Pipeline page with a left sidebar panel and a central main area, where the left panel contains tab-switchable content and the central area displays the selected Run detail, Template editor, or empty state.

#### Scenario: Default Pipeline layout

- **WHEN** the user is on the `/pipeline` route
- **THEN** the left sidebar panel is visible at 260px width
- **AND** the central main area occupies the remaining horizontal space
- **AND** no right-side diff panel is present

#### Scenario: Responsive behavior on smaller viewports

- **WHEN** the viewport width is below the desktop breakpoint
- **THEN** the left sidebar panel may collapse or overlay
- **AND** the central main area remains accessible
