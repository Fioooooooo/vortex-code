## MODIFIED Requirements

### Requirement: Non-welcome pages share a route-level app shell

The system SHALL provide a route-level parent page for all non-welcome application pages, and that parent page SHALL render a shared application shell layout with dedicated header, side navigation, and main content regions.

#### Scenario: Shared shell wraps application pages

- **WHEN** the user navigates to `/workspace`, `/pipeline`, `/integration`, `/settings`, or `/setting`
- **THEN** the route is rendered inside the shared application shell
- **AND** the page-specific content is rendered in the shell's main region

### Requirement: Application pages require a current project

The system SHALL prevent direct access to project-scoped application routes when no current project is selected.

#### Scenario: Project-scoped route without project

- **WHEN** the user navigates directly to `/workspace`, `/pipeline`, `/integration`, or `/setting` without a current project
- **THEN** the application redirects to `/welcome`

#### Scenario: Settings route is accessible without project

- **WHEN** the user navigates to `/settings` without a current project
- **THEN** the Settings page is accessible（全局设置不依赖项目上下文）

## ADDED Requirements

### Requirement: Settings route 与 Activity Bar 高亮

Activity Bar SHALL 包含齿轮图标入口，点击后路由跳转至 `/settings`。当当前路由为 `/settings` 时，Activity Bar 中齿轮图标 SHALL 显示高亮激活状态。

#### Scenario: 点击 Activity Bar 齿轮图标

- **WHEN** 用户点击 Activity Bar 中的齿轮图标
- **THEN** 路由跳转至 `/settings`，齿轮图标高亮

#### Scenario: 离开 Settings 页面

- **WHEN** 用户导航至其他页面
- **THEN** 齿轮图标高亮状态取消
