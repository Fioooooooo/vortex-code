## MODIFIED Requirements

### Requirement: Agent 切换在非流式状态下生效

系统 SHALL 在 `chatStatus !== "streaming"` 时允许切换 agent。选择器的数据来源仍为已安装 ACP agent 列表，但其绑定目标取决于当前是否存在 active session。

#### Scenario: 草稿态下选择器绑定 draft agent

- **WHEN** 用户点击"新建 Session"进入草稿态，且当前没有任何 active session
- **THEN** `ChatAgentSelect` 仍处于可交互状态
- **AND** 其值绑定到响应式的 `draftAgentId`，而不是 `activeSession.agentId`

#### Scenario: 草稿态首条消息继承当前所选 agent

- **WHEN** 用户在草稿态发送第一条消息
- **THEN** 新创建的 session 的 `agentId` 等于当时选择器中的 `draftAgentId`

#### Scenario: 切换到已有 session 时选择器跟随 session

- **WHEN** 用户切换到某个已有 session
- **THEN** `ChatAgentSelect` 显示该 session 持久化的 `agentId`

#### Scenario: 流式进行中禁止切换 agent

- **WHEN** 当前 session 正在流式输出（`chatStatus === "streaming"`）
- **THEN** `ChatAgentSelect` 处于禁用状态，不可切换

### Requirement: 草稿态默认 agent 不得硬编码

系统 SHALL 从已安装 ACP agent 集合中解析草稿态默认 agent，不得在 session store 或组件中硬编码固定 `agentId`。

#### Scenario: 已安装 agent 可用时解析默认 draft agent

- **WHEN** 用户进入草稿态，且系统中至少有一个已安装 ACP agent
- **THEN** 系统为 `draftAgentId` 选择一个来自已安装 agent 集合的值

#### Scenario: draft agent 不回退到硬编码值

- **WHEN** 当前已安装 agent 集合发生变化，或原先的 `draftAgentId` 已不再可用
- **THEN** 系统只允许从新的已安装 agent 集合中重新解析 `draftAgentId`
- **AND** 不得回退到任何硬编码固定 `agentId`

#### Scenario: 无已安装 agent 时不创建 session

- **WHEN** 用户处于草稿态，且系统中没有任何已安装 ACP agent
- **THEN** `draftAgentId` 保持为空
- **AND** 用户发送首条消息时，系统不得创建 session，并应提示用户先安装 agent
