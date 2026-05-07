# proposal-detail Specification

## Purpose

定义 Proposal 详情页能力，包括独立详情路由、顶部基础信息展示，以及 proposal/design/tasks markdown 文件的 tab 渲染。

## Requirements

### Requirement: Proposal detail page has independent route

系统 SHALL 为 proposal 详情提供独立路由 `/proposal/:id`，其中 id 为 change 目录名。

#### Scenario: Navigate to detail

- **WHEN** 用户点击列表中的 proposal 卡片
- **THEN** 路由跳转至 `/proposal/:id`
- **AND** 页面展示该 proposal 的详情

#### Scenario: Back navigation

- **WHEN** 用户点击详情页的返回按钮
- **THEN** 路由返回 `/proposal` 列表页

### Requirement: Proposal detail header shows basic info

详情页顶部 SHALL 展示：proposal 标题、状态 badge、创建日期、任务完成进度。

状态 badge 的显示规则：

- `draft`：默认状态，显示"草稿"
- `creating`：显示"创建中"
- `applying`：显示"实施中"（高亮色）
- `archived`：显示"已归档"

#### Scenario: Header renders metadata

- **WHEN** 用户进入详情页
- **THEN** 顶部显示标题、状态 badge、日期和任务进度

#### Scenario: applying 状态的 badge

- **WHEN** proposal 的 status 为 `applying`
- **THEN** 状态 badge 显示"实施中"，使用高亮色（primary 色）

### Requirement: Proposal detail renders markdown files as tabs

详情页 SHALL 以 tab 形式渲染 proposal.md、design.md、tasks.md，顺序固定为 Proposal → Design → Tasks。文件不存在时不渲染对应 tab。

#### Scenario: All three files exist

- **WHEN** change 目录下存在 proposal.md、design.md、tasks.md
- **THEN** 详情页显示三个 tab

#### Scenario: design.md missing

- **WHEN** change 目录下不存在 design.md
- **THEN** 详情页只显示 Proposal 和 Tasks 两个 tab

#### Scenario: Tab content renders markdown

- **WHEN** 用户切换到某个 tab
- **THEN** 对应 markdown 文件内容以渲染格式展示

### Requirement: 详情页提供 apply 触发入口

详情页 SHALL 在 `status === "draft"` 时显示"开始实现"按钮（已有实现），点击后弹出 workflow 选择菜单，选择后触发 `useProposalRunStore.startRun(projectId, changeId, workflowId)`。

#### Scenario: 选择 workflow 后触发 apply

- **WHEN** 用户在"开始实现"下拉菜单中选择一个 workflow
- **THEN** 调用 `useProposalRunStore.startRun(projectId, changeId, workflowId)`
- **AND** SidePanel 自动打开
- **AND** 按钮变为不可点击状态（`isStreaming === true`）

#### Scenario: applying 状态时不显示"开始实现"按钮

- **WHEN** `proposal.status === "applying"`
- **THEN** "开始实现"按钮不显示（已有实现：`v-if="proposal.status === 'draft'"`）

### Requirement: 详情页提供 archive 入口

详情页 SHALL 在 `status === "applying"` 且 apply run 已完成时显示"归档"按钮；点击后触发归档流程。

#### Scenario: apply run completed

- **WHEN** proposal.status 为 `applying` 且 apply run 的状态为 `done`
- **THEN** header 显示"归档"按钮
- **AND** 点击按钮触发 archive IPC

#### Scenario: apply run still running

- **WHEN** proposal.status 为 `applying` 但 apply run 的状态不是 `done`
- **THEN** header 不显示"归档"按钮

### Requirement: SidePanel 展示 apply run 的实时日志

详情页 SidePanel SHALL 展示来自 `useProposalRunStore` 的 `UIMessage[]`，复用 chat 页面的 markdown 渲染组件（`ChatContainer` 或其子组件）渲染消息内容。

#### Scenario: 实时展示 chunk

- **WHEN** stage stream 正在运行，main 进程推送 chunk
- **THEN** SidePanel 实时更新，展示最新的 assistant 消息内容（text 和 tool call）

#### Scenario: 展示历史日志

- **WHEN** `resumeRun` 完成，从磁盘加载了历史 `UIMessage[]`
- **THEN** SidePanel 展示完整的历史消息列表

### Requirement: 页面 onMounted 自动恢复 applying 状态的 run

`[id].vue` 的 `onMounted` SHALL 在 proposal 加载完成后，检测 `status === "applying"`，自动调用 `useProposalRunStore.resumeRun(projectId, changeId)`。

#### Scenario: onMounted 检测到 applying 状态

- **WHEN** 用户打开 proposal 详情页，proposal.status 为 `applying`
- **THEN** 自动调用 `resumeRun`
- **AND** SidePanel 自动打开，展示历史日志
