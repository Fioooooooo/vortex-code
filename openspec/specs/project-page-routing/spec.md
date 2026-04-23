# project-page-routing 规范

项目页面路由定义了工作区、Pipeline、集成和设置页面的路由结构，以及根路径的项目上下文重定向逻辑。

## Requirements

### Requirement: 项目作用域页面为顶级路由

系统 SHALL 将工作区、Pipeline 和集成页面作为顶级路由直接挂载在 `/` 下。

#### Scenario: 工作区路由

- **WHEN** 用户导航到 `/workspace`
- **THEN** 工作区页面在共享应用外壳内渲染

#### Scenario: Pipeline 路由

- **WHEN** 用户导航到 `/pipeline`
- **THEN** Pipeline 页面在共享应用外壳内渲染

#### Scenario: 集成路由

- **WHEN** 用户导航到 `/integration`
- **THEN** 集成页面在共享应用外壳内渲染

### Requirement: 设置页面使用 /settings 路径

系统 SHALL 将设置页面路由到 `/settings`。

#### Scenario: 设置路由

- **WHEN** 用户导航到 `/settings`
- **THEN** 设置页面在共享应用外壳内渲染
- **AND** 无论是否有项目打开，页面均可访问

## MODIFIED Requirements

### Requirement: 非欢迎页共享路由级应用外壳

系统 SHALL 为所有应用页面提供路由级父页面，该父页面 SHALL 渲染带有专用 header、侧边导航和主内容区域的共享应用外壳布局。

#### Scenario: 共享外壳包裹应用页面

- **WHEN** 用户导航到 `/workspace`、`/pipeline`、`/integration` 或 `/settings`
- **THEN** 路由在共享应用外壳内渲染
- **AND** 页面专属内容在外壳主区域渲染

### Requirement: 根路径入口根据当前项目上下文重定向

系统 SHALL 通过检查当前项目上下文来解析对 `/` 的访问：无项目时保持在 `/`（渲染 WelcomeView），已有项目时重定向到 `/workspace`。

#### Scenario: 无项目时停留在根路径

- **WHEN** 用户导航到 `/` 且无当前项目
- **THEN** 应用停留在 `/` 并在共享外壳内渲染 WelcomeView

#### Scenario: 有当前项目时重定向到工作区

- **WHEN** 用户导航到 `/` 且存在当前项目
- **THEN** 应用重定向到 `/workspace`

### Requirement: 应用页面需要当前项目

系统 SHALL 在无当前项目时阻止访问项目作用域的应用路由，改为渲染 WelcomeView。

#### Scenario: 无项目时访问项目作用域路由

- **WHEN** 用户在无当前项目的情况下直接导航到 `/workspace`、`/pipeline` 或 `/integration`
- **THEN** 应用在主内容区域渲染 WelcomeView

#### Scenario: 无项目时设置路由可访问

- **WHEN** 用户在无当前项目的情况下导航到 `/settings`
- **THEN** 设置页面可正常访问
