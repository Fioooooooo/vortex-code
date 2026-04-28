## MODIFIED Requirements

### Requirement: 功能栏显示 Agent 选择器和自动/手动切换

系统 SHALL 在输入栏上方渲染功能栏，左侧显示当前 `ChatAgent` 名称（可点击切换），右侧显示自动/手动模式切换。当前 agent 信息来源 SHALL 为 `chat` store 中的 `currentAgent`（类型为 `ChatAgent`）。

#### Scenario: Agent 名称显示

- **WHEN** 功能栏可见
- **THEN** 左侧显示 `currentAgent.name`（如"Claude Code"）

#### Scenario: 切换 Agent

- **WHEN** 用户点击 Agent 名称
- **THEN** 出现 Agent 选择下拉框或模态框

#### Scenario: 自动/手动切换

- **WHEN** 用户在自动和手动模式之间切换
- **THEN** 模式立即变更，影响后续 Agent 操作中是否出现确认请求卡片
