## Context

当前 Desktop App 使用 `vue-router/auto`（unplugin-vue-router）自动路由。路由结构如下：

- `/` → `pages/index.vue`（布局父页面，含 AppLayout + AppHeader + ActivityBar）
- `/welcome` → `pages/welcome.vue`（独立全屏欢迎页，无共享布局）
- `/workspace`, `/pipeline`, `/integration` → `pages/*.vue`（嵌套在布局中）
- `/setting` → `pages/settings.vue`

`pages/index/index.vue` 在 `onMounted` 中根据 `hasCurrentProject` 重定向到 `/workspace` 或 `/welcome`。

问题：

1. `/welcome` 是独立页面，与主应用布局割裂
2. 用户从 welcome 进入 workspace 时布局从无到有
3. `ProjectSwitcher` 中"New Project"跳转到 `/welcome`，顶部栏和侧边栏消失

## Goals / Non-Goals

**Goals:**

- Welcome 内容嵌入主布局，保持布局一致性
- 无项目时显示 WelcomeView，有项目时显示功能页面
- 项目相关页面路由直接放在 `pages/`，对应 `/workspace`、`/pipeline`、`/integration`
- Settings 页面路由改为 `/settings`
- 删除 `/welcome` 独立路由

**Non-Goals:**

- 不改变 WelcomeView 的 UI 设计（仅改变容器）
- 不改变功能页面的业务逻辑
- 不修改 AppLayout、AppHeader、ActivityBar 的视觉设计（仅更新链接）

## Decisions

### Decision: 保留 `pages/index.vue` 作为布局父页面，条件渲染 WelcomeView

**Rationale**: `vue-router/auto` 中 `pages/index.vue` 天然是 `/` 路由的父布局。在其模板中根据 `hasCurrentProject` 条件渲染 `WelcomeView` 或 `RouterView`，是最小改动的方案。项目相关页面（workspace、pipeline、integration）直接放在 `pages/` 根目录下，无需额外的 `pages/project/` 目录层级。

### Decision: Settings 页面路径改为 `/settings`（复数）

**Rationale**: 复数形式更符合 RESTful 和常见惯例，且与现有 spec 中描述一致（spec 中已使用 `/settings`，但代码中是 `/setting`）。

### Decision: "New Project"行为改为清空当前项目而非跳转

**Rationale**: 既然 WelcomeView 已经是布局内组件，不需要路由跳转。`ProjectSwitcher` 中点击"New Project"应调用 `projectStore.clearCurrentProject()`（或类似方法），让 `pages/index.vue` 的条件渲染自动显示 WelcomeView。

### Decision: 删除路由守卫中的 `/welcome` 跳转逻辑

**Rationale**: 无项目时 `pages/index.vue` 直接渲染 WelcomeView，不需要再跳转到 `/welcome`。访问 `/workspace` 等页面时如果无项目，条件渲染会拦截。

### Decision: ActivityBar 在无项目时禁用项目相关导航项

**Rationale**: workspace/pipeline/integration 需要项目上下文。无项目时这些导航项应禁用（`disabled` 状态）或隐藏，避免用户点击后看到空状态。

## Risks / Trade-offs

| Risk                                                     | Mitigation                                     |
| -------------------------------------------------------- | ---------------------------------------------- |
| `typed-router.d.ts` 自动生成的路由类型需要重新生成       | 删除 `.vite` 缓存并重启 dev server             |
| 文件移动后 git 历史丢失                                  | 使用 `git mv` 保留历史                         |
| 硬编码路由路径散落在多处                                 | 本次改动集中更新所有引用，未来考虑提取路由常量 |
| Settings 从 `/setting` 改为 `/settings` 可能影响用户书签 | Desktop App 无浏览器书签问题，可接受           |

## Migration Plan

1. 创建 `WelcomeView.vue` 组件
2. 移动页面文件到新的目录结构
3. 更新所有路由引用
4. 删除旧文件
5. 重启 dev server 重新生成路由类型
6. 手动验证无项目/有项目两种状态下的导航

## Open Questions

- ✅ `projectStore` 已有 `clearCurrentProject()` 方法（`frontend/src/stores/project.ts:118`）。
- ✅ ActivityBar 无项目时：上半部分（workspace/pipeline/integration）禁用，`setting` 不禁用（全局设置无需项目上下文）。
