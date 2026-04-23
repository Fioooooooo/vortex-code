## Context

Chat 页面当前为三列布局：左侧 Sidebar（含 Sessions/Files 两个标签）、中央 ChatContainer、右侧 DiffPanel（条件渲染）。FileTree 和 DiffPanel 的数据完全由前端 mock 生成，未接入任何 IPC 或后端服务。相关类型定义散布在 `shared/types/chat.ts` 中，store 中存在大量 mock 生成逻辑。

## Goals / Non-Goals

**Goals:**

- 删除 `FileTree.vue` 和 `DiffPanel.vue` 两个组件
- 从 `Sidebar.vue` 移除"文件"标签，仅保留"会话"标签
- 将 `chat.vue` 从三列布局简化为两列布局（Sidebar + ChatContainer）
- 清理 `chat.ts` store 中所有 file tree / diff panel 相关状态、计算属性、actions 和 mock 函数
- 清理 `shared/types/chat.ts` 中相关类型（`FileNode`、`FileChange`、`DiffLine`、`DiffViewMode`、`SidebarTab` 的 `"files"` 值、`Session.fileChanges`）
- 更新 `chat-interface` spec，删除 `file-tree` 和 `diff-panel` spec 目录

**Non-Goals:**

- 不涉及 IPC channel 或 preload API 的改动（当前无相关 channel）
- 不重新设计 chat 页面布局
- 不引入任何新功能或新依赖

## Decisions

**决策 1：直接删除，不做功能降级或保留开关**

这两个功能完全基于 mock 数据，无真实后端支撑，产品方向未定。直接删除比保留死代码更干净，也不存在需要迁移的用户数据。

**决策 2：`SidebarTab` 类型简化为字面量 `"sessions"`，不保留联合类型**

移除 `"files"` 后，`SidebarTab` 只剩一个值。可以直接将类型改为 `"sessions"` 字面量，或直接内联为 `string`。选择保留 `SidebarTab = "sessions"` 以维持类型语义，便于未来扩展。

**决策 3：`Session.fileChanges` 字段一并移除**

`fileChanges` 字段类型为 `FileChange[]`，`FileChange` 是被删除的类型之一。移除该字段可保持类型一致性，避免孤立引用。

## Risks / Trade-offs

- [风险] 遗漏引用导致编译错误 → 删除后执行 `pnpm typecheck` 验证，确保无残留引用
- [风险] `SidebarTab` 类型变更影响其他引用点 → 全局搜索 `SidebarTab` 和 `sidebarTab` 确认影响范围
