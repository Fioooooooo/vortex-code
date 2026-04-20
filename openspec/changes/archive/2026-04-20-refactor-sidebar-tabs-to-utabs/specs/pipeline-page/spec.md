## Purpose

Define the Pipeline page sidebar tab switching behavior using nuxt/ui UTabs.

## ADDED Requirements

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
