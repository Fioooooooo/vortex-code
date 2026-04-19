# app-shell-routing Specification

## Purpose

定义应用壳路由结构、根入口重定向规则，以及项目作用域页面的访问约束。

## Requirements

### Requirement: Non-welcome pages share a route-level app shell

The system SHALL provide a route-level parent page for all non-welcome application pages, and that parent page SHALL render a shared application shell layout with dedicated header, side navigation, and main content regions.

#### Scenario: Shared shell wraps application pages

- **WHEN** the user navigates to `/workspace`, `/pipeline`, `/extension`, or `/setting`
- **THEN** the route is rendered inside the shared application shell
- **AND** the page-specific content is rendered in the shell's main region

### Requirement: Root application entry redirects by current project context

The system SHALL resolve access to `/` by checking the current project context and redirecting to `/welcome` when no project is selected, or to `/workspace` when a project is already selected.

#### Scenario: No project redirects to welcome

- **WHEN** the user navigates to `/` and there is no current project
- **THEN** the application redirects to `/welcome`

#### Scenario: Current project redirects to workspace

- **WHEN** the user navigates to `/` and a current project exists
- **THEN** the application redirects to `/workspace`

### Requirement: Application pages require a current project

The system SHALL prevent direct access to project-scoped application routes when no current project is selected.

#### Scenario: Project-scoped route without project

- **WHEN** the user navigates directly to `/workspace`, `/pipeline`, `/extension`, or `/setting` without a current project
- **THEN** the application redirects to `/welcome`
