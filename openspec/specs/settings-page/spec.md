# settings-page Specification

## Purpose

TBD - created by archiving change settings-page. Update Purpose after archive.

## Requirements

### Requirement: Settings page layout

Settings 页面 SHALL 采用左侧垂直 tab 导航（宽度约 180px）+ 右侧内容区的双栏布局。右侧内容区 SHALL 居中显示，最大宽度限制在 720px（`max-w-2xl`）。页面路由为 `/settings`。

#### Scenario: 访问 settings 页面

- **WHEN** 用户点击 Activity Bar 中的齿轮图标
- **THEN** 路由跳转至 `/settings`，Activity Bar 齿轮图标高亮，默认激活 Agents tab

#### Scenario: 垂直 tab 导航切换

- **WHEN** 用户点击左侧导航中的 "Preferences"
- **THEN** 右侧内容区切换为 Preferences 内容，选中项显示高亮背景

#### Scenario: 小屏幕响应式

- **WHEN** 视口宽度小于 `sm` 断点（640px）
- **THEN** 布局自适应，tab 导航不遮挡内容区，内容可正常滚动

### Requirement: Settings store 与类型定义

Settings 相关类型 SHALL 定义在 `src/types/settings.ts`，包含 `AgentInfo`、`AgentStatus`、`PreferencesConfig`、`ThemeMode`、`NotificationMethod` 等。`useSettingsStore` SHALL 包含 `agentStatus` 和 `preferences` 两个 state 分区，所有与数据交互的逻辑 SHALL 封装在 store action 中，组件层不直接操作原始数据。

#### Scenario: Store 初始化

- **WHEN** Settings 页面首次挂载
- **THEN** store 已包含四个 agent 的 mock 状态数据和默认偏好配置

#### Scenario: 类型可被 Electron 端引用

- **WHEN** Electron 主进程 import `src/types/settings.ts`
- **THEN** 类型定义可正常使用，无 Nuxt 运行时依赖
