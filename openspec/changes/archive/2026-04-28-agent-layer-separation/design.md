## Context

当前代码中存在三个"agent"概念，但没有明确的命名边界：

1. **ACP Agent（工具层）**：来自 ACP registry 的软件包描述，关注安装、版本、分发方式。对应 `AgentEntry`、`AgentStatus`、`InstallProgress` 等类型，存储在 `settings` store 中，IPC channel 前缀为 `settings:agents:`。
2. **Chat Agent（会话层）**：用户在 chat 界面选择的"当前 agent"，目前硬编码为 `{ type: "claude-code", name: "Claude Code" }`，类型为 `AgentInfo`/`AgentType`，存储在 `chat` store 中。
3. **两者之间缺少关联模型**：未来 Chat Agent 需要引用某个已安装的 ACP Agent，并携带独立的配置（options、system prompt 等），但目前没有任何类型或数据结构来表达这层关系。

此次重构的目标是在不改变任何用户可见行为的前提下，建立清晰的命名边界，为后续 Chat Agent 选择功能打好基础。

## Goals / Non-Goals

**Goals:**

- 所有 ACP 相关类型加 `Acp` 前缀，文件重命名为 `acp-agent.ts`，消除与 Chat Agent 的命名歧义
- ACP agent 管理逻辑从 `settings` store 中独立出来，迁移到 `acp-agents` store
- IPC channel 从 `settings:agents:*` 改为 `acp:*`，反映其独立于 settings 的领域地位
- 定义 `ChatAgent` 数据模型，明确其与 ACP Agent 的关联方式（通过 `acpAgentId` 引用）
- `docs/CodeStyle.md` 补充文件与目录命名规范

**Non-Goals:**

- 不实现 Chat Agent 选择 UI（agent select 组件）
- 不实现 Chat Agent 的持久化存储
- 不修改任何用户可见的交互行为
- 不修改 ACP agent 安装、检测、更新的业务逻辑

## Decisions

### 决策 1：ACP 类型统一加 `Acp` 前缀

**选择**：`AgentEntry` → `AcpAgentEntry`，`AgentStatus` → `AcpAgentStatus`，`InstallProgress` → `AcpInstallProgress`，`InstalledAgentRecord` → `AcpInstalledRecord`，`AgentRegistry` → `AcpRegistry`，`AgentRegistryCache` → `AcpRegistryCache`，`InstalledAgentsMap` → `AcpInstalledMap`。

**理由**：TypeScript 项目中类型名是全局可见的，前缀是区分两层概念最直接的方式，避免未来 `ChatAgent` 引入后产生歧义。`Acp` 比 `AcpAgent` 更简洁（`AcpAgentEntry` 而非 `AcpAgentAgentEntry`）。

**备选方案**：用命名空间（`namespace Acp { ... }`）——但 namespace 在 ESM 项目中使用不便，且与项目现有风格不符。

### 决策 2：IPC channel 从 `settings:agents:*` 改为 `acp:*`

**选择**：`settings:agents:getRegistry` → `acp:getRegistry`，以此类推。

**理由**：ACP agent 管理是独立的系统能力，不属于 settings 的子域。channel 命名应反映领域，而非 UI 入口位置。未来 Chat Agent 相关 IPC 可以使用 `chat-agent:*` 前缀，保持一致的命名模式。

### 决策 3：ACP agent store 独立为 `acp-agents` store

**选择**：从 `settings` store 中拆出所有 agent 相关状态和 actions，新建 `frontend/src/stores/acp-agents.ts`。

**理由**：`settings` store 的职责应该是用户偏好配置（preferences），而 ACP agent 的 registry、安装状态、安装进度是独立的系统状态，生命周期和关注点都不同。拆分后两个 store 各自职责清晰，也便于 `chat` store 未来直接引用 `acp-agents` store 获取已安装列表。

### 决策 4：`ChatAgent` 通过 `acpAgentId` 引用 ACP Agent

**选择**：

```typescript
// shared/types/chat-agent.ts
export interface ChatAgent {
  id: string; // ChatAgent 自身的唯一标识
  name: string; // 显示名称（可自定义）
  acpAgentId: string; // 关联的 ACP agent id
}
```

**理由**：ChatAgent 和 AcpAgent 是不同生命周期的实体——ACP agent 是系统级安装，ChatAgent 是用户在会话中的选择与配置。通过 `acpAgentId` 引用而非直接嵌套，保持两层解耦。未来 ChatAgent 可以扩展 options、system prompt 等字段，不影响 ACP 层。

**此次只定义类型**，不实现持久化和 UI，为下一步 chat-agent-selection 功能打基础。

### 决策 5：目录命名全部使用 kebab-case

**选择**：`electron/main/agents/` → `electron/main/acp/`，`ipc/agents.ts` → `ipc/acp-agents.ts`，`api/settings.ts` 中的 agent 部分迁移至 `api/acp-agents.ts`，preload 同理。

**理由**：TypeScript/Node 生态主流约定，与项目现有目录风格一致。驼峰只用于类名和类型名，不用于文件系统。

## Risks / Trade-offs

- **IPC channel 重命名是 breaking change** → 主进程和 preload 必须同步修改，不能有遗漏。迁移时通过 TypeScript 类型检查确保所有引用都已更新。
- **store 拆分需要更新所有组件引用** → `SettingsAgents.vue`、`AgentCard.vue` 等组件需要从 `useSettingsStore` 改为 `useAcpAgentsStore`。通过全局搜索确保无遗漏。
- **`ChatAgent` 类型此次只是占位定义** → `chat.ts` 中的 `AgentInfo`/`AgentType` 替换为 `ChatAgent` 后，`currentAgent` 的初始值需要调整，但 chat 功能本身不受影响（底层仍是 claude-code headless 模式）。

## Migration Plan

1. 重命名共享类型（`shared/types/`）——所有消费方会立即出现 TS 错误，作为迁移进度的指引
2. 更新 IPC channels（`shared/types/channels.ts`）
3. 迁移主进程代码（`electron/main/agents/` → `electron/main/acp/`，`ipc/agents.ts` → `ipc/acp-agents.ts`）
4. 迁移 preload（`electron/preload/api/`）
5. 新建 `acp-agents` store，从 `settings` store 中移除 agent 相关代码
6. 迁移前端 API 层（`frontend/src/api/acp-agents.ts`）
7. 更新所有组件引用
8. 新增 `ChatAgent` 类型，更新 `chat.ts`
9. 更新 `docs/CodeStyle.md`

每步完成后运行 `pnpm typecheck` 验证，最终运行 `pnpm test` 确保无回归。

## Open Questions

- `ChatAgent` 未来是否需要持久化（存入 project 配置还是全局配置）？此次不决策，留给 chat-agent-selection change。
- 是否需要支持同一个 ACP agent 创建多个 ChatAgent 实例（不同配置）？此次不决策。
