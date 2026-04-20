## Why

`/workspace` 路由名称过于泛化，无法准确反映页面的核心功能——与 AI Agent 的聊天交互。`workspace` 一词在开发工具中通常指代"工作区/编辑器"，容易让用户产生这是代码编辑区域的误解。将其重命名为 `/chat` 可以更直观地传达页面用途，降低用户认知成本，与产品"AI 编程助手"的定位保持一致。

## What Changes

- 将前端路由 `/workspace` 重命名为 `/chat`
- 更新路由守卫和重定向逻辑中所有 `/workspace` 引用
- 更新 Activity Bar、AppHeader 等导航组件中的路由链接
- 更新 `workspace-layout` spec 中的路由引用为 `/chat`
- 更新 `app-shell-routing` spec 中的路由引用为 `/chat`
- 重命名 `frontend/src/pages/workspace.vue` 为 `chat.vue`
- 更新 Pinia store 名称 `workspace` → `chat`（或保持内部名称不变，仅更新路由层面）
- 更新组件目录 `components/workspace/` → `components/chat/`

## Capabilities

### New Capabilities

- _(无新能力引入，纯路由重命名)_

### Modified Capabilities

- `workspace-layout`: 路由引用从 `/workspace` 改为 `/chat`，spec 中的场景描述同步更新
- `app-shell-routing`: 路由引用从 `/workspace` 改为 `/chat`，重定向规则和导航高亮逻辑同步更新
- `session-management`: 侧边栏会话列表所在的页面路由上下文从 `/workspace` 改为 `/chat`

## Impact

- 前端路由表 (`typed-router.d.ts` 由 unplugin-vue-router 自动生成)
- `frontend/src/pages/workspace.vue` → `chat.vue`
- `frontend/src/components/workspace/` → `components/chat/`
- `frontend/src/stores/workspace.ts` → `stores/chat.ts`
- AppHeader、ActivityBar、WelcomeView 中的导航链接
- 所有 import 路径引用
- 用户书签/浏览器历史中的 `/workspace` 将失效（需考虑是否需要保留重定向）
