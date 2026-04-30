## MODIFIED Requirements

### Requirement: ChatAgentSelect 展示已安装 ACP agent 列表

系统 SHALL 将 `AgentSelect` 组件重命名为 `ChatAgentSelect`，数据源改为 `useAcpAgentsStore` 中 `statuses[id].installed === true` 的 agent 列表，不再使用硬编码列表。ACP agent 数据 SHALL 在 app 启动后的 bootstrap 阶段预热，而不是依赖 settings 页面触发首次加载。

#### Scenario: 进入项目后直接看到已安装 agent

- **WHEN** 用户启动应用并进入某个 project，且 ACP agent bootstrap 已完成
- **THEN** ChatAgentSelect 直接显示已安装 ACP agent 列表
- **AND** 不要求用户先访问 settings 页面

#### Scenario: bootstrap 未完成时短暂空态

- **WHEN** ChatAgentSelect 首次渲染时 ACP agent bootstrap 尚未完成
- **THEN** 组件允许短暂显示空态
- **AND** bootstrap 完成后自动更新为已安装 agent 列表
