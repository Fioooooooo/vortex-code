## Why

当前 `/welcome` 是独立的全屏页面，无顶部栏和侧边栏。用户从 welcome 进入 `/workspace` 时布局从无到有，体验割裂。`ProjectSwitcher` 中点击"New Project"会跳转到 `/welcome`，导致顶部栏和侧边栏消失，破坏导航连续性。

## What Changes

- **删除**独立的 `/welcome` 路由和页面
- **新增** `WelcomeView` 组件，嵌入主布局的内容区，无项目时居中显示
- **修改** `pages/index.vue`：无项目时渲染 `WelcomeView`，有项目时渲染 `RouterView`
- **移动** workspace/pipeline/integration 页面从 `pages/index/` 到 `pages/`，路由变为 `/workspace`、`/pipeline`、`/integration`
- **移动** setting 页面到 `pages/settings.vue`，路由变为 `/settings`
- **删除** `pages/index/index.vue` 重定向页
- **更新** `ActivityBar`、`AppHeader`、`ProjectSwitcher`、`CreateProjectModal` 中的路由引用
- **更新** 路由守卫逻辑，移除 `/welcome` 相关跳转

## Capabilities

### New Capabilities

- `layout-welcome-integration`: 将 welcome 内容作为组件嵌入主布局，保持布局一致性
- `project-page-routing`: 项目相关页面路由直接放在 `/workspace`、`/pipeline`、`/integration`

### Modified Capabilities

- `app-shell-routing`: 路由结构变更，`/welcome` 删除，`/setting` 改为 `/settings`，项目页面路由为 `/workspace`、`/pipeline`、`/integration`
- `welcome-page`: 从独立页面降级为布局内组件，行为变更（不再全屏，保留顶部栏和侧边栏）
- `settings-page`: 路由路径从 `/setting` 改为 `/settings`
- `project-creation`: 创建成功后的跳转目标保持 `/workspace`
- `recent-projects`: 打开项目后的跳转目标保持 `/workspace`
- `project-switcher`: "New Project"行为从跳转到 `/welcome` 改为清空当前项目并显示 WelcomeView

## Impact

- `frontend/src/pages/` 目录结构重组
- `frontend/src/components/layout/ActivityBar.vue` 导航链接更新
- `frontend/src/components/layout/AppHeader.vue` 下拉菜单跳转更新
- `frontend/src/components/workspace/ProjectSwitcher.vue` "New Project"逻辑变更
- `frontend/src/components/CreateProjectModal.vue` 跳转路径更新
- `typed-router.d.ts` 需要重新生成（vue-router/auto 自动路由）
