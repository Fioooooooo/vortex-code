## ADDED Requirements

### Requirement: Runs tab displays pipeline run records

The system SHALL display a list of pipeline run records for the current project in the left sidebar's Runs tab, with the most recent records at the top, and running records visually distinguished.

#### Scenario: View run list

- **WHEN** the user switches to the Runs tab
- **THEN** a list of run records is displayed
- **AND** each record shows the run title, template name, compact stage progress indicator, and last updated time
- **AND** running records are positioned at the top with a pulsing indicator

### Requirement: New Run creation flow

The system SHALL provide a "New Run" button in the Runs tab that opens a selection panel for choosing a template and entering a trigger requirement description, after which a new run is created and the first stage begins execution.

#### Scenario: Create a new run

- **WHEN** the user clicks the "New Run" button
- **THEN** a modal or panel opens for template selection
- **AND** the user selects a template and enters a natural language trigger description
- **AND** upon confirmation, a new run record is created and prepended to the list
- **AND** the new run's first stage enters "running" status

### Requirement: Run selection updates central detail view

The system SHALL update the central main area to show the selected run's detail view when a run record is clicked in the left panel.

#### Scenario: Select a run

- **WHEN** the user clicks a run record in the left panel
- **THEN** the central main area switches to the Run Detail view for that run
- **AND** the selected run is visually highlighted in the list

### Requirement: Run detail view shows stage progress bar

The system SHALL display a horizontal stage flow progress bar at the top of the run detail view, showing all stages with their status icons, connecting lines, and gate markers.

#### Scenario: View stage progress

- **WHEN** the user views a run's detail
- **THEN** a horizontal stage flow is displayed at the top
- **AND** each stage node shows the stage name and status icon
- **AND** connecting lines reflect the transition state between stages
- **AND** gate markers appear between stages that have gate conditions

### Requirement: Stage nodes are interactive

The system SHALL allow clicking a stage node to switch the lower detail area to that stage's content, with the currently executing stage selected by default.

#### Scenario: Click a stage node

- **WHEN** the user clicks a stage node in the progress bar
- **THEN** the lower detail area updates to show that stage's content
- **AND** the clicked node receives active visual state

### Requirement: Gate approval actions are accessible

The system SHALL display Approve/Reject action controls below a stage node when that stage has a manual approval gate and is in "waiting approval" status.

#### Scenario: Approve a waiting stage

- **WHEN** a stage is in "waiting approval" status
- **THEN** an Approve button and a Reject button appear below the stage node
- **AND** clicking Approve transitions the stage to "passed" and resumes the pipeline
- **AND** clicking Reject transitions the stage to "failed"
