# project-switcher 规范

项目切换器位于共享应用外壳 header 左上角，显示当前项目与绑定 Agent 信息，并支持快速切换项目、新建项目及进入项目设置。

## Requirements

### Requirement: 项目切换器显示当前项目和 Agent

系统 SHALL 在共享应用外壳 header 左上角显示来自统一项目上下文的当前项目名称和绑定 Agent 类型标签，并附带下拉箭头表示可展开。

#### Scenario: 项目切换器收起状态

- **WHEN** 用户处于非欢迎页的应用页面
- **THEN** header 显示当前项目名称、Agent 类型标签和下拉箭头

### Requirement: 项目切换器下拉支持导航

系统 SHALL 在点击时展开下拉列表，包含项目列表以及新建项目和进入项目设置的选项。

#### Scenario: 切换项目

- **WHEN** 用户点击项目切换器并选择其他项目
- **THEN** 统一项目上下文更新为所选项目
- **AND** 应用保持在共享应用外壳内
- **AND** 主内容区域更新为所选项目的工作区

#### Scenario: 从切换器新建项目

- **WHEN** 用户点击下拉列表中的"新建项目"选项
- **THEN** 当前项目上下文被清除
- **AND** 主内容区域切换到 WelcomeView
- **AND** 不触发路由导航

### Requirement: Header 显示系统控件

系统 SHALL 在共享应用外壳 header 右上角显示主题切换、Token 用量指示器和 Agent 状态指示器。

#### Scenario: Token 用量悬停

- **WHEN** 用户悬停在 Token 用量指示器上
- **THEN** 显示 tooltip 或弹出框，展示当前 session 的预估费用

#### Scenario: Agent 状态指示

- **WHEN** Agent 状态变化（idle、thinking、executing、awaiting confirmation）
- **THEN** 状态指示器更新以反映当前状态，显示对应的圆点或动画
