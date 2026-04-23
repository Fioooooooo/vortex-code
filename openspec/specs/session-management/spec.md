# session-management 规范

Session 管理定义了 Chat 左侧边栏中 session 列表的展示、新建、选择和操作行为。

## Requirements

### Requirement: Sessions 标签列出所有项目 session

系统 SHALL 在左侧边栏的"Sessions"标签中显示 session 列表，按最新优先排序，最新 session 在顶部。

#### Scenario: Session 列表已填充

- **WHEN** 项目存在已有 session
- **THEN** 列表显示每个 session 的标题、时间戳、轮次数和状态指示器

#### Scenario: Session 标题截断

- **WHEN** session 标题超过一行
- **THEN** 标题以省略号截断

### Requirement: Session 列表显示 session 元数据

每个 session 条目 SHALL 显示从第一条用户消息派生的标题、次要行上的时间戳和轮次数（如"今天 14:32 · 12 轮"），以及状态圆点（运行中为绿色，已结束为灰色）。

#### Scenario: 运行中 session 指示器

- **WHEN** session 的 Agent 仍在工作
- **THEN** session 条目上显示绿色圆点

#### Scenario: 已结束 session 指示器

- **WHEN** session 已完成
- **THEN** session 条目上显示灰色圆点

### Requirement: 新建 Session 按钮创建空白 session

系统 SHALL 在 Sessions 标签顶部提供"新建 Session"按钮，点击时在中央主区域创建新的空白 session。

#### Scenario: 创建新 session

- **WHEN** 用户点击"新建 Session"按钮
- **THEN** Chat 区域打开新的空白 session，并出现在 session 列表顶部

### Requirement: Session 条目支持选择和操作

系统 SHALL 高亮当前选中的 session，并在悬停时显示更多操作菜单（重命名、删除、归档）。

#### Scenario: 选择 session

- **WHEN** 用户点击 session 条目
- **THEN** 该 session 以高亮背景被选中，其内容加载到 Chat 区域

#### Scenario: Session 更多操作菜单

- **WHEN** 用户悬停在 session 条目上并点击三点菜单
- **THEN** 下拉菜单出现，包含重命名、删除或归档 session 的选项

### Requirement: 空状态引导

系统 SHALL 在 session 列表为空时显示引导消息"开始新 session 以与 Agent 协作。"

#### Scenario: 无 session 存在

- **WHEN** 项目无 session
- **THEN** 列表区域显示空状态消息而非列表
