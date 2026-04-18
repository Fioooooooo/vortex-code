### Requirement: Project creation modal collects project information

The system SHALL display a modal that allows the user to input project name and select a storage path.

#### Scenario: Modal opens with form fields

- **WHEN** user clicks "Create Project" button
- **THEN** a modal dialog opens with input fields for project name and storage path
- **AND** a selection for project template type (empty project or git clone)

### Requirement: Project name is required

The system SHALL require a non-empty project name before allowing project creation.

#### Scenario: User attempts to create without project name

- **WHEN** user clicks the create button without entering a project name
- **THEN** the form shows a validation error indicating the project name is required
- **AND** the project is not created

### Requirement: Storage path defaults to a sensible location

The system SHALL default the storage path to the user's projects directory or home directory.

#### Scenario: Default path is populated

- **WHEN** the project creation modal opens
- **THEN** the storage path field is pre-filled with a default directory path

### Requirement: Template selection supports empty project and git clone

The system SHALL allow the user to choose between creating an empty project or cloning from a git repository.

#### Scenario: Empty project is selected

- **WHEN** user selects "Empty Project" template
- **THEN** no additional git URL input is shown

#### Scenario: Git clone is selected

- **WHEN** user selects "Clone from Git" template
- **THEN** an additional input field for the git repository URL is displayed
- **AND** the git URL is required for creation

### Requirement: Project creation enters Workspace

The system SHALL enter the Workspace with the newly created project upon successful creation.

#### Scenario: Project is successfully created

- **WHEN** user fills in valid project information and clicks create
- **THEN** the modal closes
- **AND** the system enters the Workspace with the new project loaded
- **AND** the project is added to the recent projects list
