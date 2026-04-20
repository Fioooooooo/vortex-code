## MODIFIED Requirements

### Requirement: Project creation enters Workspace

The system SHALL write the newly created project into the unified current project context and enter `/workspace` upon successful creation.

#### Scenario: Project is successfully created

- **WHEN** user fills in valid project information and clicks create
- **THEN** the modal closes
- **AND** the current project context is updated with the new project
- **AND** the system enters `/workspace`
- **AND** the project is added to the recent projects list
