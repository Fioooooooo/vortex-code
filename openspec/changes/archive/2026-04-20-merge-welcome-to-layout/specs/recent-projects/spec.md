## MODIFIED Requirements

### Requirement: Clicking a recent project opens it

The system SHALL write the selected recent project into the unified current project context and enter `/workspace` when a recent project item is clicked.

#### Scenario: User clicks a recent project

- **WHEN** user clicks on a recent project list item
- **THEN** the current project context is updated with that project
- **AND** the system enters `/workspace`
