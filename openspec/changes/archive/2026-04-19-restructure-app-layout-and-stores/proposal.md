## Why

当前前端的布局职责和状态职责边界不清晰：`AppLayout` 仍然耦合 Workspace 语义，根路由与欢迎页/工作区的进入规则分散在页面实现里，`project`、`welcome`、`workspace` store 之间也存在项目状态重复与能力混杂的问题。随着 `workspace`、`pipeline`、`extension`、`setting` 等页面继续扩展，这种结构会放大维护成本，因此需要先完成一次路由壳、布局壳和 store 能力边界的收敛。

## What Changes

- 重构文件系统路由，建立 `pages/index.vue` 作为非 welcome 页面共享的父路由壳，子路由包括 `/workspace`、`/pipeline`、`/extension`、`/setting`，并新增 `/` 默认子路由负责入口重定向。
- 将 `AppLayout` 收敛为纯布局组件，只负责 `header`、`side`、`main` 三个区域的结构与插槽，不直接依赖业务 store。
- 调整欢迎页与工作区进入规则：无当前项目时进入 `/welcome`，有当前项目时进入 `/workspace`；欢迎页保持独立，不使用应用壳布局。
- 统一项目上下文能力，将当前项目与项目入口相关行为收敛到单一真相源，移除页面之间重复维护项目状态的方式。
- 收敛 workspace 相关 store 的能力边界，减少单个 store 同时承担布局控制、项目上下文和会话业务的情况。

## Capabilities

### New Capabilities

- `app-shell-routing`: 定义应用入口重定向、非 welcome 页面共享路由壳，以及无项目时的路由访问约束。

### Modified Capabilities

- `workspace-layout`: 将当前仅面向 workspace 的五区布局调整为基于应用壳的共享布局与 workspace 主内容组合。
- `project-switcher`: 调整头部项目切换器与导航区域，使其基于统一项目上下文工作，并与共享应用壳对齐。
- `welcome-page`: 明确欢迎页作为 `/welcome` 独立页面存在，且不渲染共享应用壳。
- `project-creation`: 统一创建项目后的项目上下文写入与进入 `/workspace` 的行为。
- `recent-projects`: 统一最近项目打开后的项目上下文写入与进入 `/workspace` 的行为。

## Impact

- 影响前端页面与路由：`frontend/src/pages/**`
- 影响布局组件与导航组件：`frontend/src/layouts/**`、`frontend/src/components/layout/**`
- 影响项目与工作区状态管理：`frontend/src/stores/project.ts`、`frontend/src/stores/welcome.ts`、`frontend/src/stores/workspace.ts`
- 影响相关类型定义与基于文件路由生成的类型文件
