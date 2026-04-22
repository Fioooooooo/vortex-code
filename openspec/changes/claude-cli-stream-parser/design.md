## Context

FylloCode 的 chat 功能需要与本地 Claude Code CLI 交互。CLI 支持 `--print --output-format stream-json --verbose --include-partial-messages` 模式，以 NDJSON 格式逐行输出结构化消息。主进程需要 spawn 子进程、解析输出、将其转换为 `UIMessage` 格式，并通过 IPC MessagePort 推送给渲染进程。

当前状态：`electron/main/ipc/chat.ts` 的 `streamMessage` handler 是 TODO 占位，使用 mock 数据。

Claude CLI 输出的关键消息类型：

- `system/hook_started` 或 `system/init`：会话初始化，**首条含 `session_id` 的 system 消息用于提取 Claude sessionId**
- `stream_event/content_block_delta`：实时文本 delta（`--include-partial-messages` 时）
- `assistant`：完整 assistant 消息（text + tool_use blocks），每个 turn 结束时
- `user`：tool_result（工具执行结果，配对 tool_use）
- `result`：最终汇总（cost、usage）

## Goals / Non-Goals

**Goals:**

- 封装 Claude CLI 子进程生命周期（spawn、readline、kill）
- 将 NDJSON 输出解析为强类型的 `ClaudeRawLine`
- 将 Claude 消息映射为 `UIMessage<MessageMeta>`，支持 text、tool-invocation parts
- 通过 IPC MessagePort 以 `MessageChunkData` 格式推送流式更新
- 支持取消（kill 子进程）
- 管理 FylloCode sessionId → Claude sessionId 映射，支持多轮对话 `--resume` 续接

**Non-Goals:**

- 不处理 Claude CLI 的认证/配置（由用户环境负责）
- 不实现会话持久化（session 存储留给后续迭代；本次映射仅存内存）
- 不支持 Codex 或其他 CLI（目录结构预留扩展，但本次只实现 claude）

## Decisions

### D1：目录结构 `electron/main/cli/claude/`

将 CLI 集成放在 `electron/main/cli/` 下，`claude/` 作为子目录，预留 `codex/` 等未来扩展空间。内部分为 `types.ts`、`parser.ts`、`mapper.ts`、`process.ts`、`session.ts` 五个职责单一的模块。

**备选方案**：放在 `electron/main/claude/`（扁平）。
**选择理由**：`cli/` 命名空间更清晰地表达"CLI 集成层"的意图，便于未来添加 `cli/codex/` 等。

### D2：流式策略——双轨并行（stream_event + assistant）

使用 `--include-partial-messages` 获取实时 text delta，同时监听完整的 `assistant` 消息作为权威状态。

- `stream_event/content_block_delta`（text_delta）→ 推送 `{ kind: "text_delta" }` 给前端，追加到占位消息
- `assistant` 完整消息到达 → 推送 `{ kind: "message_upsert" }` 替换占位，包含完整 parts（text + tool-invocation）
- `user/tool_result` 到达 → 推送 `{ kind: "message_patch" }` 回填对应 tool-invocation 的 result

**备选方案**：只用完整 `assistant` 消息，不用 stream_event。
**选择理由**：stream_event 提供实时文本流，用户体验更好；assistant 消息保证最终状态权威。

### D3：MessageChunkData 联合类型扩展 IPC

在 `shared/types/ipc.ts` 新增 `MessageChunkData` 联合类型，保留原 `StreamChunkData` 不动（向后兼容）。`streamMessage` 的 MessagePort 改为传输 `StreamMessage<MessageChunkData>`。

```typescript
export type MessageChunkData =
  | { kind: "text_delta"; text: string }
  | { kind: "message_upsert"; message: Message }
  | { kind: "message_patch"; id: string; parts: Message["parts"] }
  | { kind: "status"; agentStatus: AgentStatus };
```

**选择理由**：联合类型在 preload 和 store 侧都能做 exhaustive 类型收窄，比扩展旧接口更安全。

### D4：tool_use + tool_result 配对策略

同一个 `assistant` CLI 消息的 content 数组里，text 和 tool_use 混合存在。映射规则：

- 一个 `assistant` CLI 消息 → 一个 `UIMessage`（role: assistant），parts 包含所有 text + tool-invocation
- `user/tool_result` 不生成新 UIMessage，而是通过 `message_patch` 回填对应 assistant UIMessage 的 tool-invocation part（通过 `tool_use_id` 匹配）

Session 内部维护 `toolResultBuffer: Map<string, string>`，在 `assistant` 消息到达前暂存 tool_result，到达时一并配对。

### D5：session.ts 使用 Node.js EventEmitter

`ClaudeSession` 继承 `EventEmitter`，emit `SessionEvent` 联合类型事件。IPC handler 监听事件并转发到 MessagePort。

**选择理由**：EventEmitter 是 Node.js 原生模式，无需额外依赖，与 Electron 主进程环境天然兼容。

### D6：FylloCode sessionId → Claude sessionId 内存映射

`ClaudeSessionManager`（或 IPC handler 层）维护一个 `Map<string, string>`（fylloSessionId → claudeSessionId）。

- **新会话**：spawn 时不带 `--resume`；监听首条含 `session_id` 的 `system` 消息，写入映射
- **续接会话**：spawn 时携带 `--resume {claudeSessionId}`；不覆盖已有映射

Claude CLI 的 `session_id` 出现在输出的第一条 `type: "system"` 消息中（`subtype: "hook_started"` 或 `subtype: "init"`），两者都携带 `session_id` 字段，取先到的那条即可。

**备选方案**：使用 `--session-id <uuid>` 让 FylloCode 指定 Claude 的 session_id，直接用 FylloCode sessionId 作为 Claude sessionId。
**未选择理由**：`--session-id` 要求传入合法 UUID，且 Claude 可能拒绝已存在的 session_id；从输出中提取更可靠，也不依赖 FylloCode sessionId 的格式。

## Risks / Trade-offs

- **CLI 路径依赖** → `claude` 命令需在用户 PATH 中可用；若不存在，spawn 会抛出 ENOENT。需在 IPC handler 层捕获并返回友好错误。
- **NDJSON 解析容错** → CLI 可能输出非 JSON 行（如 stderr 警告）；parser 需静默跳过无法解析的行。
- **tool_result 乱序** → 理论上 tool_result 总在对应 assistant 消息之后，但 session 状态机需处理极端情况（先缓存，后配对）。
- **stream_event 与 assistant 消息的竞争** → stream_event 的 text 可能与 assistant 完整消息的 text 不完全一致（极少见）；以 assistant 消息为权威，upsert 替换。
- **映射仅存内存** → 应用重启后映射丢失，无法续接历史会话；本次接受此限制，持久化留给后续迭代。

## Migration Plan

1. 新增 `electron/main/cli/claude/` 模块（纯新增，无破坏）
2. 扩展 `shared/types/ipc.ts`（新增类型，不修改旧类型）
3. 更新 `electron/main/ipc/chat.ts` 的 streamMessage handler（替换 TODO mock）
4. 更新 `electron/preload/api/chat.ts` 的 StreamCallbacks 类型
5. 更新 `frontend/src/stores/chat.ts` 消费新 chunk 格式

无需数据迁移，无需 rollback 策略（纯新功能，旧 mock 可随时恢复）。

## Open Questions

~~`cwd` 如何传入？~~ 已决策：`streamMessage` 入参新增 `projectId`，主进程通过 `projectId` 查询 `ProjectInfo.path` 作为 `cwd`。`cwd` 是主进程职责，渲染进程不应持有文件路径。
