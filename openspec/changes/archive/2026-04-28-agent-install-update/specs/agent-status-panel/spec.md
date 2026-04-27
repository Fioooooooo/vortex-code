## MODIFIED Requirements

### Requirement: Agent 卡片列表展示

Agents tab SHALL 以网格卡片列表展示 ACP registry 中的所有 CLI agent。每张卡片 SHALL 包含：左侧 agent 图标与名称、名称下方版本号与 license；右侧根据安装状态展示对应操作区域。卡片不可展开，无配置项，无 Add Agent 操作。

数据来源 SHALL 为 `useSettingsStore` 中的 `agentRegistry`（通过 `settings:agents:getRegistry` 获取），图标来源为 `agentIcons`（通过 `settings:agents:getIcons` 获取）。不得直接在组件中调用 `netApi`。

#### Scenario: 已安装且为最新版

- **WHEN** store 中某 agent 的 `installed` 为 `true` 且 `updateAvailable` 为 `false`
- **THEN** 卡片右侧显示绿色（`color="success"`）"Installed" 标签及检测到的版本号

#### Scenario: 已安装且有更新可用（FylloCode 管理）

- **WHEN** store 中某 agent 的 `installed` 为 `true`，`updateAvailable` 为 `true`，`managedBy` 为 `"fyllocode"`
- **THEN** 卡片右侧显示"Update Available"badge 及"更新"按钮，点击直接执行更新

#### Scenario: 已安装且有更新可用（用户自管理）

- **WHEN** store 中某 agent 的 `installed` 为 `true`，`updateAvailable` 为 `true`，`managedBy` 为 `"user"`
- **THEN** 卡片右侧显示"Update Available"badge 及"更新"按钮，点击弹出确认对话框

#### Scenario: 未安装 agent 展示

- **WHEN** store 中某 agent 的 `installed` 为 `false`
- **THEN** 卡片右侧显示"安装"按钮，点击触发安装流程

#### Scenario: 安装中状态

- **WHEN** 某 agent 正在安装（收到 `installProgress` 推送，`status` 为 `"installing"` 或 `"downloading"`）
- **THEN** 卡片右侧"安装"/"更新"按钮替换为 loading 状态，其他 agent 的安装按钮禁用

### Requirement: 手动刷新检测

页面顶部 SHALL 提供 "Refresh" 按钮，点击后触发 store action `refreshAgentStatus()`，重新调用 `settings:agents:detectStatus` 检测所有 agent 安装状态。刷新期间按钮 SHALL 显示 loading 状态，完成后恢复。

#### Scenario: 点击 Refresh 按钮

- **WHEN** 用户点击 "Refresh" 按钮
- **THEN** 按钮进入 loading 状态，`refreshAgentStatus()` action 被调用，完成后 agent 卡片状态更新

#### Scenario: 新安装 agent 后刷新

- **WHEN** 用户在系统中安装了某 agent 后点击 Refresh
- **THEN** 对应 agent 卡片状态从 "Not Installed" 变为 "Installed" 并显示版本号
