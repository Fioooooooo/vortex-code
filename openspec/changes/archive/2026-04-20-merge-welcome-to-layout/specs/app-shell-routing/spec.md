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

### Requirement: Settings route 与 Activity Bar 高亮

Activity Bar SHALL 包含齿轮图标入口，点击后路由跳转至 `/settings`。当当前路由为 `/settings` 时，Activity Bar 中齿轮图标 SHALL 显示高亮激活状态。

#### Scenario: 点击 Activity Bar 齿轮图标

- **WHEN** 用户点击 Activity Bar 中的齿轮图标
- **THEN** 路由跳转至 `/settings`，齿轮图标高亮

#### Scenario: 离开 Settings 页面

- **WHEN** 用户导航至其他页面
- **THEN** 齿轮图标高亮状态取消
