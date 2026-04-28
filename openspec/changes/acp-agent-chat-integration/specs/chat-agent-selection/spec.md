## MODIFIED Requirements

### Requirement: ChatAgent 数据模型

系统 SHALL 定义 `ChatAgent` 类型，表示用户在 chat 界面选择的 agent 实例。`ChatAgent` SHALL 包含：`id`（自身唯一标识）、`name`（显示名称）、`acpAgentId`（关联的 ACP agent id，引用 `AcpAgentEntry.id`）。

`ChatAgent` 与 `AcpAgentEntry` 的关系 SHALL 为引用关系（通过 `acpAgentId`），而非嵌套或继承，两者生命周期独立。

#### Scenario: ChatAgent 引用已安装的 ACP agent

- **WHEN** 系统中存在一个 `acpAgentId` 为 `"claude-code"` 的 `ChatAgent`
- **THEN** 可通过 `acpAgentId` 在 `AcpAgentEntry[]` 中查找到对应的 ACP agent 信息

#### Scenario: ChatAgent 与 AcpAgent 解耦

- **WHEN** ACP agent 的安装状态发生变化（安装/卸载/更新）
- **THEN** `ChatAgent` 的数据结构本身不受影响，仅通过 `acpAgentId` 的查找结果反映状态变化

### Requirement: chat store 使用 ChatAgent 类型

`chat` store 中的当前 agent 状态 SHALL 使用 `ChatAgent` 类型。

#### Scenario: chat store 初始化

- **WHEN** chat store 初始化
- **THEN** `currentAgent` 为 `ChatAgent` 类型，包含 `id`、`name`、`acpAgentId` 字段

## ADDED Requirements

### Requirement: ChatAgentSelect 展示已安装 ACP agent 列表

系统 SHALL 将 `AgentSelect` 组件重命名为 `ChatAgentSelect`，数据源改为 `useAcpAgentsStore` 中 `statuses[id].installed === true` 的 agent 列表，不再使用硬编码列表。

#### Scenario: 展示已安装 agent

- **WHEN** 用户打开 ChatAgentSelect 下拉菜单
- **THEN** 列表只显示 `statuses[id].installed === true` 的 ACP agent
- **AND** 每个选项显示 agent 名称和图标（来自 `icons[id]`，无图标时显示默认图标）

#### Scenario: 无已安装 agent 时的空状态

- **WHEN** 没有任何 ACP agent 处于已安装状态
- **THEN** 下拉菜单显示空状态提示，引导用户前往设置安装 agent

### Requirement: Agent 切换仅在会话首次发送前生效

系统 SHALL 在 `session.turnCount === 0` 时允许切换 agent；首次发送消息后（`turnCount > 0`），ChatAgentSelect SHALL 变为禁用状态，不可再切换。

#### Scenario: 首次发送前可切换 agent

- **WHEN** session 的 `turnCount === 0`
- **THEN** ChatAgentSelect 处于可交互状态，用户可选择不同 agent

#### Scenario: 首次发送后禁用切换

- **WHEN** session 的 `turnCount > 0`
- **THEN** ChatAgentSelect 处于禁用状态，不响应用户交互
