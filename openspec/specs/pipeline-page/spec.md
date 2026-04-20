## Purpose

Define the Pipeline page layout and sidebar behavior.

## Requirements

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

### Requirement: Pipeline sidebar supports tab switching between Runs and Templates

The system SHALL render the Pipeline sidebar with a tab switcher at the top, allowing the user to switch between "Runs" and "Templates" views. The tab switcher SHALL use the nuxt/ui `UTabs` component with `variant="link"`.

#### Scenario: Default tab

- **WHEN** the user opens the Pipeline sidebar
- **THEN** the "Runs" tab is active by default
- **AND** the RunList is displayed

#### Scenario: Switch to Templates tab

- **WHEN** the user clicks the "Templates" tab
- **THEN** the TemplateList is displayed
- **AND** the "Templates" tab shows the active visual state

#### Scenario: Tab switcher visual style

- **WHEN** the sidebar tab switcher is rendered
- **THEN** it uses `UTabs` with `variant="link"`
- **AND** the active tab has a bottom border indicator in primary color
- **AND** the active tab has primary-colored text
- **AND** inactive tabs show muted text with hover highlight
