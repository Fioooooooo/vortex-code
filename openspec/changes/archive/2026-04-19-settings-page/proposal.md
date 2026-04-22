## Why

FylloCode 目前缺少全局设置页面，用户无法查看已支持的 CLI agent 安装状态，也无法配置界面主题、语言、行为偏好和数据管理等全局选项。随着支持的 agent 数量增加，需要一个统一的状态面板和偏好管理入口。

## What Changes

- 新增 Settings 页面，Activity Bar 中齿轮图标对应该页面
- 新增 Agents tab：展示 Claude Code、Codex、Gemini CLI、OpenCode 四个 agent 的安装状态与版本信息
- 新增 Preferences tab：包含 Appearance、Behavior、Data 三个分组的全局偏好配置
- 主题切换与顶栏明暗切换按钮双向联动
- 所有配置项即时生效并自动保存，无需全局保存按钮

## Capabilities

### New Capabilities

- `settings-page`: 全局设置页面的整体布局与路由，包含左侧垂直 tab 导航（Agents / Preferences）和右侧内容区
- `agent-status-panel`: Agents tab — 展示支持的 CLI agent 列表、本地安装检测状态、版本号及安装文档链接，支持手动刷新
- `global-preferences`: Preferences tab — Appearance（主题模式、界面语言）、Behavior（默认自动模式、通知方式、会话自动保存）、Data（统计周期、预算警告阈值、清除历史数据）三组偏好配置

### Modified Capabilities

- `app-shell-routing`: 新增 `/settings` 路由，Activity Bar 齿轮图标高亮逻辑

## Impact

- 新增页面：`pages/settings.vue`（或 `pages/settings/index.vue`）
- 新增 store：`stores/settings.ts`（偏好数据 + agent 状态 mock + actions）
- 新增类型：`src/types/settings.ts`（AgentInfo、PreferencesConfig 等）
- 修改：`app-shell` 路由配置，Activity Bar 激活状态逻辑
- 依赖：`@nuxt/ui` 组件、`lucide-vue-next` 图标库
