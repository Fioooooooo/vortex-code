## Why

当前 Pipeline 前端页面充斥着大量 mock 数据、模拟运行逻辑（`simulateProgress`）和静态硬编码内容，这些内容会干扰后续与 Electron 主进程进行真实 IPC 联动的重构工作。在接入真实数据层之前，需要先将前端清理到一个干净的骨架结构。

## What Changes

- 移除 `pipeline.mock.ts` 文件（mock 数据生成模块）
- 清理 `pipeline store`：删除 mock 数据初始化、`simulateProgress`/`startSimulation`/`stopSimulation` 逻辑，以及所有依赖 mock 的 action；`sidebarTab` 状态下沉至 `PipelineSidebar.vue` 内部，store 只保留跨组件共享的核心状态
- **大幅删减 Pipeline 组件目录**：`frontend/src/components/pipeline/` 下除 `PipelineSidebar.vue` 外，其余所有组件文件全部删除
- `PipelineSidebar.vue` 精简为仅保留外壳结构：顶部 UTabs 切换器 + 下方空 content div，不再包含 RunList 和 TemplateList
- 更新 `pipeline.vue` 页面，移除对已删除组件（RunDetailView、TemplateEditor、PipelineEmptyState、NewRunModal 等）的引用，main 区域改为空占位
- 保留 Pipeline 页面整体 sidebar + main 两区域布局结构不变
- 保留 `frontend/src/api/pipeline.ts` 不做任何修改

## Capabilities

### New Capabilities

无新功能

### Modified Capabilities

- `pipeline-page`：页面布局结构（sidebar + main 两区域）保留，组件实现大幅清空，以干净骨架等待重构
- `pipeline-runs`：对应组件全部删除，spec 要求暂由重构阶段实现
- `pipeline-templates`：对应组件全部删除，spec 要求暂由重构阶段实现

## Impact

- `frontend/src/stores/pipeline.ts`：大幅精简，移除模拟相关代码；`sidebarTab`/`setSidebarTab` 从 store 移除，下沉为 `PipelineSidebar.vue` 内部状态
- `frontend/src/stores/pipeline.mock.ts`：**删除**
- `frontend/src/components/pipeline/`：**仅保留 `PipelineSidebar.vue`（精简为骨架）**，其余 18 个组件文件全部删除：
  - 删除：RunList、TemplateList、RunDetailView、TemplateEditor、PipelineEmptyState、NewRunModal
  - 删除：StageFlow、StageNode、StageConnector、StageDetailLayout、GateMarker
  - 删除：DiscussStageDetail、CodeStageDetail、TestStageDetail、ReviewStageDetail、DeployStageDetail
  - 删除：StageEditorRow、StageEditorExpanded
- `frontend/src/pages/pipeline.vue`：移除对已删除组件的所有 import 和使用，main 区域改为空占位 div
- `shared/types/pipeline.ts`：不改动
- `frontend/src/api/pipeline.ts`：不改动
