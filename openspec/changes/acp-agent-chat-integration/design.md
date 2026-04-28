## Context

当前 Chat 底层（`electron/main/cli/claude/`）通过 spawn `claude` CLI headless 模式，解析 NDJSON 流转换为 ai-sdk `UIMessage` 格式。这套实现与 Claude Code CLI 强绑定，无法切换其他 ACP agent。

ACP（Agent Client Protocol）是标准化的 agent 通信协议，`@agentclientprotocol/claude-agent-acp` 已作为 npm 全局包安装，通过 stdio 与 ACP SDK 的 `ClientSideConnection` 通信。

## Goals / Non-Goals

**Goals:**

- 用 ACP 协议替换 Claude CLI headless 模式，前端 IPC 接口不变
- 支持已安装的任意 ACP agent 作为 Chat 后端
- Session 持久化：将 ACP sessionId 落盘，支持应用重启后 resumeSession
- `ChatAgentSelect` 组件数据源改为已安装 ACP agent 列表，首次发送前可切换

**Non-Goals:**

- 权限 UI（本次全部 allow_once，后续迭代）
- 多 agent 并发（每个 session 绑定一个 agent）
- ACP agent 进程热切换（切换 agent 只在 session 首次发送前生效）

## Decisions

### D1：ACP agent 进程池，按 agentId 懒启动复用

**决定**：不在应用启动时预启动任何进程。`acp-process-pool.ts` 维护一个 `Map<agentId, AcpAgentProcess>`，首次使用某个 agentId 时懒启动对应进程并完成 `initialize` 握手，后续同 agentId 的 session 复用同一连接。

**理由**：用户可能切换不同 agent，单例只能服务一个 agentId。进程池让每个 agent 独立管理生命周期，同时避免每次对话都有冷启动开销（同 agentId 复用）。

agent 可执行路径通过复用 `electron/main/acp/detector.ts` 中的 `detectAgentInstallation` 和 `findCommandPath` 获取，不自行查找（避免重复逻辑，且 detector 已处理 npx/uvx/binary 三种安装方式）。

**备选**：全局单例（应用启动时 spawn 固定 agent）——无法支持多 agent 切换。按需 spawn（每次 streamMessage 启动新进程）——每次都有握手延迟。

### D2：新增 `electron/main/chat-agent/` 模块，不修改现有 cli/ 结构

**决定**：新建独立目录 `chat-agent/`，包含 acp-process-pool、acp-session、acp-mapper、session-store、types。`cli/claude/` 保留至验证通过后删除。

**理由**：并行存在便于回滚和对比验证，不影响现有功能。

### D3：ACP → SessionEvent 映射层保持与现有 IPC 格式兼容

**决定**：`acp-mapper.ts` 将 ACP `sessionUpdate` 通知转换为现有 `SessionEvent` 联合类型，IPC 层（`chat.ts`）和前端零改动。

| ACP sessionUpdate              | SessionEvent                                      |
| ------------------------------ | ------------------------------------------------- |
| `agent_message_chunk` (text)   | `text_delta`                                      |
| `tool_call` (pending)          | `message_upsert`（dynamic-tool, input-available） |
| `tool_call_update` (completed) | `message_patch`（dynamic-tool, output-available） |
| prompt 结束                    | `done`                                            |
| 异常                           | `error`                                           |

**理由**：最小化改动范围，前端 store 和 IPC 协议不受影响。

### D4：Session 持久化以项目路径编码为目录，挂在 projects/ 下

**决定**：存储结构以 `ProjectInfo.path` 编码为目录名（将路径中的 `/` 替换为 `-`，与 Claude Code 的 `~/.claude/projects/` 命名方式一致），session 文件挂在该目录下：

```
userData/
└── projects/
    └── -Users-tao-Work-myproject/         # encodeProjectPath(project.path)
        ├── project.json                   # 项目元数据
        └── sessions/
            ├── <sessionId>.json           # session 元数据：{ sessionId, acpSessionId, agentId, title, turnCount, createdAt, updatedAt }
            └── <sessionId>.messages.jsonl # 消息历史：每行一条 UIMessage<MessageMeta>，按时间追加
```

`encodeProjectPath(path)` 实现：将路径开头的 `/` 去掉后，所有 `/` 替换为 `-`。

**FylloCode 自己是消息的 source of truth**，不依赖 agent 侧的历史存储：

- 每次收到 `message_upsert` / `message_patch` 时，将最终消息追加写入 `.messages.jsonl`
- 应用重启后从 `.messages.jsonl` 恢复 UI 消息列表，无需 agent replay
- 同时调用 `resumeSession` 让 agent 侧恢复上下文记忆，两者职责分离：FylloCode 负责 UI 历史，agent 负责推理上下文

**理由**：各 agent 的会话存储逻辑不一致，FylloCode 自己维护消息历史可以做到跨 agent 统一，不需要适配每个 agent 的存储格式。`session/resume` 只恢复 agent 记忆，不 replay 历史，UI 恢复完全由 FylloCode 自己掌控。

### D5：ChatAgentSelect 数据源改为已安装 ACP agent

**决定**：`ChatAgentSelect.vue`（原 `AgentSelect.vue`）从 `useAcpAgentsStore` 读取 `statuses`，只展示 `installed === true` 的 agent。agent 切换在 `session.turnCount === 0` 前生效，首次发送后禁用。

**理由**：agent 列表应反映实际可用状态，而非硬编码。

## Risks / Trade-offs

- **ACP 进程崩溃**：进程池中某个 agentId 的进程退出后需自动重启。`acp-process-pool.ts` 监听 `child.on('exit')` 并重新 spawn + initialize，重启期间该 agentId 的 streamMessage 请求会收到 error 事件。
- **ACP sessionId 与 FylloCode sessionId 不一致**：resumeSession 依赖持久化的 acpSessionId，若 agent 侧 session 已过期，ACP 会返回错误。→ 降级为 newSession，清空 acpSessionId。
- **tool_call 输出格式差异**：ACP 的 `tool_call_update` 不直接携带 tool output，需要从 `sessionUpdate` 的其他字段组装。→ mapper 层需要缓存 pending tool_call，等 completed 时补全。

## Migration Plan

1. 新增 `chat-agent/` 模块，不删除 `cli/claude/`
2. `ipc/chat.ts` 切换到 `AcpSession`，保持 IPC 接口不变
3. `electron/main/index.ts` 无需改动（进程懒启动，不需要预启动）
4. 前端 `ChatAgentSelect` 替换 `AgentSelect`
5. 验证通过后删除 `cli/claude/` 目录

**回滚**：将 `ipc/chat.ts` 中的 `AcpSession` 引用切回 `ClaudeSession` 即可，`cli/claude/` 保留期间随时可回滚。

## Open Questions

- ACP agent 进程的可执行路径：当前通过 `npm root -g` 动态查找，生产环境打包后需确认路径策略（bundled vs. 系统全局）。
