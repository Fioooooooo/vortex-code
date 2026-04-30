## MODIFIED Requirements

### Requirement: Agent 卡片列表展示

Agents tab SHALL 以网格卡片列表展示 ACP registry 中的所有 CLI agent。每张卡片 SHALL 包含：左侧 agent 图标与名称、名称下方版本号与 license；右侧根据安装状态展示对应操作区域。卡片不可展开，无配置项，无 Add Agent 操作。

数据来源 SHALL 为 `useAcpAgentsStore` 中的 `registry`（通过 `acp:getRegistry` 获取），图标来源为 `icons`（通过 `acp:getIcons` 获取）。不得直接在组件中调用 `netApi`。Settings 页面 SHALL 只负责展示与手动刷新 ACP agent 数据，不得承担该数据的首次全局初始化职责。

#### Scenario: 打开 settings 时直接复用已预热数据

- **WHEN** 用户在 app bootstrap 完成后进入 settings agents 页面
- **THEN** 页面直接展示 `acp-agents` store 中已有的 registry/icons/statuses 数据
- **AND** 不需要重新执行首次初始化流程

#### Scenario: bootstrap 缺失时 settings 页面兜底初始化

- **WHEN** 用户进入 settings agents 页面时，全局 bootstrap 尚未完成或未触发，且 `acp-agents` store 仍未初始化
- **THEN** 页面可调用 `ensureInitialized()` 作为兜底
- **AND** 该兜底不改变“全局 bootstrap 为主路径”的职责边界

### Requirement: 手动刷新检测

页面顶部 SHALL 提供 "Refresh" 按钮，点击后触发 store action `refreshAll()`，重新拉取 registry、图标与安装状态。刷新期间按钮 SHALL 显示 loading 状态，完成后恢复。

#### Scenario: 点击 Refresh 按钮

- **WHEN** 用户点击 "Refresh" 按钮
- **THEN** 按钮进入 loading 状态，`refreshAll()` action 被调用，完成后 agent 卡片状态更新
