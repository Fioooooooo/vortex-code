## MODIFIED Requirements

### Requirement: Non-welcome pages share a route-level app shell

The system SHALL provide a route-level parent page for all non-welcome application pages, and that parent page SHALL render a shared application shell layout with dedicated header, side navigation, and main content regions.

#### Scenario: Shared shell wraps application pages

- **WHEN** the user navigates to `/workspace`, `/pipeline`, `/integration`, or `/setting`
- **THEN** the route is rendered inside the shared application shell
- **AND** the page-specific content is rendered in the shell's main region

### Requirement: Application pages require a current project

The system SHALL prevent direct access to project-scoped application routes when no current project is selected.

#### Scenario: Project-scoped route without project

- **WHEN** the user navigates directly to `/workspace`, `/pipeline`, `/integration`, or `/setting` without a current project
- **THEN** the application redirects to `/welcome`

## ADDED Requirements

### Requirement: Integration page is a project-scoped application route

The system SHALL treat `/integration` as a project-scoped application route protected by the same access constraints as other application pages.

#### Scenario: Integration route requires project

- **WHEN** the user navigates directly to `/integration` without a current project
- **THEN** the application redirects to `/welcome`
