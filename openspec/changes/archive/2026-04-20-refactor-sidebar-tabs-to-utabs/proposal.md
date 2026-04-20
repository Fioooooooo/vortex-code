## Why

目前 `/chat` 和 `/pipeline` 页面的 sidebar 顶部 tab 切换都是使用原生 `<button>` 元素手动实现的，代码重复且需要自行维护 active 状态样式。使用 nuxt/ui 的 `UTabs` 组件可以统一交互行为、减少样板代码，并自动获得 accessibility 支持。

## What Changes

- 将 `frontend/src/components/chat/Sidebar.vue` 的手动 tab 切换重构为 `UTabs` 组件（variant: `link`）
- 将 `frontend/src/components/pipeline/PipelineSidebar.vue` 的手动 tab 切换重构为 `UTabs` 组件（variant: `link`）
- 使用 `UTabs` 默认的 `link` variant 样式，通过 `ui` 属性微调样式
- 保持现有状态管理逻辑（store 中的 `sidebarTab` 和 `setSidebarTab`）不变
- 统一 SessionList、RunList、TemplateList 的 New button 样式为 `variant="outline"`
- 将 tabs label 和 New button 文案本地化为中文

## Capabilities

### New Capabilities

### Modified Capabilities

- `chat-interface`: sidebar tab 切换交互实现方式变更（UI 组件替换，行为不变）
- `pipeline-page`: sidebar tab 切换交互实现方式变更（UI 组件替换，行为不变）

## Impact

- 前端组件：`frontend/src/components/chat/Sidebar.vue`、`frontend/src/components/pipeline/PipelineSidebar.vue`
- 依赖：nuxt/ui 的 `UTabs` 组件
- 无 API 变更、无状态管理逻辑变更
