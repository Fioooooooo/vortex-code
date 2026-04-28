## Why

当前代码中"ACP agent 安装管理"与"Chat 中使用的 agent"概念混用，类型命名（`AgentEntry`、`AgentStatus`、`AgentInfo`）无法区分两层，导致 settings store 承担了不属于它的职责，且未来引入 Chat Agent 选择与配置时极易与 ACP 层产生命名冲突和职责混乱。

## What Changes

- **BREAKING** 将 `shared/types/agents.ts` 中所有 ACP 相关类型加 `Acp` 前缀（`AcpAgentEntry`、`AcpAgentStatus`、`AcpInstallProgress` 等），文件重命名为 `acp-agent.ts`
- **BREAKING** `AgentsChannels` 重命名为 `AcpAgentChannels`，channel 字符串从 `settings:agents:*` 改为 `acp:*`
- 将 `settings` store 中的 ACP agent 状态与 actions 拆分到独立的 `acp-agents` store
- `electron/main/agents/` 目录重命名为 `electron/main/acp/`，`ipc/agents.ts` 重命名为 `ipc/acp-agents.ts`
- 新增 `chat-agent` 能力：定义 Chat Agent 数据模型（`ChatAgent` 类型），支持用户在聊天框通过 agent select 组件切换已安装的 ACP agent
- `shared/types/chat.ts` 中的 `AgentInfo`、`AgentType` 替换为 `ChatAgent`
- `docs/CodeStyle.md` 补充文件与目录命名规范（kebab-case）

## Capabilities

### New Capabilities

- `chat-agent-selection`: 定义 ChatAgent 数据模型及其与 ACP agent 的关联关系，支持在 chat 界面选择和切换已安装的 ACP agent

### Modified Capabilities

- `agent-install`: ACP 类型重命名（`AcpAgentEntry`、`AcpInstallProgress`），IPC channel 前缀从 `settings:agents:` 改为 `acp:`
- `agent-registry-cache`: 类型引用更新为 `AcpAgent*` 前缀
- `agent-status-panel`: 类型引用更新，store 来源从 `settings` 改为 `acp-agents`
- `agent-update`: 类型引用更新为 `AcpAgent*` 前缀
- `agent-controls`: `AgentInfo`/`AgentType` 替换为 `ChatAgent`

## Impact

- `shared/types/agents.ts` → `shared/types/acp-agent.ts`，所有类型加 `Acp` 前缀
- `shared/types/channels.ts`：`AgentsChannels` → `AcpAgentChannels`
- `shared/types/chat.ts`：移除 `AgentInfo`、`AgentType`，新增 `ChatAgent`
- `frontend/src/stores/settings.ts`：移除 agent 相关状态
- `frontend/src/stores/acp-agents.ts`：新建，承接 ACP agent 管理逻辑
- `frontend/src/api/settings.ts`：agent API 迁移至 `frontend/src/api/acp-agents.ts`
- `electron/main/agents/` → `electron/main/acp/`
- `electron/main/ipc/agents.ts` → `electron/main/ipc/acp-agents.ts`
- `electron/preload/api/settings.ts`：agent bridge 迁移至 `electron/preload/api/acp-agents.ts`
- `docs/CodeStyle.md`：新增命名规范章节
