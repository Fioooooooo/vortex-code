# integration-custom-mcp Specification

## Purpose

TBD - created by archiving change integrations-page. Update Purpose after archive.

## Requirements

### Requirement: Custom Integration entry is available at the bottom of the page

The system SHALL provide a "Custom Integration" entry point at the bottom of the integrations list, below all category sections. It SHALL be visually subdued (e.g., a collapsible section or an "Advanced" link) to avoid distracting from the main workflow.

#### Scenario: Custom Integration section is accessible

- **WHEN** the user scrolls to the bottom of the Integrations page
- **THEN** a "Custom Integration" or "Advanced" link is visible
- **AND** clicking it expands to reveal custom integration controls

### Requirement: Custom Integration allows MCP server configuration

The expanded Custom Integration section SHALL provide input fields for configuring a custom MCP server address and custom Skill parameters.

#### Scenario: User configures custom MCP server

- **WHEN** the user expands the Custom Integration section
- **THEN** input fields for MCP server URL and custom skill configuration are displayed
- **AND** a save button is available to store the configuration
