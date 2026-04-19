## ADDED Requirements

### Requirement: Tool cards expand to reveal configuration panel

Clicking a tool card (that is not coming soon) SHALL expand the card to reveal a configuration panel below the card front. The expansion SHALL use an accordion-style animation without navigating to a new page.

#### Scenario: Card expands on click

- **WHEN** the user clicks an available tool card
- **THEN** the card expands downward
- **AND** a configuration panel is revealed below the card front
- **AND** clicking the same card again collapses it

### Requirement: Configuration panel has three sections

The expanded configuration panel SHALL contain up to three sections in order: (1) Account Connection, (2) Tool Parameters (visible only when connected), (3) Project Configuration (visible only when enabled in a project).

#### Scenario: Unconnected tool shows only connection section

- **WHEN** the user expands an unconnected tool card
- **THEN** only the "Account Connection" section is visible

#### Scenario: Connected tool shows connection and parameters

- **WHEN** the user expands a connected tool card
- **THEN** both "Account Connection" and "Tool Parameters" sections are visible

#### Scenario: Enabled tool shows all three sections

- **WHEN** the user expands a tool that is connected and enabled in the current project
- **THEN** all three sections are visible: Connection, Parameters, and Project Configuration

### Requirement: Tool Parameters section contains tool-specific settings

The Tool Parameters section SHALL display configuration fields specific to the tool type. Examples include: default organization for Codeup, pipeline template for Flow, target region for Alibaba Cloud, webhook URL and event triggers for DingTalk.

#### Scenario: Codeup parameters render correctly

- **WHEN** the user expands a connected Codeup card
- **THEN** the Tool Parameters section shows an organization selector and branch naming preference

#### Scenario: DingTalk parameters render correctly

- **WHEN** the user expands a connected DingTalk card
- **THEN** the Tool Parameters section shows a webhook URL input and event trigger checkboxes
