## MODIFIED Requirements

### Requirement: 根路径入口根据当前项目上下文重定向

系统 SHALL 通过检查当前项目上下文来解析对 `/` 的访问：无项目时保持在 `/`（渲染 WelcomeView），已有项目时重定向到 ActivityBar 注册表声明的默认应用页。

#### Scenario: 无项目时停留在根路径

- **WHEN** 用户导航到 `/` 且无当前项目
- **THEN** 应用停留在 `/` 并在共享外壳内渲染 WelcomeView

#### Scenario: 有当前项目时重定向到默认应用页

- **WHEN** 用户导航到 `/` 且存在当前项目
- **THEN** 应用重定向到 ActivityBar 注册表声明的默认应用页（即 `isDefault: true` 的条目所对应的 `path`）
