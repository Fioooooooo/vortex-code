## Context

当前前端已经具备 welcome 页面和 workspace 页面，但页面结构是在功能逐步叠加中形成的。现状存在几个架构问题：

- `AppLayout` 名义上是基础布局，实际上仍直接渲染 Workspace 语义组件，导致布局壳与业务壳混在一起。
- `/` 入口判断、欢迎页展示和工作区进入逻辑散落在页面组件中，没有形成明确的路由层分工。
- `projectStore`、`welcomeStore`、`workspaceStore` 对项目上下文的职责边界不清晰，当前项目与项目列表存在重复维护的风险。
- `workspaceStore` 同时承担项目信息、会话、消息流、Diff 面板、侧边栏 UI 等多类职责，已经接近“全局状态桶”。

本次变更需要在不改变现有技术栈的前提下，完成一次结构性收敛，为后续增加 `pipeline`、`extension`、`setting` 等页面提供稳定骨架。

## Goals / Non-Goals

**Goals:**

- 建立基于文件系统路由的父子路由结构，让非 welcome 页面共享统一应用壳。
- 将 `AppLayout` 收敛为纯展示布局，只定义 `header`、`side`、`main` 三个插槽区域。
- 将 `/` 入口判断收敛到专门的默认子路由或路由守卫，不让 `App.vue` 承担业务跳转职责。
- 统一当前项目的状态来源，让项目选择、打开、创建之后都写入同一个项目上下文。
- 缩小 `workspaceStore` 的职责范围，使其专注于工作区会话与工作区 UI，而不是同时承担项目入口能力。

**Non-Goals:**

- 不引入新的路由库、状态库或持久化依赖。
- 不在本次变更中接入真实 Electron IPC 或文件系统能力，仍允许保留 mock 数据与 mock 行为。
- 不在本次变更中实现 `pipeline`、`extension`、`setting` 的完整业务页面，只需要建立可扩展的路由与布局承载结构。
- 不在本次变更中做视觉重设计，重点是结构和职责收敛。

## Decisions

### 1. 使用路由父页面承接共享布局，而不是让 `App.vue` 直接承接业务布局

**决策**：保留 `App.vue` 作为应用根组件，只承载全局 provider 和单个 `<RouterView />`。新增 `pages/index.vue` 作为非 welcome 页面共享的父路由页面，在这里组合 `AppLayout` 与子路由 `<RouterView />`。

**原因**：

- `App.vue` 应保持为应用根容器，不应根据页面业务规则决定布局差异或做重定向。
- 共享布局属于路由层职责，父路由页面是与文件系统路由最契合的表达方式。
- welcome 页是少数不使用应用壳的页面，若将布局逻辑直接放进 `App.vue`，将迫使根组件引入基于路由的条件分支。

**替代方案**：

- 将布局直接放在 `App.vue` 并根据当前路由条件渲染。拒绝原因：根组件会开始耦合欢迎页与业务页面的差异，后续路由变多后会继续膨胀。
- 让 `AppLayout` 自己直接渲染 `<RouterView />`。拒绝原因：纯布局组件不应直接承担路由职责，插槽模式更清晰。

### 2. `AppLayout` 只保留结构与插槽，不直接依赖 store

**决策**：`AppLayout` 只提供 `header`、`side` 和默认插槽，不直接导入 `AppHeader`、`ActivityBar` 或任何业务 store。

**原因**：

- 布局壳应该可复用、可替换，不应隐含 Workspace 业务语义。
- 这样 `workspace`、`pipeline`、`extension`、`setting` 等页面可以共享同一壳，而各自决定 header/side 的具体内容。
- 插槽比在布局组件内硬编码 `RouterView` 或业务组件更符合职责分离。

**替代方案**：

- 继续让 `AppLayout` 内置 `AppHeader` 和 `ActivityBar`。拒绝原因：布局组件会继续依赖项目状态与 workspace 状态，无法成为真正的共享壳。

### 3. 使用 `projectStore` 作为当前项目的单一真相源

**决策**：把当前项目上下文、可切换项目列表、打开项目、创建项目、选择最近项目后的上下文写入都收敛到 `projectStore` 或围绕 `projectStore` 的能力层；`welcomeStore` 不再负责项目领域状态的真相维护。

**原因**：

