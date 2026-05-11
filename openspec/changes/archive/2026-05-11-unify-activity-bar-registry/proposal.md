## Why

`ActivityBar.vue` 当前用 6 条 `route.path.startsWith(...)` 硬编码计算 `activeItem`，且 fallback 到 `"task"`——新增/重命名路由时如果忘了同步这段代码，会出现错误高亮或默认归属。同时，`WelcomeView.vue`、`AppHeader.vue` 中散落着 `router.push("/task")`，它们的语义其实是"跳转到默认应用页"而非"跳 task"，但因为没有抽象，所有调用方都把"默认页"这个概念硬编码成了字面量 `/task`。更糟的是，`app-shell-routing/spec.md` 写的是默认重定向到 `/chat`，`project-page-routing/spec.md` 写的是 `/workspace`，而代码实际跳 `/task`——spec 与代码已经三方不一致。这一类漂移再发生一次就会变成静默 bug。

## What Changes

- 新增前端配置 `frontend/src/config/activity-bar.ts`，将 ActivityBar 的菜单项（id、icon、label、path、group、requiresProject、isDefault）集中为单一注册表 `activityBarItems`，作为活动栏菜单与默认应用页的唯一事实来源。
- 新增 composable `frontend/src/composables/useDefaultAppRoute.ts`，对外暴露 `defaultPath` 与 `goToDefault()`，消费方不再手写字面量路径。
- 重构 `ActivityBar.vue`：`items` / `bottomItems` / `activeItem` 全部从注册表派生；`activeItem` 改为"最长 path 前缀匹配"策略，未匹配返回 `null`（不再静默 fallback 到 task），并去除 6 条 `if/startsWith` 硬编码。
- 替换"跳默认应用页"语义的硬编码：`WelcomeView.vue:15`、`WelcomeView.vue:22`、`AppHeader.vue:29` 三处 `router.push("/task")` 改为 `goToDefault()`；`index.vue` 中根路径重定向 `router.replace("/chat")` 同样改为默认页。**不动**业务语义独立的跳转：`task.vue:241`（task→chat 业务桥）、`proposal/index.vue:50`、`proposal/[id].vue:179`（proposal 内部跳转）。
- 修正 spec 文本与实际行为不一致的部分：将 `app-shell-routing` 与 `project-page-routing` 中"重定向到 `/chat`""重定向到 `/workspace`"等具体字面路径，改为"重定向到 ActivityBar 注册表声明的默认应用页"，并约束注册表中恰好一个条目 `isDefault: true`。

## Capabilities

### New Capabilities

无。本次不引入新 capability，所有改动都落在既有 capability 的 spec 修订或纯前端实现细节上。

### Modified Capabilities

- `app-shell-routing`: 修订"根路径根据项目上下文重定向"的目标描述，将硬编码的 `/chat` 改为"ActivityBar 注册表声明的默认应用页"，并新增对默认应用页唯一性的约束。
- `project-page-routing`: 同步修订其中关于根路径重定向目标的描述（原文为 `/workspace`），与 `app-shell-routing` 对齐到同一概念。

## Impact

- **前端代码**：
  - 新增 `frontend/src/config/activity-bar.ts`、`frontend/src/composables/useDefaultAppRoute.ts`
  - 修改 `frontend/src/components/layout/ActivityBar.vue`、`frontend/src/components/welcome/WelcomeView.vue`、`frontend/src/components/layout/AppHeader.vue`、`frontend/src/pages/index.vue`
- **不涉及**：主进程、preload、IPC channel、shared types、存储格式、外部依赖。
- **用户可见行为**：默认应用页当前仍是 `/task`，行为保持不变；唯一可感知差异是当路由不在注册表中时，ActivityBar 不再错误高亮 task 项（之前会，现在保持全部 inactive）。
- **测试影响**：ActivityBar 高亮逻辑与默认页跳转有新单元测试覆盖；其余既有用例不受影响。
