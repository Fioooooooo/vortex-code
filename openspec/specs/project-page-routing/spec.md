## ADDED Requirements

### Requirement: Project-scoped pages are top-level routes

The system SHALL route workspace, pipeline, and integration pages as top-level routes directly under `/`.

#### Scenario: Workspace route

- **WHEN** the user navigates to `/workspace`
- **THEN** the workspace page is rendered inside the shared application shell

#### Scenario: Pipeline route

- **WHEN** the user navigates to `/pipeline`
- **THEN** the pipeline page is rendered inside the shared application shell

#### Scenario: Integration route

- **WHEN** the user navigates to `/integration`
- **THEN** the integration page is rendered inside the shared application shell

### Requirement: Settings page uses /settings path

The system SHALL route the settings page at `/settings`.

#### Scenario: Settings route

- **WHEN** the user navigates to `/settings`
- **THEN** the settings page is rendered inside the shared application shell
- **AND** the page is accessible regardless of whether a project is open

## MODIFIED Requirements

### Requirement: Non-welcome pages share a route-level app shell

The system SHALL provide a route-level parent page for all application pages, and that parent page SHALL render a shared application shell layout with dedicated header, side navigation, and main content regions.

#### Scenario: Shared shell wraps application pages

- **WHEN** the user navigates to `/workspace`, `/pipeline`, `/integration`, or `/settings`
- **THEN** the route is rendered inside the shared application shell
- **AND** the page-specific content is rendered in the shell's main region

### Requirement: Root application entry redirects by current project context

The system SHALL resolve access to `/` by checking the current project context and keeping the user on `/` (which renders WelcomeView) when no project is selected, or redirecting to `/workspace` when a project is already selected.

#### Scenario: No project stays on root

- **WHEN** the user navigates to `/` and there is no current project
- **THEN** the application stays on `/` and renders the WelcomeView inside the shared shell

#### Scenario: Current project redirects to workspace

- **WHEN** the user navigates to `/` and a current project exists
- **THEN** the application redirects to `/workspace`

### Requirement: Application pages require a current project

The system SHALL prevent access to project-scoped application routes when no current project is selected by rendering WelcomeView instead.

#### Scenario: Project-scoped route without project

- **WHEN** the user navigates directly to `/workspace`, `/pipeline`, or `/integration` without a current project
- **THEN** the application renders the WelcomeView in the main content region

#### Scenario: Settings route is accessible without project

- **WHEN** the user navigates to `/settings` without a current project
- **THEN** the Settings page is accessible