- “当前项目”是跨欢迎页、共享应用壳和工作区页面的共同前提，不应分散在多个 store 中。
- 路由入口判断、头部项目展示、项目切换都依赖相同的上下文。
- 统一真相源后，欢迎页、头部切换器和子路由守卫可以共享同一种状态判断方式。

**替代方案**：

- 保留 `welcomeStore` 写当前项目、`workspaceStore` 再维护一套 `activeProject`。拒绝原因：会出现同一业务语义对应多个状态源，容易导致显示与实际进入上下文不一致。

### 4. 收敛 store 能力边界：项目、欢迎页 UI、工作区状态分层

**决策**：

- `projectStore` 负责项目上下文与项目入口相关动作。
- `welcomeStore` 只负责 welcome 页局部 UI 状态，例如创建项目弹窗显隐。
- `workspaceStore` 聚焦工作区会话、消息流、Diff、侧边栏、当前 agent 与 token 等工作区运行状态。

**原因**：

- 这次重构的目标不是把所有状态拆成大量小 store，而是先把明显跨域的能力分开。
- `workspaceStore` 保留工作区内部高耦合状态是合理的，但不应继续管理项目入口与项目真相源。
- `welcomeStore` 留作页面 UI store，可以减少欢迎页组件和路由层之间的直接状态耦合。

**替代方案**：

- 一次性将 `workspaceStore` 拆成多个更小 store。暂不采用：会扩大本次变更范围，且当前页面复杂度还不足以证明必须进行更细粒度拆分。

### 5. 入口重定向使用默认子路由，并为项目页增加访问保护

**决策**：在 `pages/index/index.vue` 中处理 `/` 入口的项目上下文判断，同时为 `/workspace`、`/pipeline`、`/extension`、`/setting` 这些项目页增加统一的无项目访问保护。

**原因**：

- `/` 的入口判断应只在默认入口页面发生，不应污染父布局页。
- 用户可能直接访问某个项目页，因此除了 `/` 的默认重定向，还需要额外的路由访问保护。
- 这样既满足用户进入 `/` 的默认流，也能覆盖深链接访问。

**替代方案**：

- 只在 `/` 入口做一次跳转。拒绝原因：无法覆盖用户直接访问 `/workspace` 等路径的情况。

## Risks / Trade-offs

- [Risk] 路由目录重排会影响现有 typed routes 与页面导入路径 → Mitigation: 完成重构后运行 `vue-tsc` 并验证生成的路由类型文件已同步更新。
- [Risk] 项目上下文从多个 store 收敛到单一真相源时，容易遗漏组件依赖 → Mitigation: 先按依赖面梳理所有 `useProjectStore`、`useWelcomeStore`、`useWorkspaceStore` 的使用点，再逐步迁移。
- [Risk] `workspaceStore` 收敛后，某些组件可能暂时需要跨 store 读取数据 → Mitigation: 允许组件在过渡期同时读取 `projectStore` 和 `workspaceStore`，但禁止继续新增重复项目状态。
- [Risk] `pipeline`、`extension`、`setting` 初期只是占位页面，可能导致布局已建好但页面内容为空 → Mitigation: 明确占位页的最低可用状态，例如显示标题与“Coming soon”空态，确保导航链路完整。

## Migration Plan

1. 新建父子路由目录结构，保留 `App.vue` 不承接业务布局。
2. 将 `AppLayout` 改为纯插槽布局，并将共享 header/side 的组合移动到 `pages/index.vue`。
3. 将原 `workspace` 页面迁移到 `pages/index/workspace.vue`，并新增 `pipeline`、`extension`、`setting` 占位页。
4. 将 `/` 的判断迁移到 `pages/index/index.vue`，并补充项目页访问保护。
5. 收敛 store：项目相关能力统一到 `projectStore`，`welcomeStore` 仅保留 welcome 页 UI 状态，`workspaceStore` 删除重复项目真相源。
6. 运行类型检查与必要测试，验证路由、布局和项目入口流程。

本次变更只影响前端结构，无需数据迁移，也不存在服务端回滚步骤。若需要回退，可回到旧的页面目录与 store 实现。

## Open Questions

- 项目切换器中的“项目列表”最终是否应完全由 `projectStore` 提供，还是后续由真实后端/本地索引服务驱动，目前先按 `projectStore` mock 数据处理。
- `pipeline`、`extension`、`setting` 是否需要在无项目时可访问，目前本设计按“属于项目作用域页面，因此都需要当前项目”处理。
