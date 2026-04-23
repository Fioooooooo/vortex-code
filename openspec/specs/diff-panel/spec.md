# diff-panel 规范

Diff 面板位于工作区右侧，默认折叠，支持通过多种触发方式展开，提供并排和内联两种 diff 渲染模式。

## Requirements

### Requirement: Diff 面板默认折叠

系统 SHALL 默认隐藏右侧 Diff 面板。

#### Scenario: 工作区初始加载

- **WHEN** 工作区页面加载
- **THEN** Diff 面板折叠，右侧边缘仅可见拖拽手柄

### Requirement: Diff 面板通过多种触发方式展开

系统 SHALL 在用户点击 Chat 中的文件操作卡片、点击文件树中的已变更文件或手动拖拽/点击右侧边缘手柄时展开 Diff 面板。

#### Scenario: 从文件操作卡片展开

- **WHEN** 用户点击 Chat 区域中的文件操作消息卡片
- **THEN** Diff 面板展开并显示该文件的 diff

#### Scenario: 从文件树展开

- **WHEN** 用户点击文件树中有变更的文件
- **THEN** Diff 面板展开并显示该文件的 diff

#### Scenario: 通过手柄手动展开

- **WHEN** 用户点击或拖拽右侧边缘手柄
- **THEN** Diff 面板展开

### Requirement: Diff 面板显示文件路径和关闭按钮

系统 SHALL 在 Diff 面板 header 中显示当前文件路径，并提供关闭按钮以折叠面板。

#### Scenario: Diff 面板 header

- **WHEN** Diff 面板打开
- **THEN** header 显示文件路径和关闭按钮

#### Scenario: 关闭面板

- **WHEN** 用户点击关闭按钮
- **THEN** Diff 面板折叠

### Requirement: Diff 面板支持并排和内联模式

系统 SHALL 提供切换按钮，在并排和内联 diff 渲染模式之间切换。

#### Scenario: 并排模式

- **WHEN** 用户选择并排模式
- **THEN** diff 以原始版本和修改版本并排渲染

#### Scenario: 内联模式

- **WHEN** 用户选择内联模式
- **THEN** diff 以单列形式渲染，新增和删除内容内联显示

### Requirement: Diff 面板支持多个已变更文件

系统 SHALL 在当前 session 有多个文件变更时，在 Diff 面板顶部提供文件列表下拉框或标签栏，允许用户在不同文件的 diff 之间切换。

#### Scenario: 多文件变更

- **WHEN** 当前 session 有多个文件的变更
- **THEN** Diff 面板 header 包含文件选择器以在不同 diff 之间切换
