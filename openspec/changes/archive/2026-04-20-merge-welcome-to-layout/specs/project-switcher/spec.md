## MODIFIED Requirements

### Requirement: Project switcher displays current project and agent

The system SHALL display the current project name from the unified project context and the bound agent type label in the top-left of the shared application shell header, with a dropdown arrow indicating expandability.

#### Scenario: Project switcher closed state

- **WHEN** the user is on a non-welcome application page
- **THEN** the header shows the current project name, agent type tag, and a dropdown chevron

### Requirement: Project switcher dropdown supports navigation

The system SHALL expand a dropdown on click containing a list of projects, and options to create a new project or enter project settings.

#### Scenario: Switching projects

- **WHEN** the user clicks the project switcher and selects a different project
- **THEN** the unified project context is updated to the selected project
- **AND** the application remains within the shared application shell
- **AND** the main content region updates to the selected project's workspace

#### Scenario: Creating a new project from switcher

- **WHEN** the user clicks the "New Project" option in the dropdown
- **THEN** the current project context is cleared
- **AND** the main content region switches to WelcomeView
- **AND** no route navigation occurs

### Requirement: Header shows system controls

The system SHALL display theme toggle, token usage indicator, and agent status indicator in the top-right of the shared application shell header.

#### Scenario: Token usage hover

- **WHEN** the user hovers over the token usage indicator
- **THEN** a tooltip or popover displays the estimated cost for the current session

#### Scenario: Agent status indication

- **WHEN** the agent state changes (idle, thinking, executing, awaiting confirmation)
- **THEN** the status indicator updates to reflect the current state with an appropriate dot or animation
