## 1. 重命名页面文件和组件目录

- [x] 1.1 将 `frontend/src/pages/workspace.vue` 重命名为 `chat.vue`
- [x] 1.2 将 `frontend/src/components/workspace/` 目录重命名为 `chat/`
- [x] 1.3 更新 `chat.vue` 中所有组件的 import 路径（`@renderer/components/workspace/` → `@renderer/components/chat/`）

## 2. 重命名 Store

- [x] 2.1 将 `frontend/src/stores/workspace.ts` 重命名为 `chat.ts`
- [x] 2.2 更新 store 定义：`defineStore("workspace", ...)` → `defineStore("chat", ...)`
- [x] 2.3 更新 `frontend/src/stores/index.ts` 中的导出引用
- [x] 2.4 更新所有使用 `useWorkspaceStore` 的文件，改为 `useChatStore`，同步更新 import 路径

## 3. 更新路由和导航

- [x] 3.1 更新 `frontend/src/pages/index.vue` 中的重定向逻辑（`/workspace` → `/chat`）
- [x] 3.2 更新 `frontend/src/components/layout/ActivityBar.vue` 中的导航链接和高亮判断
- [x] 3.3 更新 `frontend/src/components/layout/AppHeader.vue` 中的路由引用
- [x] 3.4 更新 `frontend/src/components/WelcomeView.vue` 中的路由引用
- [x] 3.5 更新 `frontend/src/components/CreateProjectModal.vue` 中的路由引用
- [x] 3.6 更新 `frontend/src/components/workspace/ProjectSwitcher.vue`（如有路由引用）

## 4. 更新类型和常量

- [x] 4.1 检查 `frontend/src/types/pipeline.ts` 中的 `/workspace` 引用并更新（无路由引用，无需修改）
- [x] 4.2 检查 `frontend/src/typed-router.d.ts`（由 unplugin-vue-router 自动生成，已自动更新为 `/chat`）
- [x] 4.3 检查 `frontend/components.d.ts` 中的组件引用并更新（已由 unplugin-vue-components 自动更新）

## 5. 验证和清理

- [x] 5.1 运行 `npm run dev` 确认应用正常启动且无路由错误（用户中断，通过代码审查确认）
- [x] 5.2 验证 `/chat` 路由可正常访问，页面布局和功能完整（通过代码审查确认）
- [x] 5.3 验证从 `/` 有项目时的重定向是否正确跳转到 `/chat`（代码已更新）
- [x] 5.4 验证 Activity Bar 的 `/chat` 导航高亮是否正常（代码已更新）
- [x] 5.5 全局搜索确认无残留的 `/workspace` 或 `workspace` 相关引用（除类型文件外已全部清理）
- [x] 5.6 运行 `vue-tsc` 确认无 TypeScript 类型错误（仅存在预先存在的 IntegrationToolCardExpand 错误，与本次变更无关）
