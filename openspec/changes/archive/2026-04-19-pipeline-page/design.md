## Context

项目基于 Vue 3 + Vite + TypeScript 构建，UI 层使用 `@nuxt/ui`，状态管理使用 Pinia setup store，路由使用 file-based routing（typed-router）。已有的 app shell（`AppLayout` + `ActivityBar` + `AppHeader`）为所有项目级页面（`/workspace`、`/pipeline`、`/extension`、`/setting`）提供统一的顶部栏和左侧导航栏。Pipeline 页面路由已预留（`pages/index/pipeline.vue`），当前为空白占位。

Workspace 页面已实现了类似的左侧面板 + 中央主区域布局模式，Pipeline 页面将遵循相同的布局约定，但主区域不使用右侧 Diff 面板，空间全部留给中央内容。

## Goals / Non-Goals

**Goals:**

- 提供完整的 Pipeline 页面，支持运行记录管理和模板管理
- 实现阶段流可视化（进度条、节点状态、连线状态、门控标记）
- 实现五种阶段类型的详情内容展示
- 实现模板编辑视图，支持阶段增删改、拖拽排序、配置编辑
- 所有数据通过 store action + mock 数据管理，类型定义统一在 `src/types/pipeline.ts`
- 使用 `@nuxt/ui` 原生组件和语义化颜色系统，实现深浅主题和多断点兼容
- 图标统一使用 lucide

**Non-Goals:**

- 后端 API 真实对接（本次全部使用 mock 数据）
- 实际的 agent 执行引擎集成（仅前端模拟状态和进度）
- 引入重量级流程图/图表库（阶段流使用轻量自定义组件实现）
- 跨项目模板共享（模板作用域限定在当前项目）

## Decisions

### 1. 复用现有 App Shell，不新增布局层

Pipeline 页面直接复用 `AppLayout` 和 `ActivityBar`，`ActivityBar` 的 `activeItem` 通过路由自动识别为 `pipeline`。左侧面板使用与 Workspace Sidebar 相同的 260px 宽度，保持视觉统一。

**替代方案：** 为 Pipeline 单独创建一个布局组件。拒绝原因：与现有设计体系不一致，增加维护成本。

### 2. 左侧面板采用 tab 切换模式

左侧面板通过顶部 tab 在 "Runs" 和 "Templates" 之间切换，与 Workspace Sidebar 的 "Sessions" / "Files" tab 模式保持一致。

### 3. Pipeline Store 采用 Pinia Setup Store 模式

与 `projectStore`、`workspaceStore` 保持一致，使用 `defineStore("pipeline", () => { ... })` 的 setup store 写法。所有数据初始化为 mock 数据，通过 `generateMockXxx` 函数生成。

### 4. 阶段拖拽排序使用原生 HTML5 Drag and Drop

模板编辑中的阶段排序使用原生 HTML5 DnD API，不引入额外依赖。若交互体验不足，后续可迁移至 `@vueuse/useSortable`。

**替代方案：** 引入 `@vueuse/useSortable` 或 `vuedraggable`。拒绝原因：减少依赖，当前排序交互简单，原生 DnD 足够。

### 5. 阶段进度条使用纯 CSS + 组件化实现

不使用第三方流程图库。每个阶段节点为一个组件，连线使用伪元素或独立 div 实现。状态变化通过 class 绑定和 CSS transition 处理。

**替代方案：** 引入 `vueflow` 或 `x6`。拒绝原因：过重，Pipeline 的阶段流是严格的线性流程，不需要通用图编辑能力。

### 6. Prompt 模板变量高亮使用简单正则替换

模板编辑中的 `{{variable}}` 语法高亮通过正则匹配后渲染为带背景色的 span，不引入 Monaco/CodeMirror 等编辑器。

### 7. 类型定义放在 `src/types/pipeline.ts`

所有 Pipeline 相关类型集中定义，便于未来与 Electron 主进程共享类型。

### 8. 运行状态实时反馈基于定时器模拟

由于无真实后端，运行中的状态更新通过 store 内部的 `setInterval` 模拟进度推进，时间间隔可配置以方便演示。

## Risks / Trade-offs

- **[Risk]** 阶段进度条自定义组件在不同断点下的自适应可能复杂 → **Mitigation** 使用 flex 布局，节点宽度自适应，移动端可考虑横向滚动或垂直折叠
- **[Risk]** mock 数据量大导致 proposal 阶段的类型定义和 store 文件膨胀 → **Mitigation** 将 mock 生成器抽取到独立的 `src/stores/pipeline.mock.ts` 文件
- **[Risk]** 模板编辑的 Prompt 多行文本区域用户体验不如专业编辑器 → **Mitigation** 使用 `@nuxt/ui` 的 `UTextarea` 组件，后续可升级
- **[Risk]** 五种阶段类型的详情展示内容差异大，组件可能过度碎片化 → **Mitigation** 使用统一的 `StageDetailLayout` 框架组件，内部通过条件渲染不同的内容子组件
