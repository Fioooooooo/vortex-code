## Context

FylloCode 是一个 Nuxt 4 + Electron 桌面应用，已有 app-shell 路由、Activity Bar、Workspace、Pipeline、Integrations 等页面。当前缺少全局设置入口。技术栈：Nuxt 4、@nuxt/ui v4、Pinia、lucide-vue-next、TypeScript。

## Goals / Non-Goals

**Goals:**

- 新增 `/settings` 路由，Activity Bar 齿轮图标激活
- Agents tab：展示四个 agent 的安装状态（mock 数据），支持手动刷新
- Preferences tab：Appearance / Behavior / Data 三组偏好，即时保存
- 类型定义抽取到 `src/types/settings.ts`，供 Electron 主进程共享
- 全部使用 @nuxt/ui 语义化颜色，lucide 图标，多断点兼容

**Non-Goals:**

- 实际调用系统 CLI 检测（mock 即可，action 预留接口）
- Agent 安装/卸载功能
- 多用户/账号管理
- 设置项的云端同步

## Decisions

### 1. Store 架构：单一 `useSettingsStore`

将 agent 状态检测和偏好配置合并到一个 store，通过 `agentStatus` 和 `preferences` 两个 state 分区管理。

**理由**：Settings 页面是唯一消费方，拆分两个 store 增加复杂度而无收益。Action 层预留 `refreshAgentStatus()` 和 `updatePreference()` 接口，未来替换 mock 只需修改 action 实现。

**备选**：拆分 `useAgentStore` + `usePreferencesStore` — 过度设计，当前不需要。

### 2. 类型共享策略：`src/types/settings.ts`

所有 Settings 相关类型（`AgentInfo`、`AgentStatus`、`PreferencesConfig`、`ThemeMode` 等）统一放在 `src/types/settings.ts`。

**理由**：Electron 主进程需要读写偏好配置文件，类型共享避免重复定义和不一致。`src/types/` 目录不依赖 Nuxt 运行时，可直接被 Electron 端 import。

### 3. 主题联动：通过 `useColorMode()` composable

Preferences 中的主题选择直接调用 `useColorMode().preference`，与顶栏已有的明暗切换按钮共享同一响应式状态，天然双向联动。

**理由**：@nuxt/ui 内置 `useColorMode`，无需额外状态管理。

### 4. 布局：左侧固定宽度 tab + 右侧滚动内容区

左侧 tab 导航宽度 180px（`w-44`），右侧内容区最大宽度 720px（`max-w-2xl`），整体居中。使用 `UTabs` 组件的 `orientation="vertical"` 模式或自定义垂直导航。

**理由**：@nuxt/ui UTabs 支持 vertical orientation，减少自定义代码。

### 5. 即时保存：watch + debounce

每个偏好项通过 `watch` 监听变化，调用 store action 持久化。无需全局保存按钮。

## Risks / Trade-offs

- **Mock 数据与真实检测的差距** → action 接口设计时预留 `Promise<void>` 签名，未来替换实现不影响组件层
- **UTabs vertical 在小屏幕的适配** → 在 `sm` 断点以下折叠为顶部 tab 或 select，通过响应式类控制
- **清除历史数据的危险操作** → 使用 UModal 二次确认，按钮使用 `color="error"` 语义色，不硬编码红色
