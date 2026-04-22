## ADDED Requirements

### Requirement: Agent 卡片列表展示

Agents tab SHALL 以纵向卡片列表展示 FylloCode 支持的所有 CLI agent：Claude Code、Codex、Gemini CLI、OpenCode。每张卡片 SHALL 包含：左侧 agent 图标与名称、名称下方一行描述文字；右侧安装状态标识。卡片不可展开，无配置项，无 Add Agent 操作。

#### Scenario: 已安装 agent 展示

- **WHEN** store 中某 agent 的 `installed` 为 `true`
- **THEN** 卡片右侧显示绿色（`color="success"`）"Installed" 标签及检测到的版本号

#### Scenario: 未安装 agent 展示

- **WHEN** store 中某 agent 的 `installed` 为 `false`
- **THEN** 卡片右侧显示灰色（`color="neutral"`）"Not Installed" 标签，标签下方显示指向官方安装文档的链接

### Requirement: 手动刷新检测

页面顶部 SHALL 提供 "Refresh" 按钮，点击后触发 store action `refreshAgentStatus()`，重新检测所有 agent 安装状态。刷新期间按钮 SHALL 显示 loading 状态，完成后恢复。

#### Scenario: 点击 Refresh 按钮

- **WHEN** 用户点击 "Refresh" 按钮
- **THEN** 按钮进入 loading 状态，`refreshAgentStatus()` action 被调用，完成后 agent 卡片状态更新

#### Scenario: 新安装 agent 后刷新

- **WHEN** 用户在系统中安装了某 agent 后点击 Refresh
- **THEN** 对应 agent 卡片状态从 "Not Installed" 变为 "Installed" 并显示版本号

### Requirement: Agent 数据 mock

`useSettingsStore` 中 `agentStatus` 的初始数据 SHALL 为 mock 数据，包含四个 agent 的安装状态（部分 installed: true，部分 false）。`refreshAgentStatus()` action SHALL 预留为 async 函数，当前实现可模拟延迟后返回 mock 数据。

#### Scenario: Mock 数据结构

- **WHEN** store 初始化
- **THEN** `agentStatus` 包含 `id`、`name`、`description`、`installed`、`version`（可选）、`docsUrl` 字段的 agent 数组
