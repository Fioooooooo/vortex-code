## MODIFIED Requirements

### Requirement: Welcome page displays when no project is open

The system SHALL display the Welcome page as the standalone `/welcome` route when no project is currently open, and the Welcome page SHALL not render the shared application shell.

#### Scenario: User opens app with no project

- **WHEN** the application starts with no active project
- **THEN** the Welcome page is displayed occupying the full window
- **AND** the shared application shell header and side navigation are not visible

### Requirement: Welcome page shows brand identity

The system SHALL display the Vortex Code logo, product name, and tagline centered at the top of the Welcome page.

#### Scenario: Brand identity is visible

- **WHEN** the Welcome page is displayed
- **THEN** the logo, "Vortex Code" text, and tagline "Autonomous Coding Pipeline" are visible
- **AND** they are horizontally centered

### Requirement: Welcome page provides action buttons

The system SHALL display two side-by-side action buttons below the brand identity.

#### Scenario: Action buttons are visible

- **WHEN** the Welcome page is displayed
- **THEN** an "Open Folder" button and a "Create Project" button are shown side by side
- **AND** the "Open Folder" button is styled as a primary solid button
- **AND** the "Create Project" button is styled as a secondary outlined button
- **AND** each button has an icon on the left side

#### Scenario: Open Folder button is clicked

- **WHEN** user clicks the "Open Folder" button
- **THEN** a directory selection dialog is invoked
- **AND** upon selection, the current project context is updated
- **AND** the system enters `/workspace`

#### Scenario: Create Project button is clicked

- **WHEN** user clicks the "Create Project" button
- **THEN** a project creation modal is opened

### Requirement: Welcome page handles empty recent projects state

The system SHALL display an empty state message when no recent projects exist.

#### Scenario: No recent projects

- **WHEN** the Welcome page is displayed and no recent projects exist
- **THEN** a message "No recent projects. Open a folder or create a new project to get started." is shown
- **AND** the recent projects list is not displayed
