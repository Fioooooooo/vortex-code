## Why

Chat 模块当前最大的缺口仍然是 session 与磁盘持久化没有真正打通，但现有 change 对"新建 Session"的定义并不合理：用户点击按钮后就立即创建并落盘一个空 session，会在列表里产生尚未开始对话的占位项，也迫使前端在 session 尚不存在时就决定并写死 `agentId`。

更合理的行为是把"点击新建"定义为进入一个**草稿态**：清空当前选中的 session，让 Chat 区域回到空白输入态；只有当用户真正发出第一条消息时，系统才创建并持久化新的 session，并把该条消息作为会话的起点。

## What Changes

- **新建 Session 改为进入草稿态**：点击按钮后不立即创建 session 文件，不插入 session 列表，只是清空 `activeSessionId`，让主区域进入无历史消息的空白态
- **首条消息时懒创建 session**：当用户在草稿态发送第一条消息时，前端先固定当时的 `projectId`、`draftAgentId` 与输入内容，再调用 `createSession` 持久化 session 元数据；只有创建成功后，才写入首条消息并开始流式对话
- **草稿态 agent 选择改为响应式状态**：当没有 active session 时，`ChatAgentSelect` 绑定到独立的草稿态 `draftAgentId`，并始终从已安装 agent 集合中解析，不使用任何硬编码 fallback
- **首条消息发送路径保持原子性**：若草稿态 `createSession` 失败，系统不得留下半创建状态，不新增 session 条目，也不写入首条消息文件
- **保留真实持久化链路**：session 列表、历史消息加载、重命名、删除、`session_info_update` 标题更新等仍然基于磁盘持久化实现

## Capabilities

### New Capabilities

无新增独立 capability。

### Modified Capabilities

- `session-management`：将"新建 Session"从"立即创建并持久化空会话"改为"进入草稿态，首条消息时懒创建并持久化"
- `chat-agent-selection`：agent 选择器在无 active session 的草稿态下也可工作，绑定到草稿态 agent，而不是依赖 `activeSession`
- `acp-chat-backend`：`createSession` IPC 的调用时机从"点击新建按钮"调整为"草稿态发送首条消息前"

## Impact

- `frontend/src/stores/session.ts`：新增草稿态状态（如 `draftAgentId`），`createSession`/`New Session` 相关逻辑改为进入草稿态而非立即 IPC 创建
- `frontend/src/stores/chat.ts`：`sendMessage` 在无 active session 时先懒创建 session，再持久化首条用户消息并开始流式对话
- `frontend/src/stores/acp-agents.ts`：提供可复用的默认已安装 agent 解析能力，避免在 session store 内硬编码 agentId
- `frontend/src/components/chat/ChatContainer.vue`：支持无 active session 的空白草稿态
- `frontend/src/components/chat/ChatAgentSelect.vue`：在 active session 与草稿态 agent 之间切换绑定
- `openspec/changes/real-session-integration/specs/*`：更新 session-management 与 chat-agent-selection 的 requirement/scenario
- `openspec/changes/real-session-integration/tasks.md`：按新的草稿态 / 懒创建方案重新整理剩余实现任务
