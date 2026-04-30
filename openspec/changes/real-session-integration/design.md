## Context

当前 change 已经把 session 列表、历史消息加载、标题更新、agentId 持久化等主链路打通，但对"新建 Session"的定义仍然是点击按钮立即创建并落盘一个空 session。这会带来两个问题：

1. 用户会看到尚未开始对话的空白 session 条目，语义上更像"占位记录"而不是"会话"
2. 当 session 还不存在时，前端无法自然地表达 agent 选择，只能在 store 中硬编码默认 `agentId`

本次 proposal 更新将这些行为改为**草稿态 + 首条消息懒创建**。

## Goals / Non-Goals

**Goals:**

- 点击"新建 Session"时进入空白草稿态，而不是立即创建磁盘文件
- 在草稿态发送第一条消息时，懒创建并持久化 session
- 在无 active session 时，agent 选择器仍可工作，并绑定到响应式草稿态 agent
- 保持已有的真实 session 列表、历史消息加载、重命名、删除、标题推送更新能力

**Non-Goals:**

- 草稿态跨应用重启持久化
- session 分页 / 搜索 / 归档
- ACP `session/load` 历史重放

## Decisions

### 决策 1：New Session 按钮只进入草稿态

点击"新建 Session"后：

- `activeSessionId` 设为 `null`
- session 列表不新增条目
- 不调用 `chat:createSession`
- ChatContainer 显示无历史消息的空白输入态

这样"我要开始一个新对话"和"我已经创建了一个空会话记录"被区分开了。

### 决策 2：草稿态单独维护 `draftAgentId`

当没有 active session 时，agent 不再从 `activeSession.agentId` 派生，而是由独立的响应式 `draftAgentId` 表示。`ChatAgentSelect` 的绑定规则变为：

- 有 active session：读写 `activeSession.agentId`
- 无 active session：读写 `draftAgentId`

### 决策 3：`draftAgentId` 不允许硬编码默认值

草稿态默认 agent 必须从已安装 ACP agent 集合中解析，而不是在 session store 内写死 `"claude-acp"`。

建议规则：

- 优先复用当前 `draftAgentId`（若仍然存在且已安装）
- 否则选择当前已安装 agent 列表中的第一个
- 若没有任何已安装 agent，则 `draftAgentId = null`，发送首条消息时阻止创建 session 并提示用户先安装 agent

`ChatAgentSelect` 本身不提供硬编码 fallback。其显示值只允许来自以下两类来源：

- 当前 active session 的持久化 `agentId`
- 草稿态当前有效的 `draftAgentId`

### 决策 4：首条消息发送时懒创建并持久化 session

`chatStore.sendMessage` 在发送时分两种情况：

- 若已有 active session：沿用现有流式逻辑
- 若当前处于草稿态：先调用 `chatApi.createSession({ projectId, title: "New Session", agentId: draftAgentId })` 创建真实 session，并将返回结果插入列表顶部、设为 active，再持久化用户首条消息并开始流式

这意味着 `createSession` IPC 仍然保留，但其触发时机从点击按钮改为首条消息发送前。

**补充约束：发送前先固定上下文快照**

当用户在草稿态点击发送时，系统必须先固定住当时的：

- `projectId`
- `draftAgentId`
- 输入内容 `content`

后续异步 `createSession`、首条消息持久化、`streamMessage` 均使用这一份快照，避免响应式状态在异步期间变化导致数据串错。

**补充约束：首条消息必须使用新建 session 的真实 `sessionId`**

系统不得先用虚拟 id 构造首条消息再回填。只有 `createSession` 成功返回后，才能：

1. 将返回的 session 插入列表顶部并设为 active
2. 使用返回的 `session.id` 生成首条用户消息的 metadata
3. 调用 `persistMessage` 与 `streamMessage`

### 决策 5：首条消息发送路径保持原子性

草稿态首条消息的发送步骤必须是原子的：

1. 固定 `projectId`、`draftAgentId`、`content`
2. 调用 `createSession`
3. 激活并展示返回的真实 session
4. 生成并持久化首条用户消息
5. 启动流式对话

若任一步骤在 `createSession` 成功之前失败，系统必须保持在草稿态，不得留下半创建 session 或孤立消息。

**一致性约束：**

- 首条用户消息只允许持久化一次
- `turnCount`、`createdAt`、`updatedAt` 不得因为"create + send"双路径而重复推进
- `persistMessage`、`streamMessage`、`session_info_update` 后续链路必须全部绑定到同一个新建出来的 `sessionId`

### 决策 6：session 的 `agentId` 来源于草稿态选择

当草稿态被转换为真实 session 时，新 session 的 `agentId` 必须取自当时的 `draftAgentId`。后续该 session 的 agent 选择仍然是 session 级别持久化状态。

### 决策 7：磁盘持久化链路保持不变

以下既有设计保持不变：

- `listSessions` / `loadMessages` 仍然从磁盘读取
- `renameSession` / `deleteSession` 仍然同步写磁盘
- `session_info_update` 仍然通过主进程持久化标题并推送给前端
- 前端仍通过 `chatApi.*` 调用 IPC，不直接依赖 `window.api.chat.*`

### 决策 8：草稿态不持久化

未发送首条消息的草稿态不会写入磁盘，也不会在应用重启后恢复。这是有意为之，因为草稿态的语义是"尚未开始的会话"，不是历史记录。

## Risks / Trade-offs

- **发送路径更复杂**：`sendMessage` 现在需要处理"无 active session 时先创建 session"的分支，失败时必须避免把消息只留在内存里而没有会话
- **草稿态与安装状态耦合**：如果 agent 安装状态变化，`draftAgentId` 可能失效，需要在 store 中做回退或清空
- **草稿不持久化**：用户点击"新建 Session"但不发送消息，退出应用后该草稿不会保留；这是与"不产生空白 session 文件"之间的权衡
