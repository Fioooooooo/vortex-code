## Context

当前应用使用 `/workspace` 作为 AI Agent 聊天交互页面的路由。该页面包含会话列表、聊天区域、文件树和 Diff 面板，核心功能是用户与 AI Agent 的对话交互。`workspace` 一词过于宽泛，未能准确传达"聊天/对话"的核心体验。

## Goals / Non-Goals

**Goals:**

- 将路由从 `/workspace` 重命名为 `/chat`，使 URL 与页面功能一致
- 同步更新所有内部引用（组件、store、导航链接、spec）
- 保持现有功能和行为完全不变

**Non-Goals:**

- 不改变任何 UI 布局或交互逻辑
- 不引入新功能
- 不修改 API 接口

## Decisions

**1. 保留 `/workspace` 到 `/chat` 的临时重定向**

- 理由：避免用户书签和浏览器历史失效
- 替代方案：直接删除旧路由（用户体验差）

**2. 同时重命名文件和目录（workspace → chat）**

- 理由：保持代码与路由名称一致，避免未来维护困惑
- 替代方案：只改路由不改文件名（会留下技术债务）

**3. Store 名称从 `workspace` 改为 `chat`**

- 理由：`useWorkspaceStore` 在 `/chat` 路由下语义不匹配
- 替代方案：保持 `useWorkspaceStore`（但会长期造成认知不一致）

## Risks / Trade-offs

- **[Risk]** 大量文件重命名可能导致 git 历史追踪断裂 → **Mitigation**: 使用 `git mv` 进行重命名，保留历史关联
- **[Risk]** 开发中的分支可能存在冲突 → **Mitigation**: 建议在合并冲突较少时执行，或提前通知团队
- **[Risk]** 用户已保存的 `/workspace` 链接失效 → **Mitigation**: 保留重定向规则，至少持续一个版本周期
