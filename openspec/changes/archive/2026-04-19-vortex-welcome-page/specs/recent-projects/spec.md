## ADDED Requirements

### Requirement: Recent projects list is displayed

The system SHALL display a list of recently opened projects on the Welcome page.

#### Scenario: Recent projects are shown

- **WHEN** the Welcome page is displayed and recent projects exist
- **THEN** a "Recent Projects" section title is shown
- **AND** a vertical list of recent projects is displayed below it
- **AND** the list shows at most 10 recent projects

### Requirement: Each recent project item shows project details

The system SHALL display the project name, local path, and last opened time for each recent project.

#### Scenario: Project item displays all information

- **WHEN** the recent projects list is displayed
- **THEN** each list item shows the project name in bold
- **AND** the project's local path in smaller gray text
- **AND** the relative last opened time (e.g., "2 hours ago", "Yesterday")

### Requirement: Clicking a recent project opens it

The system SHALL open the selected project in the Workspace when a recent project item is clicked.

#### Scenario: User clicks a recent project

- **WHEN** user clicks on a recent project list item
- **THEN** the system enters the Workspace with that project loaded

### Requirement: Recent project items have hover highlighting

The system SHALL highlight a recent project item on hover.

#### Scenario: User hovers over a project item

- **WHEN** user hovers over a recent project list item
- **THEN** the item's background changes to a light highlight color

### Requirement: Recent project items can be removed from history

The system SHALL allow the user to remove a project from the recent projects history without deleting the actual files.

#### Scenario: Remove button appears on hover

- **WHEN** user hovers over a recent project list item
- **THEN** a remove button (x icon) appears on the right side of the item

#### Scenario: Project is removed from history

- **WHEN** user clicks the remove button
- **THEN** the project is removed from the recent projects list
- **AND** the actual project files are not affected

### Requirement: Recent projects list supports internal scrolling

The system SHALL keep the brand identity and action buttons visible while allowing the recent projects list to scroll internally.

#### Scenario: Many recent projects

- **WHEN** the recent projects list contains more items than can fit in the viewport
- **THEN** the list area scrolls internally
- **AND** the brand identity and action buttons remain fixed and visible
