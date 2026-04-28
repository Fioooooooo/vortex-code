# chat-agent-selection Specification

## Purpose

定义 Chat 界面中 agent 选择的数据模型与状态管理规范，将 chat 层的 agent 表示（ChatAgent）与 ACP 层的 agent 注册表（AcpAgentEntry）解耦。

## Requirements

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

`chat` store 中的当前 agent 状态 SHALL 使用 `ChatAgent` 类型，替换原有的 `AgentInfo`/`AgentType`。

#### Scenario: chat store 初始化

- **WHEN** chat store 初始化
- **THEN** `currentAgent` 为 `ChatAgent` 类型，包含 `id`、`name`、`acpAgentId` 字段
