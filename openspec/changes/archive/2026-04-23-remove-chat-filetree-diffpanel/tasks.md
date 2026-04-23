## 1. 删除组件文件

- [x] 1.1 删除 `frontend/src/components/chat/FileTree.vue`
- [x] 1.2 删除 `frontend/src/components/chat/DiffPanel.vue`

## 2. 修改 Sidebar.vue

- [x] 2.1 移除对 `FileTree` 组件的导入
- [x] 2.2 移除"文件"标签定义及 `UTabs` 切换器，侧边栏直接渲染 `SessionList`
- [x] 2.3 移除对 `chatStore.setSidebarTab` 的调用

## 3. 修改 chat.vue 页面

- [x] 3.1 移除对 `DiffPanel` 组件的导入
- [x] 3.2 将三列布局改为两列布局，删除 DiffPanel 列及其 `v-if` 条件渲染

## 4. 清理 shared/types/chat.ts

- [x] 4.1 删除 `FileNode` 接口
- [x] 4.2 删除 `FileChange` 接口
- [x] 4.3 删除 `DiffLine` 接口
- [x] 4.4 删除 `FileChangeType` 类型
- [x] 4.5 删除 `DiffLineType` 类型
- [x] 4.6 删除 `DiffViewMode` 类型
- [x] 4.7 将 `SidebarTab` 类型简化为 `"sessions"`（移除 `"files"` 值）
- [x] 4.8 从 `Session` 接口中移除 `fileChanges: FileChange[]` 字段

## 5. 清理 frontend/src/stores/chat.ts

- [x] 5.1 移除 `fileTree`、`diffPanelOpen`、`diffPanelFilePath`、`diffViewMode`、`sidebarTab` 状态
- [x] 5.2 移除 `currentFileChange`、`changedFilePaths` 计算属性
- [x] 5.3 移除 `openDiffPanel`、`closeDiffPanel`、`setDiffViewMode`、`toggleDiffPanel`、`setSidebarTab` actions
- [x] 5.4 移除 `generateMockFileTree`、`generateMockDiffLines` mock 函数及其调用
- [x] 5.5 移除 `Session.fileChanges` 相关的 mock 数据赋值

## 6. 更新 OpenSpec 规范

- [x] 6.1 删除 `openspec/specs/file-tree/` 目录（整个 capability）
- [x] 6.2 删除 `openspec/specs/diff-panel/` 目录（整个 capability）
- [x] 6.3 更新 `openspec/specs/chat-interface/spec.md`，移除侧边栏"文件"标签相关需求，应用 change specs 中的 delta

## 8. 清理 Pipeline 相关代码

- [x] 8.1 移除 `CodeStageDetail.vue` 中的 File Changes 展示区块及相关 computed/逻辑
- [x] 8.2 移除 `shared/types/pipeline.ts` 中的 `FileChange`、`FileChangeType`、`DiffLine`、`DiffLineType` 类型定义
- [x] 8.3 从 `StageOutput` 接口中移除 `fileChanges` 字段
- [x] 8.4 移除 `frontend/src/stores/pipeline.mock.ts` 中的 `fileChanges` mock 数据赋值

- [x] 7.1 执行 `pnpm typecheck` 确认无类型错误
- [ ] 7.2 执行 `pnpm lint` 确认无 lint 错误
- [ ] 7.3 执行 `pnpm test` 确认测试通过
