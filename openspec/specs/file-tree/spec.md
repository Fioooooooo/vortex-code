# file-tree 规范

文件树在 Chat 左侧边栏的"文件"标签中展示当前项目的目录结构，并标注 Agent 在当前 session 中产生的文件变更。

## Requirements

### Requirement: 文件标签显示项目目录树

系统 SHALL 在左侧边栏的"文件"标签中显示标准文件树，展示当前项目的目录结构。

#### Scenario: 文件树渲染

- **WHEN** 用户切换到文件标签
- **THEN** 项目目录结构以可展开的树形结构显示

### Requirement: 文件树显示 session 变更标记

系统 SHALL 在树中为当前 session 的文件名添加变更标记：新增文件显示绿色标记，修改文件显示黄色标记，删除文件显示红色删除线。这些标记代表 Agent 生成的变更，与 git 状态标记不同。

#### Scenario: 新增文件标记

- **WHEN** Agent 在当前 session 中创建新文件
- **THEN** 树中该文件名显示绿色指示器

#### Scenario: 修改文件标记

- **WHEN** Agent 在当前 session 中修改现有文件
- **THEN** 树中该文件名显示黄色指示器

#### Scenario: 删除文件标记

- **WHEN** Agent 在当前 session 中删除文件
- **THEN** 树中该文件名显示带删除线的红色指示器

### Requirement: 点击文件打开 diff 或只读预览

系统 SHALL 在右侧 Diff 面板中打开被点击的文件：若文件有 session 变更则显示 diff 对比，若无变更则显示只读预览。

#### Scenario: 点击有变更的文件

- **WHEN** 用户点击有 session 变更的文件
- **THEN** 右侧 Diff 面板打开并显示该文件的 diff 对比

#### Scenario: 点击无变更的文件

- **WHEN** 用户点击无 session 变更的文件
- **THEN** 右侧 Diff 面板打开并显示该文件内容的只读预览
