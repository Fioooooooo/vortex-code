## 1. 路由结构重构

- [x] 1.1 将 `frontend/src/pages` 重构为 `pages/index.vue`、`pages/index/index.vue`、`pages/index/workspace.vue`、`pages/index/pipeline.vue`、`pages/index/extension.vue`、`pages/index/setting.vue`、`pages/welcome.vue`
- [x] 1.2 在 `pages/index.vue` 中实现非 welcome 页面共享的父路由壳，并在主区域渲染子路由
- [x] 1.3 在 `pages/index/index.vue` 中实现 `/` 入口重定向：无当前项目进入 `/welcome`，有当前项目进入 `/workspace`
- [x] 1.4 为 `/workspace`、`/pipeline`、`/extension`、`/setting` 增加无当前项目时重定向到 `/welcome` 的访问保护

## 2. 布局与导航收敛

- [x] 2.1 将 `frontend/src/layouts/AppLayout.vue` 收敛为纯布局组件，只保留 `header`、`side` 与默认插槽
- [x] 2.2 将共享 header 与 activity bar 的组合移动到父路由页面，而不是布局组件内部
- [x] 2.3 调整 `frontend/src/components/layout/AppHeader.vue` 与 `frontend/src/components/layout/ActivityBar.vue` 的输入输出接口，使其不依赖布局内部的隐式行为
- [x] 2.4 为 `pipeline`、`extension`、`setting` 建立可在共享布局中渲染的占位页面

## 3. 项目上下文与欢迎页 store 收敛

- [x] 3.1 将当前项目、项目列表和项目入口动作统一收敛到 `frontend/src/stores/project.ts`
- [x] 3.2 从 `frontend/src/stores/welcome.ts` 中移除项目领域状态与项目入口真相源，仅保留 welcome 页局部 UI 状态
- [x] 3.3 更新 `frontend/src/pages/welcome.vue` 与 `frontend/src/components/CreateProjectModal.vue`，改为通过统一项目上下文能力执行打开项目、创建项目与最近项目进入逻辑
- [x] 3.4 调整最近项目与项目创建相关类型定义，确保 welcome 页面、项目上下文与后续路由跳转使用一致的数据结构

## 4. Workspace store 与页面迁移

- [x] 4.1 从 `frontend/src/stores/workspace.ts` 中移除重复的项目真相源，保留工作区会话、消息流、Diff 面板、侧边栏与 agent 运行状态
- [x] 4.2 更新 `frontend/src/components/layout/AppHeader.vue`、`frontend/src/components/workspace/ProjectSwitcher.vue` 等组件，使项目展示与切换从统一项目上下文读取
- [x] 4.3 将原 `workspace` 页面的主体结构迁移到 `frontend/src/pages/index/workspace.vue`，保持 Sidebar、ChatArea、DiffPanel 的行为不变
- [x] 4.4 校正 Workspace 相关组件对 `workspaceStore` 的依赖面，避免继续新增跨 welcome/project/workspace 的混合职责

## 5. 验证与收尾

- [x] 5.1 更新受本次重构影响的测试、类型或路由文件引用
- [x] 5.2 运行前端类型检查，确认文件路由、store 收敛与组件依赖调整后无 TypeScript 错误
- [x] 5.3 手动验证关键链路：`/` 入口跳转、`/welcome` 展示、创建项目进入 `/workspace`、最近项目进入 `/workspace`、无项目访问项目页时重定向
