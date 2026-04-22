## 1. 共享类型扩展

- [x] 1.1 在 `shared/types/ipc.ts` 新增 `MessageChunkData` 联合类型（text_delta、message_upsert、message_patch、status）

## 2. CLI 集成层（electron/main/cli/claude/）

- [x] 2.1 创建 `electron/main/cli/claude/types.ts`，定义 `ClaudeRawLine`、`ClaudeStreamEvent`、`ClaudeAssistantMessage`、`ClaudeToolResult`、`ClaudeUsage` 类型
- [x] 2.2 创建 `electron/main/cli/claude/parser.ts`，实现 `parseLine(line: string): ClaudeRawLine | null` 纯函数
- [x] 2.3 创建 `electron/main/cli/claude/mapper.ts`，实现 `mapAssistantMessage` 和 `applyToolResult` 函数
- [x] 2.4 创建 `electron/main/cli/claude/process.ts`，实现 `spawnClaude(opts)` 函数（spawn + readline），支持可选的 `claudeSessionId` 参数以携带 `--resume`
- [x] 2.5 创建 `electron/main/cli/claude/session.ts`，实现 `ClaudeSession` 状态机（EventEmitter），处理 text_delta、message_upsert、message_patch、done、error 事件，并在首条含 `session_id` 的 system 消息时 emit `session_id_resolved` 事件
- [x] 2.6 在 IPC handler 层（或独立 `session-map.ts`）维护 `Map<string, string>`（fylloSessionId → claudeSessionId），在 `session_id_resolved` 时写入，spawn 前查询

## 3. IPC Handler 接入

- [x] 3.1 更新 `electron/main/ipc/chat.ts` 的 `streamMessage` handler 入参为 `{ sessionId, projectId, prompt }`，通过 `projectId` 查询 `ProjectInfo.path` 作为 `cwd`，接入 `ClaudeSession`，将 SessionEvent 转发到 MessagePort
- [x] 3.2 更新 `electron/main/ipc/chat.ts` 的 `streamCancel` handler，调用 `ClaudeSession.cancel()`
- [x] 3.3 在 `streamMessage` handler 中处理 ENOENT 错误（claude 命令不存在）

## 4. Preload 层更新

- [x] 4.1 更新 `electron/preload/api/chat.ts` 的 `StreamCallbacks`，将 `onChunk` 参数类型改为 `MessageChunkData`

## 5. 前端 Store 更新

- [x] 5.1 更新 `frontend/src/stores/chat.ts` 的 `sendMessage`，在调用 `streamMessage` 前先插入占位 assistant 消息
- [x] 5.2 在 store 中处理 `text_delta` chunk：追加文本到占位消息的 text part
- [x] 5.3 在 store 中处理 `message_upsert` chunk：用权威消息替换占位消息
- [x] 5.4 在 store 中处理 `message_patch` chunk：回填 tool-invocation 的 result

## 6. 验证

- [x] 6.1 运行 `pnpm typecheck` 确认无类型错误
- [ ] 6.2 启动 `pnpm dev`，在 chat 页面发送消息，验证流式文本输出正常
- [ ] 6.3 发送触发工具调用的 prompt，验证 tool-invocation part 正确显示 call → result 状态
