## 1. 共享类型与 IPC Channel

- [x] 1.1 在 `shared/types/channels.ts` 的 `ChatChannels` 中新增 `loadMessages: "chat:loadMessages"`
- [x] 1.2 在 `shared/types/ipc.ts`（或相关类型文件）中确认 `IpcResponse` 泛型可覆盖 `Message[]` 返回类型

## 2. 主进程 IPC Handler 补全

- [x] 2.1 实现 `chat:listSessions` handler：通过 `projectId` 解析 `projectPath`，调用 `listSessionMetas`，按 `updatedAt` 降序排列后返回 `Session[]`（`messages: []`）
- [x] 2.2 实现 `chat:createSession` handler：生成 `sessionId`，调用 `saveSessionMeta` 写入磁盘，返回 `Session` 对象
- [x] 2.3 实现 `chat:updateSession` handler：接收 `{ id, patch, projectId }`，读取现有 meta，合并 patch，更新 `updatedAt`，写回磁盘，返回更新后的 `Session`
- [x] 2.4 实现 `chat:removeSession` handler：接收 `{ id, projectId }`，调用 `deleteSession(projectPath, id)` 删除文件
- [x] 2.5 新增 `chat:loadMessages` handler：接收 `{ sessionId, projectId }`，调用 `loadMessages(projectPath, sessionId)`，返回 `Message[]`
- [x] 2.6 删除 `chat:getSession` 和 `chat:sendMessage` 的空 handler（或保留空实现，视是否有调用方）

## 3. Preload 与前端 API

- [x] 3.1 在 `electron/preload/api/chat.ts` 中新增 `loadMessages(sessionId, projectId)` 方法
- [x] 3.2 更新 `updateSession` 签名：增加 `projectId` 参数，传入 IPC
- [x] 3.3 更新 `removeSession` 签名：增加 `projectId` 参数，传入 IPC
- [x] 3.4 在 `frontend/src/api/chat.ts` 中新增 `loadMessages(sessionId, projectId)` 方法，并同步更新 `updateSession` / `removeSession`

## 4. 已完成的真实持久化集成

- [x] 4.1 删除 `session.ts` store 中的 mock session / mock message 逻辑
- [x] 4.2 实现 `loadSessions(projectId)`，从磁盘加载 session 列表并反序列化 Date 字段
- [x] 4.3 实现 `selectSession(sessionId)` 的历史消息按需加载
- [x] 4.4 实现 `renameSession` / `deleteSession` 的磁盘同步
- [x] 4.5 增加 `session_info_update` 事件链路，支持 agent 推送标题更新
- [x] 4.6 将消息 ID 生成统一替换为 `generateId` from `"ai"`
- [x] 4.7 将 store 内的 `window.api.chat.*` 直接调用统一替换为 `chatApi.*`
- [x] 4.8 `Session` 类型新增 `agentId`，并将后续流式发送绑定到 `session.agentId`

## 5. 草稿态与懒创建改造

- [x] 5.1 在 `frontend/src/stores/session.ts` 中新增响应式草稿态：点击"新建 Session"时只清空 `activeSessionId` 并进入 draft，而不是立即调用 `chatApi.createSession`
- [x] 5.2 在 `frontend/src/stores/acp-agents.ts`（或相关可复用层）提供默认已安装 agent 的解析能力，禁止在 session store 内硬编码固定 `agentId`
- [x] 5.3 在 `frontend/src/stores/session.ts` 中新增 `draftAgentId`（或等价状态），并在项目切换、session 删除、agent 安装状态变化时正确重置 / 回退
- [x] 5.4 更新 `frontend/src/components/chat/ChatAgentSelect.vue`：无 active session 时绑定 `draftAgentId`，有 active session 时绑定 `activeSession.agentId`
- [x] 5.5 更新 `frontend/src/components/chat/ChatContainer.vue`：支持无 active session 的空白草稿态，不再通过硬编码 fallback 显示 agent
- [x] 5.6 更新 `frontend/src/stores/chat.ts`：草稿态发送首条消息时，先固定 `projectId`、`draftAgentId` 与输入内容快照，再进入异步创建流程
- [x] 5.7 草稿态首条消息创建流程中，先调用 `chatApi.createSession`，再将返回的 session 插入列表顶部并激活，之后才生成带真实 `sessionId` 的首条用户消息
- [x] 5.8 确保草稿态首条消息创建的新 session 使用当前 `draftAgentId` 作为持久化的 `session.agentId`，且首条用户消息只持久化一次
- [x] 5.9 确保首条消息创建路径中的 `turnCount`、`createdAt`、`updatedAt` 不会因为 create/send 双路径而重复推进
- [x] 5.10 确保 `persistMessage`、`streamMessage`、`session_info_update` 后续链路全部绑定到新建出来的同一个 `sessionId`
- [x] 5.11 处理草稿态 `createSession` 失败：不新增 session 条目、不写入消息文件、UI 维持草稿态而不是半创建状态
- [x] 5.12 为未实现 `session_info_update` 的 ACP agent 增加标题兜底策略：草稿态首条消息创建 session 时，使用首条用户消息去首尾空白、压缩连续空白后的前 30 个字符作为初始标题
- [x] 5.13 确保后续若收到 `session_info_update`，agent 推送标题仍可覆盖本地兜底标题

## 6. 验证

- [x] 6.1 运行 `pnpm typecheck` 确保类型检查通过
- [x] 6.2 运行 `pnpm test` 确保现有测试通过
- [ ] 6.3 启动 `pnpm dev`，验证切换项目后 session 列表从磁盘加载
- [ ] 6.4 验证点击"新建 Session"后不会立即生成 `.json` 文件，且 session 列表无新增条目
- [ ] 6.5 验证草稿态发送首条消息后才生成 `.json` 与 `.messages.jsonl`，并自动插入列表顶部
- [ ] 6.6 验证切换 session 后历史消息正确加载，agent 选择器在 active session 与草稿态之间切换正确
- [ ] 6.7 验证重命名、删除、`session_info_update` 标题更新、以及流式进行中 agent 选择器禁用行为
- [ ] 6.8 验证在 ACP agent 未推送 `session_info_update` 时，新 session 标题默认显示首条用户消息截断值；若后续收到推送，标题可被覆盖
