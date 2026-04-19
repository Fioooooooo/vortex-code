# integration-project-enablement Specification

## Purpose

TBD - created by archiving change integrations-page. Update Purpose after archive.

## Requirements

### Requirement: Tools can be enabled per project

When a project is open and a tool is connected, the system SHALL allow the user to toggle the tool's enabled state for that specific project via a switch on the tool card.

#### Scenario: Enable a tool in the current project

- **WHEN** a tool is connected, a project is open, and the user toggles the enable switch ON
- **THEN** the tool is marked as enabled for the current project
- **AND** the project-level configuration panel becomes visible when the card is expanded

#### Scenario: Disable a tool in the current project

- **WHEN** the user toggles the enable switch OFF for an enabled tool
- **THEN** the tool is marked as disabled for the current project
- **AND** the project-level configuration panel is hidden

### Requirement: Project-level configuration overrides global settings

When a tool is enabled in a project, the system SHALL display a project-specific configuration section within the expanded card. This section SHALL allow overriding global tool parameters for the current project only. The section title SHALL include the current project name.

#### Scenario: Project-level config visible for enabled tool

- **WHEN** a tool is enabled in the current project and the card is expanded
- **THEN** a configuration section titled "Configuration for {project-name}" is displayed
- **AND** it contains project-specific override fields

#### Scenario: Project config saves independently

- **WHEN** the user changes a project-level configuration value and saves
- **THEN** the change applies only to the current project
- **AND** other projects using the same tool retain their own configurations
