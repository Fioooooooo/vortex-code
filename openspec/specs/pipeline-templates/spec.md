## ADDED Requirements

### Requirement: Templates tab displays available templates

The system SHALL display all available pipeline templates in the left sidebar's Templates tab, grouped by source into "Built-in" and "Custom" sections.

#### Scenario: View template list

- **WHEN** the user switches to the Templates tab
- **THEN** templates are displayed in two groups: Built-in and Custom
- **AND** each template card shows the template name, stage count, and stage name summary
- **AND** built-in templates are visually distinguished from custom templates

### Requirement: Template card supports hover actions

The system SHALL display additional action buttons (duplicate, delete, set as default) on a template card when hovered, with built-in templates only supporting duplicate.

#### Scenario: Hover built-in template card

- **WHEN** the user hovers over a built-in template card
- **THEN** a duplicate action button appears
- **AND** delete and set-default actions are not available

#### Scenario: Hover custom template card

- **WHEN** the user hovers over a custom template card
- **THEN** duplicate, delete, and set-default action buttons appear

### Requirement: Template selection opens editor view

The system SHALL open the template editor view in the central main area when a template card is clicked.

#### Scenario: Click a template card

- **WHEN** the user clicks a template card
- **THEN** the central main area switches to the Template Editor view
- **AND** the editor is populated with the selected template's data

### Requirement: New template creation

The system SHALL provide a "New Template" button that opens a blank template editor in the central main area.

#### Scenario: Create new template

- **WHEN** the user clicks the "New Template" button
- **THEN** the central main area opens a blank Template Editor
- **AND** the editor contains a single default stage ready for configuration

### Requirement: Template editor supports stage configuration

The system SHALL allow editing template name and description, and provide a stage list where each stage can be reordered via drag-and-drop, configured with type, name, prompt template, agent, gate conditions, failure strategy, and MCP/skills.

#### Scenario: Expand stage configuration

- **WHEN** the user clicks the expand arrow on a stage row
- **THEN** the stage row expands to reveal detailed configuration fields
- **AND** the fields include Prompt template textarea, Agent selector, Gate conditions list, Failure strategy selector, and MCP/Skills checkboxes

#### Scenario: Reorder stages

- **WHEN** the user drags a stage row using the drag handle and drops it at a new position
- **THEN** the stage order is updated in the template

#### Scenario: Add a new stage

- **WHEN** the user clicks the "+ Add Stage" button
- **THEN** a new stage row is appended to the stage list
- **AND** the new stage has default values based on the selected stage type

### Requirement: Template editor supports save and cancel

The system SHALL provide Save and Cancel buttons at the bottom of the template editor, with saving a modified built-in template creating a new custom template copy.

#### Scenario: Save built-in template copy

- **WHEN** the user edits a built-in template and clicks Save
- **THEN** a new custom template is created with the modifications
- **AND** the original built-in template remains unchanged

#### Scenario: Save custom template

- **WHEN** the user edits a custom template and clicks Save
- **THEN** the existing custom template is updated in place
