## Context

Vortex Code 是一个基于 Vue 3 + Nuxt 的 IDE 前端应用。当前启动后直接进入空白 Workspace，没有引导用户打开或创建项目的入口。本项目需要实现一个启动页，在没有项目打开时全屏展示，提供品牌标识、操作入口和最近项目历史。

技术栈约束：Vue 3 Composition API、Nuxt 4、Pinia、@nuxt/ui v4、TypeScript。所有与系统交互（如文件选择）暂时通过 store action 中的 mock 实现，未来可接入 Electron IPC。

## Goals / Non-Goals

**Goals:**

- 实现无项目状态下的全屏启动页
- 提供"打开目录"和"创建项目"两个核心操作入口
- 展示最近打开的项目列表，支持打开和移除
- 抽取共享类型到 `src/types`，便于未来与 Electron 层共享
- 使用 @nuxt/ui 组件减少手写样式

**Non-Goals:**

- 不实现真正的文件系统对话框（mock 即可）
- 不实现项目实际创建逻辑（仅模拟流程）
- 不实现 Workspace 内部功能
- 不处理多窗口或会话恢复

## Decisions

**1. 页面作为独立路由还是条件渲染？**

- 选择：条件渲染——在根布局中根据 `projectStore.currentProject` 是否为 null 决定展示 `WelcomePage` 或 `WorkspaceLayout`
- 理由：启动页与 Workspace 是互斥状态，不需要独立路由。条件渲染避免路由切换的复杂度，也符合"无项目上下文"的语义

**2. 数据状态管理：Pinia store 集中管理**

- 选择：使用 `welcomeStore` 管理启动页的所有状态和 mock 数据
- 理由：启动页数据（最近项目列表、创建项目表单状态）与 Workspace 数据生命周期不同，独立 store 更清晰。action 中封装所有"系统交互"，未来替换为 Electron API 时只需修改 store

**3. 类型定义位置：src/types/**

- 选择：`ProjectInfo`、`RecentProject`、`CreateProjectForm` 等类型放在 `src/types/` 下
- 理由：这些类型未来会被 Electron 主进程和渲染进程共享，提前抽离避免重复定义

**4. 创建项目弹窗：内联 Modal 而非独立页面**

- 选择：使用 @nuxt/ui 的 UModal 内联在 WelcomePage 中
- 理由：创建项目是轻量流程，弹窗比页面跳转更符合用户预期，保持启动页的上下文连续性

**5. 最近项目时间显示：相对时间格式化**

- 选择：使用 VueUse 的 `useTimeAgo` 格式化相对时间
- 理由：已有 VueUse 依赖，无需引入新库

**6. 列表滚动策略：列表区域内部滚动**

- 选择：最近项目列表使用 `max-height` + `overflow-y-auto`
- 理由：保持品牌标识和操作按钮始终可见，避免页面级滚动条

## Risks / Trade-offs

- **[Risk]** Mock 数据与真实 Electron API 的接口差异 → **Mitigation**: store action 的签名设计为异步函数，返回 Promise，与真实 IPC 调用模式一致
- **[Risk]** 启动页与后续 Workspace 切换时的状态残留 → **Mitigation**: store 使用独立命名空间，Workspace 挂载时清理欢迎页相关状态
- **[Trade-off]** 使用 @nuxt/ui Modal 的默认动画 vs 自定义 → 接受默认动画，减少自定义 CSS 工作量
