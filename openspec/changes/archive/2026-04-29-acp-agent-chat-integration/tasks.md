## 1. 依赖准备

- [x] 1.1 在主进程依赖中添加 `@agentclientprotocol/sdk`（ACP 协议客户端 SDK）；各 ACP agent 由用户自行安装，不作为 FylloCode 的 npm 依赖
- [x] 1.2 确认 `tsconfig.node.json` 能解析新依赖的类型声明

## 2. chat-agent 模块 — 类型与持久化

- [x] 2.1 新建 `electron/main/chat-agent/types.ts`，re-export `SessionEvent` 联合类型（复用 `cli/claude/types.ts` 中的定义）
- [x] 2.2 新建 `electron/main/chat-agent/session-store.ts`，实现以下能力：
  - `saveSessionMeta / loadSessionMeta / listSessionMetas / deleteSession`：操作 `<encodedPath>/sessions/<sessionId>.json`，字段 `{ sessionId, acpSessionId, agentId, title, turnCount, createdAt, updatedAt }`
  - `appendMessage(sessionId, message)`：将 `UIMessage<MessageMeta>` 以 JSONL 格式追加写入 `<encodedPath>/sessions/<sessionId>.messages.jsonl`
  - `loadMessages(sessionId)`：读取并解析 `.messages.jsonl`，返回 `UIMessage<MessageMeta>[]`
  - `encodedPath` 为 `project.path` 去掉开头 `/` 后将所有 `/` 替换为 `-`
- [x] 2.3 确认 `electron/main/utils/paths.ts` 的 `SubPath` 类型已包含 `"projects"`（当前已有），`"sessions"` 子目录由 session-store 自行拼接，无需单独注册

## 3. chat-agent 模块 — ACP 进程池

- [x] 3.1 新建 `electron/main/chat-agent/acp-process-pool.ts`，维护 `Map<agentId, AcpAgentProcess>`，实现 `getOrStartProcess(agentId): Promise<ClientSideConnection>`
- [x] 3.2 `getOrStartProcess`：通过 `detectAgentInstallation`（复用 `electron/main/acp/detector.ts`）获取 agent 的 `installPath` 或命令名，spawn 子进程，完成 `ClientSideConnection.initialize` 握手
- [x] 3.3 监听子进程 `exit` 事件，自动重启并重新握手；重启期间标记该 agentId 连接为不可用，对应 streamMessage 请求返回 `ACP_NOT_READY` 错误
- [x] 3.4 `requestPermission` 回调：优先选择 `allow_once`，无则返回 `cancelled`

## 4. chat-agent 模块 — mapper

- [x] 4.1 新建 `electron/main/chat-agent/acp-mapper.ts`，实现 `mapSessionUpdate(update) → SessionEvent | null`
- [x] 4.2 映射 `agent_message_chunk`（text）→ `text_delta`
- [x] 4.3 映射 `tool_call`（pending）→ `tool_call_start`（toolCallId, title, kind）
- [x] 4.4 映射 `tool_call_update`（任意 status）→ `tool_call_update`（toolCallId, status, content 拼合文本）
- [x] 4.5 映射 prompt 完成 → `done`；异常 → `error`

## 5. chat-agent 模块 — AcpSession

- [x] 5.1 新建 `electron/main/chat-agent/acp-session.ts`，实现 `AcpSession` 类，接口与 `ClaudeSession` 对齐（`start(prompt)` / `cancel()` / EventEmitter）
- [x] 5.2 `start`：从 `session-store` 读取 `acpSessionId` 和 `agentId`，通过 `getOrStartProcess(agentId)` 获取连接；有 `acpSessionId` 则 `resumeSession`，无则 `newSession`；`resumeSession` 失败时降级为 `newSession`
- [x] 5.3 `newSession`/`resumeSession` 返回后立即 emit `session_id_resolved`（携带 `acpSessionId`），不等待 prompt 完成
- [x] 5.4 调用 `connection.prompt`，在 `session/update` 回调中通过 mapper 转换并 emit `SessionEvent`

## 6. IPC 层替换

- [x] 6.1 修改 `shared/types/ipc.ts`，更新 `MessageChunkData`：移除 `message_upsert`/`message_patch`，新增 `tool_call_start`（toolCallId, title, toolKind）和 `tool_call_update`（toolCallId, status, content?）
- [x] 6.2 修改 `electron/main/ipc/chat.ts`，将 `streamMessage` handler 中的 `new ClaudeSession(...)` 替换为 `new AcpSession(...)`；`cwd` 暂时 fallback 到 `process.cwd()`（`projectId` → path 的解析留待后续 project 持久化实现）
- [x] 6.3 监听 `session_id_resolved` 事件，将 `acpSessionId` 写入 session-store（替代旧的 `setClaudeSessionId`）
- [x] 6.4 收到 `tool_call_start`/`tool_call_update` 时通过 MessagePort 转发对应 chunk；收到 `done` 时调用 `appendMessage` 将完整消息写入 `.messages.jsonl`
- [x] 6.5 修改 `streamCancel` handler，调用 `AcpSession.cancel()` 替代 `ClaudeSession.cancel()`

## 7. 前端 chat store 改造

- [x] 7.1 修改 `frontend/src/stores/chat.ts`，更新 `onChunk` 处理逻辑：
  - 移除 `message_upsert`/`message_patch` 分支
  - 收到 `text_delta` 时：若无 `activeAssistantId`，先创建 assistant UIMessage 并 push 到 `session.messages`；追加文本到其 text part
  - 收到 `tool_call_start` 时：若无 `activeAssistantId`，先创建 assistant UIMessage；向其 `parts` 追加 `dynamic-tool` part（`state: "input-available"`，`toolCallId`，`toolName: title`，`input: {}`）
  - 收到 `tool_call_update`（completed/failed）时：找到对应 `toolCallId` 的 part，更新 `state` 为 `"output-available"`，写入 `output: content`
  - 收到 `done` 时：清空 `activeAssistantId`

## 8. 前端 ChatAgentSelect

- [x] 8.1 将 `frontend/src/components/chat/AgentSelect.vue` 重命名为 `ChatAgentSelect.vue`
- [x] 8.2 数据源改为 `useAcpAgentsStore`，只展示 `statuses[id].installed === true` 的 agent；无已安装 agent 时显示空状态提示
- [x] 8.3 在 `ChatContainer.vue` 中更新引用名（`AgentSelect` → `ChatAgentSelect`）
- [x] 8.4 根据 `session.turnCount === 0` 控制选择器的 `disabled` 状态，首次发送后禁用

## 9. 验证

- [x] 9.1 `pnpm typecheck` 无类型错误
- [ ] 9.2 `pnpm dev` 启动，发送消息，确认流式文字正常输出
- [ ] 9.3 发送触发工具调用的 prompt，确认 tool_call 卡片实时渲染（pending → completed）
- [ ] 9.4 关闭应用重新打开，在同一 session 继续对话，确认 UI 历史消息从 `.messages.jsonl` 恢复，且 agent 侧上下文通过 resumeSession 恢复
- [ ] 9.5 切换不同 agent 后发送消息，确认对应 agent 进程被懒启动
- [ ] 9.6 确认 ChatAgentSelect 只显示已安装 agent，首次发送后禁用
