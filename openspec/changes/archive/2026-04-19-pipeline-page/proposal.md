## Why

Vortex Code 的核心目标是实现"无人工介入"的软件交付。Pipeline 页面是实现这一目标的核心编排界面——它将需求从讨论到部署的全过程编排为可配置的阶段流，让用户可以监控进度、设置门控条件，并在必要时介入。当前项目已具备 Workspace（对话、文件浏览、Diff 审查）和项目管理能力，但缺少将这一切串联为自动化工作流的编排层。

## What Changes

- 新增 `/pipeline` 页面路由与视图，作为项目级自动化工作流编排中心
- 新增 Pipeline 运行记录（Run）管理：创建运行、列表展示、状态监控、详情查看
- 新增流水线模板（Template）管理：内置模板展示、自定义模板创建/编辑/复制/删除
- 新增阶段流可视化组件：横向进度条、节点状态、连线状态、门控标记
- 新增阶段详情视图：需求讨论、代码编写、单元测试、代码审查、部署五种阶段类型的内容展示
- 新增模板编辑视图：阶段拖拽排序、阶段配置（Prompt、Agent、门控、失败策略、MCP/Skills）
- 新增相关 Pinia store（pipeline store）和类型定义（`src/types/pipeline.ts`）
- 新增运行状态实时反馈机制（模拟，基于 mock 数据）

## Capabilities

### New Capabilities

- `pipeline-page`: Pipeline 页面整体结构与路由集成
- `pipeline-runs`: Pipeline 运行记录的创建、列表、状态监控与详情查看
- `pipeline-templates`: Pipeline 模板的展示、创建、编辑、复制、删除与阶段编排
- `pipeline-stage-visualization`: 阶段流可视化（进度条、节点状态、连线、门控标记）
- `pipeline-stage-details`: 各阶段类型（Discuss/Code/Test/Review/Deploy）的详情内容展示

### Modified Capabilities

<!-- Pipeline 页面复用已有的 app-shell-routing 和 workspace-layout 能力，不修改现有 spec 的需求定义 -->

## Impact

- 前端：新增 `pages/pipeline.vue` 及多个组件，复用现有的 app shell 布局和左侧面板结构
- 状态管理：新增 `stores/pipeline.ts`，所有数据交互（含 mock）通过 store action 完成
- 类型系统：新增 `src/types/pipeline.ts`，定义 Pipeline 相关类型，便于未来与 Electron 层共享
- UI 组件：大量使用 `@nuxt/ui` 原生组件，遵循语义化颜色系统（primary/secondary/error/warning/success 等）
- 图标：统一使用 `lucide` 图标库
- 主题/断点：依赖 `@nuxt/ui` 组件的默认行为实现深浅主题和多断点兼容
