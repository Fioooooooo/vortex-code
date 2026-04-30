## ADDED Requirements

### Requirement: listSessions IPC 从磁盘返回项目 session 列表

系统 SHALL 实现 `chat:listSessions` IPC handler，从磁盘读取指定项目的所有 session 元数据，按 `updatedAt` 降序返回，`messages` 字段为空数组。

#### Scenario: 列出项目 sessions

- **WHEN** 渲染进程调用 `chat:listSessions` 并传入 `{ projectId }`
- **THEN** 主进程通过 `projectId` 解析 `projectPath`，调用 `listSessionMetas(projectPath)`，返回按 `updatedAt` 降序排列的 `Session[]`，每个 session 的 `messages` 为空数组

#### Scenario: 项目无 session 时返回空数组

- **WHEN** 渲染进程调用 `chat:listSessions`，且该项目无任何 session 文件
- **THEN** 返回空数组 `[]`

### Requirement: createSession IPC 创建并持久化 session 元数据

系统 SHALL 实现 `chat:createSession` IPC handler，生成新的 `sessionId`，写入 session 元数据文件，返回 `Session` 对象。

#### Scenario: 创建新 session

- **WHEN** 渲染进程调用 `chat:createSession` 并传入 `{ projectId, title, agentId }`
- **THEN** 主进程生成 `sessionId`（格式：`session-<timestamp>`），调用 `saveSessionMeta` 写入磁盘（含 `agentId`），返回对应的 `Session` 对象（`messages: []`，`status: "ended"`，`turnCount: 0`，`agentId`）

#### Scenario: 草稿态首条消息前创建 session

- **WHEN** 渲染进程在草稿态发送第一条消息前调用 `chat:createSession`
- **THEN** 调用方传入的 `title` 为基于首条用户消息生成的兜底标题
- **AND** 返回的 `sessionId` 作为该轮首条消息持久化与后续流式会话的唯一 session 标识

### Requirement: updateSession IPC 更新 session 元数据

系统 SHALL 实现 `chat:updateSession` IPC handler，读取现有元数据、合并 patch、写回磁盘。

#### Scenario: 更新 session 标题

- **WHEN** 渲染进程调用 `chat:updateSession` 并传入 `{ id, patch: { title }, projectId }`
- **THEN** 主进程读取现有 meta，合并 patch，更新 `updatedAt`，写回磁盘，返回更新后的 `Session`

### Requirement: removeSession IPC 删除 session 文件

系统 SHALL 实现 `chat:removeSession` IPC handler，删除 session 的元数据文件和消息文件。

#### Scenario: 删除 session

- **WHEN** 渲染进程调用 `chat:removeSession` 并传入 `{ id, projectId }`
- **THEN** 主进程删除 `<sessionId>.json` 和 `<sessionId>.messages.jsonl` 文件

### Requirement: session_info_update 事件处理链路

系统 SHALL 在 ACP agent 推送 `session_info_update` 事件时，将标题变更持久化到磁盘并通知前端。

#### Scenario: Agent 推送 session 标题

- **WHEN** ACP agent 推送 `sessionUpdate === "session_info_update"` 且 `title` 字段非空
- **THEN** `acp-mapper.ts` 将其映射为 `SessionEvent: { type: "session_info_update", title }`
- **AND** 主进程 IPC handler 调用 `saveSessionMeta` 更新磁盘中的 `title` 字段
- **AND** 通过 MessagePort 发送 `{ type: "chunk", data: { kind: "session_info_update", title } }` 给渲染进程

#### Scenario: 前端收到标题更新

- **WHEN** 渲染进程收到 `kind: "session_info_update"` chunk
- **THEN** 前端 chat store 更新对应 session 的 `title` 字段，UI 实时反映新标题

#### Scenario: Agent 未推送标题时保持调用方初始化标题

- **WHEN** ACP agent 在整轮对话中未推送 `session_info_update`
- **THEN** 主进程保持 `chat:createSession` 初始写入的 `title` 不变

系统 SHALL 提供 `chat:loadMessages` IPC handler，从磁盘读取指定 session 的历史消息列表。

#### Scenario: 加载历史消息

- **WHEN** 渲染进程调用 `chat:loadMessages` 并传入 `{ sessionId, projectId }`
- **THEN** 主进程调用 `loadMessages(projectPath, sessionId)`，返回 `Message[]`

#### Scenario: 无历史消息时返回空数组

- **WHEN** 渲染进程调用 `chat:loadMessages`，且该 session 无消息文件
- **THEN** 返回空数组 `[]`
