## 1. 删除 Mock 数据模块

- [x] 1.1 删除 `frontend/src/stores/pipeline.mock.ts` 文件

## 2. 清理 Pipeline Store

- [x] 2.1 移除 `pipeline store` 中对 `pipeline.mock.ts` 的 import
- [x] 2.2 将 `templates` 和 `runs` 初始值改为空数组
- [x] 2.3 删除 `simulateProgress`、`startSimulation`、`stopSimulation` 方法及相关定时器变量
- [x] 2.4 删除 store 初始化时的 `startSimulation()` 自动调用
- [x] 2.5 删除 `approveGate`、`rejectGate`、`rerunStage`、`skipStage`、`forcePassStage` 等模拟用 action

## 3. 删除 Pipeline 子组件

- [x] 3.1 删除 `RunList.vue`
- [x] 3.2 删除 `TemplateList.vue`
- [x] 3.3 删除 `RunDetailView.vue`
- [x] 3.4 删除 `TemplateEditor.vue`
- [x] 3.5 删除 `PipelineEmptyState.vue`
- [x] 3.6 删除 `NewRunModal.vue`
- [x] 3.7 删除 `StageFlow.vue`
- [x] 3.8 删除 `StageNode.vue`
- [x] 3.9 删除 `StageConnector.vue`
- [x] 3.10 删除 `StageDetailLayout.vue`
- [x] 3.11 删除 `GateMarker.vue`
- [x] 3.12 删除 `DiscussStageDetail.vue`
- [x] 3.13 删除 `CodeStageDetail.vue`
- [x] 3.14 删除 `TestStageDetail.vue`
- [x] 3.15 删除 `ReviewStageDetail.vue`
- [x] 3.16 删除 `DeployStageDetail.vue`
- [x] 3.17 删除 `StageEditorRow.vue`
- [x] 3.18 删除 `StageEditorExpanded.vue`

## 4. 精简 PipelineSidebar.vue

- [x] 4.1 移除对 `RunList`、`TemplateList` 的 import 和使用
- [x] 4.2 保留 UTabs 切换器（runs / templates 两个 tab）
- [x] 4.3 content 区域改为空 div 占位（`<div class="flex-1" />`）

## 5. 精简 pipeline.vue 页面

- [x] 5.1 移除对 `RunDetailView`、`TemplateEditor`、`PipelineEmptyState`、`NewRunModal` 的所有 import
- [x] 5.2 移除 script 中依赖已删除组件的计算属性和逻辑
- [x] 5.3 main 区域改为空 div 占位，保留 `flex-1` 布局

## 6. 验证

- [x] 6.1 运行 `pnpm typecheck` 全量类型检查通过
- [x] 6.2 运行 `pnpm lint` 无 lint 错误
