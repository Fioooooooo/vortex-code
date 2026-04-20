## ADDED Requirements

### Requirement: WelcomeView is rendered inside the shared application shell

The system SHALL render the WelcomeView component inside the main content region of the shared application shell when no project is currently open.

#### Scenario: No project shows WelcomeView in layout

- **WHEN** the application starts with no active project
- **THEN** the shared application shell header and side navigation are visible
- **AND** the WelcomeView is rendered in the main content region, centered

#### Scenario: WelcomeView has consistent theming

- **WHEN** the WelcomeView is displayed inside the shared shell
- **THEN** the theme toggle in the header works and affects the WelcomeView appearance
- **AND** the WelcomeView uses the same background color as other pages

### Requirement: WelcomeView preserves all original functionality

The system SHALL preserve all Welcome page functionality within the WelcomeView component.

#### Scenario: Open Folder from WelcomeView

- **WHEN** user clicks "Open Folder" in WelcomeView
- **THEN** a directory selection dialog is invoked
- **AND** upon selection, the current project context is updated
- **AND** the main content region switches from WelcomeView to the project workspace

#### Scenario: Create Project from WelcomeView

- **WHEN** user clicks "Create Project" in WelcomeView
- **THEN** the project creation modal opens
- **AND** upon successful creation, the main content region switches to the project workspace

#### Scenario: Recent projects in WelcomeView

- **WHEN** user clicks a recent project in WelcomeView
- **THEN** the current project context is updated
- **AND** the main content region switches to the project workspace

## MODIFIED Requirements

### Requirement: Welcome page displays when no project is open

The system SHALL display the Welcome content when no project is currently open, and the Welcome content SHALL render inside the shared application shell.

#### Scenario: User opens app with no project

- **WHEN** the application starts with no active project
- **THEN** the Welcome content is displayed in the main content region
- **AND** the shared application shell header and side navigation are visible
