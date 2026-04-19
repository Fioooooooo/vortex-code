## ADDED Requirements

### Requirement: Stage nodes display status with correct visual state

The system SHALL render each stage in the progress bar as a node containing the stage name and a status icon, where the visual appearance reflects the stage's current status.

#### Scenario: Completed stage

- **WHEN** a stage has status "passed"
- **THEN** the node displays a green checkmark icon
- **AND** the node border and icon use the success color

#### Scenario: Running stage

- **WHEN** a stage has status "running"
- **THEN** the node displays a blue spinning icon
- **AND** the node border and icon use the primary color

#### Scenario: Failed stage

- **WHEN** a stage has status "failed"
- **THEN** the node displays a red cross icon
- **AND** the node border and icon use the error color

#### Scenario: Skipped stage

- **WHEN** a stage has status "skipped"
- **THEN** the node displays a gray horizontal line icon
- **AND** the node uses the neutral muted color

#### Scenario: Waiting approval stage

- **WHEN** a stage has status "waiting approval"
- **THEN** the node displays a yellow pause icon
- **AND** the node border and icon use the warning color

#### Scenario: Pending stage

- **WHEN** a stage has status "pending"
- **THEN** the node displays a gray hollow circle icon
- **AND** the node uses the neutral muted color

### Requirement: Connecting lines reflect transition state

The system SHALL render connecting lines between stage nodes that visually indicate whether the transition has been completed, is in progress, or has not been reached.

#### Scenario: Completed transition

- **WHEN** the source stage is passed and the target stage is not pending
- **THEN** the connecting line is rendered as a solid line in success color

#### Scenario: In-progress transition

- **WHEN** the source stage is running and transitioning to the next stage
- **THEN** the connecting line is rendered as a dashed line with primary color animation

#### Scenario: Unreached transition

- **WHEN** neither stage has been started
- **THEN** the connecting line is rendered as a dashed line in neutral muted color

### Requirement: Gate markers display between stages

The system SHALL render a diamond-shaped marker on the connecting line between two stages when a gate condition exists between them, with color indicating whether the gate is satisfied.

#### Scenario: Gate marker hover

- **WHEN** the user hovers over a gate marker
- **THEN** a tooltip displays the gate condition description

#### Scenario: Unsatisfied gate

- **WHEN** a gate condition is not met
- **THEN** the diamond marker is rendered in error color
- **AND** the tooltip shows which specific condition is not satisfied
