## Why

FylloCode 作为 Claude Code CLI 的可视化界面，需要将 `claude` CLI 的 headless 输出（NDJSON stream-json 格式）解析并转换为 ai-sdk 的 `UIMessage` 格式，才能驱动前端 `@nuxt/ui` 的 `UChatMessages` 组件渲染。目前主进程的 `streamMessage` handler 是 TODO 占位，前端依赖 mock 数据，无法与真实 CLI 交互。

## What Changes

- 新增 `electron/main/cli/claude/` 模块，封装 Claude CLI 子进程的启动、NDJSON 解析、消息映射和会话状态机
- 新增 Claude Code session_id 映射机制：从首条 `system/hook_started` 消息中提取 Claude 的 `session_id`，建立 FylloCode sessionId → Claude sessionId 的持久映射，后续消息通过 `--resume {claudeSessionId}` 续接同一 Claude 会话
- 扩展 `shared/types/ipc.ts`，新增 `MessageChunkData` 联合类型，支持 text_delta、message_upsert、message_patch 三种 chunk 语义
- 实现 `electron/main/ipc/chat.ts` 的 `streamMessage` handler，接入真实 Claude CLI 流式输出
- 扩展 `electron/preload/api/chat.ts` 的 `StreamCallbacks`，适配新的 chunk 格式
- 更新 `frontend/src/stores/chat.ts`，消费新的流式 chunk 并驱动 UIMessage 状态更新

## Capabilities

### New Capabilities

- `claude-cli-stream`: 封装 Claude CLI 子进程管理与 NDJSON 流式输出解析，将 `assistant`/`user`/`stream_event`/`result` 消息转换为 `UIMessage` 格式，通过 IPC MessagePort 推送给渲染进程；同时管理 FylloCode sessionId 与 Claude sessionId 的映射，支持多轮对话续接

### Modified Capabilities

- `ipc-streaming`: 扩展流式 chunk 数据类型，从单一 `StreamChunkData { content, tokenCount }` 扩展为支持 `MessageChunkData` 联合类型（text_delta、message_upsert、message_patch）

## Impact

- **新增文件**：`electron/main/cli/claude/types.ts`、`parser.ts`、`mapper.ts`、`process.ts`、`session.ts`
- **修改文件**：`shared/types/ipc.ts`、`electron/main/ipc/chat.ts`、`electron/preload/api/chat.ts`、`frontend/src/stores/chat.ts`
- **依赖**：使用 Node.js 内置 `child_process.spawn` + `readline`，无需新增 npm 依赖
- **IPC 契约变更**：`streamMessage` 的 chunk 数据格式从 `StreamChunkData` 变为 `MessageChunkData`（preload 和 store 需同步更新）
