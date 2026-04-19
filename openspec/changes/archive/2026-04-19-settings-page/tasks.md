## 1. 类型定义

- [x] 1.1 创建 `src/types/settings.ts`，定义 `ThemeMode`、`AgentMode`、`NotificationMethod`、`BudgetUnit`、`TokenStatsPeriod` 枚举/联合类型
- [x] 1.2 在 `src/types/settings.ts` 中定义 `AgentInfo` 接口（id、name、description、installed、version?、docsUrl）
- [x] 1.3 在 `src/types/settings.ts` 中定义 `PreferencesConfig` 接口（theme、language、defaultAgentMode、notificationMethods、autoSaveSession、tokenStatsPeriod、budgetAlert）

## 2. Store 实现

- [x] 2.1 创建 `stores/settings.ts`，初始化 `agentStatus` mock 数据（四个 agent，部分 installed: true）
- [x] 2.2 在 store 中实现 `refreshAgentStatus()` async action（模拟延迟，返回 mock 数据）
- [x] 2.3 在 store 中初始化 `preferences` 默认值（theme: 'system'，language: 'en' 等）
- [x] 2.4 在 store 中实现 `updatePreference(key, value)` action
- [x] 2.5 在 store 中实现 `clearAllHistory()` action（mock 实现）

## 3. 路由与 App Shell

- [x] 3.1 创建 `pages/settings.vue`（或 `pages/settings/index.vue`）页面文件
- [x] 3.2 在 App Shell 的 Activity Bar 中添加齿轮图标入口，路由指向 `/settings`
- [x] 3.3 实现 Activity Bar 齿轮图标的激活高亮逻辑（当前路由为 `/settings` 时高亮）
- [x] 3.4 确认 `/settings` 路由无需项目上下文（不受项目守卫拦截）

## 4. Settings 页面布局

- [x] 4.1 实现左侧垂直 tab 导航（宽度 `w-44`），包含 Agents 和 Preferences 两项
- [x] 4.2 实现右侧内容区（`max-w-2xl` 居中），根据选中 tab 渲染对应内容
- [x] 4.3 实现小屏幕响应式适配（`sm` 断点以下 tab 导航自适应）

## 5. Agents Tab

- [x] 5.1 实现 Agent 卡片组件，展示图标、名称、描述、安装状态标签
- [x] 5.2 已安装状态：显示 `color="success"` 的 "Installed" badge 及版本号
- [x] 5.3 未安装状态：显示 `color="neutral"` 的 "Not Installed" badge 及官方文档链接
- [x] 5.4 实现页面顶部 "Refresh" 按钮，点击触发 `refreshAgentStatus()`，刷新期间显示 loading 状态

## 6. Preferences Tab — Appearance 分组

- [x] 6.1 实现主题模式三选一单选组（Light / Dark / System），绑定 `useColorMode().preference`
- [x] 6.2 验证主题切换与顶栏明暗切换按钮双向联动
- [x] 6.3 实现界面语言下拉选择，绑定 store `preferences.language`

## 7. Preferences Tab — Behavior 分组

- [x] 7.1 实现默认自动模式单选（Auto / Manual），绑定 store `preferences.defaultAgentMode`
- [x] 7.2 实现通知方式多选（系统通知 / 声音提示 / 仅应用内标记），绑定 store `preferences.notificationMethods`
- [x] 7.3 实现会话自动保存开关（UToggle），绑定 store `preferences.autoSaveSession`

## 8. Preferences Tab — Data 分组

- [x] 8.1 实现 Token 用量统计周期单选（Daily / Weekly / Monthly），绑定 store `preferences.tokenStatsPeriod`
- [x] 8.2 实现预算警告阈值输入框 + 单位选择（tokens / USD），绑定 store `preferences.budgetAlert`
- [x] 8.3 实现清除所有历史数据按钮（`color="error"`，禁止硬编码颜色）
- [x] 8.4 实现清除历史数据的 UModal 二次确认对话框（含警告说明、确认/取消按钮）
