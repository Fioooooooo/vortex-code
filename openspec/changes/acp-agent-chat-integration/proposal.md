## Why

当前 Chat 底层通过 spawn `claude` CLI（headless 模式）解析 NDJSON 流，与 Claude Code 强绑定，无法切换其他 ACP agent。通过接入 ACP 协议，可以将 agent 通信标准化，支持任意已安装的 ACP agent 作为 Chat 后端。

## What Changes

- 新增 `electron/main/chat-agent/` 模块，封装 ACP agent 进程管理、session 生命周期、ACP → ai-sdk 格式转换
- `electron/main/ipc/chat.ts` 的 `streamMessage` handler 改用 `AcpSession` 替代 `ClaudeSession`
- Session 持久化：将 ACP sessionId 写入 `getDataSubPath('sessions')` 目录，支持应用重启后 resumeSession
- `AgentSelect` 组件重命名为 `ChatAgentSelect`，数据源改为已安装的 ACP agent 列表
- Agent 切换仅在会话首次发送消息前生效（`turnCount === 0`），首次发送后禁用选择器
- `claude-cli-stream` 相关实现（`electron/main/cli/claude/`）在验证通过后删除

## Capabilities

### New Capabilities

- `acp-chat-backend`: ACP agent 进程池管理（按 agentId 懒启动、复用）、ACP session 生命周期、ACP → SessionEvent 映射、session 持久化（acpSessionId 落盘 + resumeSession）

### Modified Capabilities

- `chat-agent-selection`: AgentSelect 数据源改为已安装 ACP agent 列表；agent 切换限制在 `turnCount === 0` 前
- `claude-cli-stream`: 被 `acp-chat-backend` 取代，requirements 全部迁移，原 spec 标记为废弃

## Impact

- `electron/main/chat-agent/`：新增模块（acp-process-pool, acp-session, acp-mapper, session-store, types）
- `electron/main/ipc/chat.ts`：替换 ClaudeSession 引用
- `electron/main/index.ts`：不需要预启动，进程按需懒启动
- `frontend/src/components/chat/AgentSelect.vue` → `ChatAgentSelect.vue`：重命名 + 数据源变更
- `shared/types/channels.ts`、`shared/types/ipc.ts`：不变
- 新增依赖：`@agentclientprotocol/sdk`（ACP 协议客户端 SDK，用于 `ClientSideConnection`）；各 ACP agent 由用户自行安装，FylloCode 只负责 spawn，不打包 agent 本身
