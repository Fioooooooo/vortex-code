## Why

Chat 页面当前包含文件树（FileTree）和 Diff 面板（DiffPanel）两个功能模块，其数据完全依赖 mock 生成，尚未接入真实后端，且这两个功能的产品方向尚未确定是否继续保留。Pipeline 的 CodeStageDetail 组件也包含基于同一套类型的 file changes / diff 展示逻辑，同样是 mock 数据驱动、无真实后端支撑。在明确方向之前，需要将这些内容从代码库中彻底清除，以减少维护负担、消除死代码。

## What Changes

- **删除** `FileTree.vue` 组件 ✓
- **删除** `DiffPanel.vue` 组件 ✓
- **修改** `Sidebar.vue`：移除"文件"标签及对 `FileTree` 的引用，仅保留"会话"标签 ✓
- **修改** `chat.vue`：移除三列布局中的 DiffPanel 列，改为两列布局（Sidebar + ChatContainer）✓
- **修改** `frontend/src/stores/chat.ts`：移除所有 file tree 和 diff panel 相关状态、计算属性、actions 及 mock 数据生成函数 ✓
- **修改** `shared/types/chat.ts`：移除 `FileNode`、`FileChange`、`DiffLine`、`DiffViewMode`、`SidebarTab`（`"files"` 值）等相关类型；`Session.fileChanges` 字段一并移除 ✓
- **修改** `openspec/specs/chat-interface/spec.md`：移除侧边栏"文件"标签相关需求 ✓
- **删除** `openspec/specs/file-tree/` 目录 ✓
- **删除** `openspec/specs/diff-panel/` 目录 ✓
- **修改** `frontend/src/components/pipeline/CodeStageDetail.vue`：移除 File Changes 展示区块及相关 computed/逻辑
- **修改** `shared/types/pipeline.ts`：移除本地定义的 `FileChange`、`FileChangeType`、`DiffLine`、`DiffLineType` 类型；从 `StageOutput` 中移除 `fileChanges` 字段
- **修改** `frontend/src/stores/pipeline.mock.ts`：移除 mock 数据中的 `fileChanges` 赋值
- IPC 层和 preload 层无相关 channel，无需改动

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `chat-interface`：移除侧边栏"文件"标签及相关交互需求；`SidebarTab` 类型仅保留 `"sessions"`

## Impact

- **已删除文件**：`FileTree.vue`、`DiffPanel.vue`、`openspec/specs/file-tree/`、`openspec/specs/diff-panel/`
- **已修改文件**：`Sidebar.vue`、`chat.vue`、`frontend/src/stores/chat.ts`、`shared/types/chat.ts`、`openspec/specs/chat-interface/spec.md`
- **待修改文件**：`CodeStageDetail.vue`、`shared/types/pipeline.ts`、`frontend/src/stores/pipeline.mock.ts`
- **无 IPC / preload 改动**
- **无外部依赖变化**
