## Purpose

Define the Chat sidebar tab switching behavior using nuxt/ui UTabs.

## MODIFIED Requirements

### Requirement: Chat sidebar supports tab switching between Sessions and Files

The system SHALL render the Chat sidebar with a tab switcher at the top, allowing the user to switch between "Sessions" and "Files" views. The tab switcher SHALL use the nuxt/ui `UTabs` component with `variant="link"`.

#### Scenario: Default tab

- **WHEN** the user opens the Chat sidebar
- **THEN** the "Sessions" tab is active by default
- **AND** the SessionList is displayed

#### Scenario: Switch to Files tab

- **WHEN** the user clicks the "Files" tab
- **THEN** the FileTree is displayed
- **AND** the "Files" tab shows the active visual state

#### Scenario: Tab switcher visual style

- **WHEN** the sidebar tab switcher is rendered
- **THEN** it uses `UTabs` with `variant="link"`
- **AND** the active tab has a bottom border indicator in primary color
- **AND** the active tab has primary-colored text
- **AND** inactive tabs show muted text with hover highlight
