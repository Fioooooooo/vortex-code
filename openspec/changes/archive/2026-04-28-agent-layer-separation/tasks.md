## 1. 共享类型重命名

- [x] 1.1 将 `shared/types/agents.ts` 重命名为 `shared/types/acp-agent.ts`，所有类型加 `Acp` 前缀：`AgentEntry` → `AcpAgentEntry`，`AgentRegistry` → `AcpRegistry`，`AgentRegistryCache` → `AcpRegistryCache`，`AgentStatus` → `AcpAgentStatus`，`InstallProgress` → `AcpInstallProgress`，`InstalledAgentRecord` → `AcpInstalledRecord`，`InstalledAgentsMap` → `AcpInstalledMap`
- [x] 1.2 在 `shared/types/channels.ts` 中将 `AgentsChannels` 重命名为 `AcpAgentChannels`，所有 channel 字符串从 `settings:agents:*` 改为 `acp:*`（如 `acp:getRegistry`、`acp:install`、`acp:installProgress` 等）
- [x] 1.3 新建 `shared/types/chat-agent.ts`，定义 `ChatAgent` 类型（`id`、`name`、`acpAgentId` 字段）
- [x] 1.4 更新 `shared/types/chat.ts`：移除 `AgentInfo`、`AgentType`，导入并使用 `ChatAgent`；更新 `ProjectAgent` 中的 agent 类型引用

## 2. 主进程迁移

- [x] 2.1 将 `electron/main/agents/` 目录重命名为 `electron/main/acp/`，更新目录内所有文件对 `shared/types/acp-agent.ts` 的类型引用
- [x] 2.2 将 `electron/main/ipc/agents.ts` 重命名为 `electron/main/ipc/acp-agents.ts`，更新 `AcpAgentChannels` 引用及所有类型引用
- [x] 2.3 更新 `electron/main/ipc/index.ts`：将 `registerAgentsHandlers` 改为从 `acp-agents.ts` 导入

## 3. Preload 迁移

- [x] 3.1 新建 `electron/preload/api/acp-agents.ts`，将原 `settings.ts` 中的 agent bridge 代码迁移过来，使用 `AcpAgentChannels`
- [x] 3.2 更新 `electron/preload/index.ts`：将 `window.api.settings.agents` 改为 `window.api.acpAgents`，引入新的 `acp-agents` bridge

## 4. 前端 API 层迁移

- [x] 4.1 新建 `frontend/src/api/acp-agents.ts`，将原 `api/settings.ts` 中的 `agentsApi` 迁移过来，调用路径改为 `window.api.acpAgents.*`，类型引用改为 `AcpAgent*`
- [x] 4.2 更新 `frontend/src/api/settings.ts`：移除 `agentsApi` 导出

## 5. Store 拆分

- [x] 5.1 新建 `frontend/src/stores/acp-agents.ts`，将 `settings` store 中的 `agentRegistry`、`agentIcons`、`agentStatuses`、`installProgress`、`registryLoading`、`registryError` 及相关 actions（`loadRegistry`、`loadIcons`、`refreshAgentStatus` → `refreshStatus`、`installAgent`、`ensureAgentListeners`）迁移过来，使用 `acpAgentsApi`
- [x] 5.2 更新 `frontend/src/stores/settings.ts`：移除所有 agent 相关状态和 actions，只保留 preferences 相关逻辑
- [x] 5.3 更新 `frontend/src/stores/chat.ts`：将 `currentAgent` 类型从 `AgentInfo` 改为 `ChatAgent`，更新初始值（补充 `id` 和 `acpAgentId` 字段）

## 6. 组件更新

- [x] 6.1 更新 `frontend/src/components/settings/SettingsAgents.vue`：将 `useSettingsStore` 改为 `useAcpAgentsStore`，更新所有 store 属性引用（`agentRegistry` → `registry`，`agentStatuses` → `statuses`，`agentIcons` → `icons`，`refreshAgentStatus` → `refreshStatus`）
- [x] 6.2 更新 `frontend/src/components/settings/AgentCard.vue`：更新 props 类型引用为 `AcpAgentEntry`、`AcpAgentStatus`、`AcpInstallProgress`

## 7. 文档更新

- [x] 7.1 在 `docs/CodeStyle.md` 中新增"命名规范"章节，明确：目录与文件名使用 kebab-case；TypeScript 类型/接口/类名使用 PascalCase；变量、函数、store action 使用 camelCase；IPC channel 字符串使用 `domain:action` 格式（kebab-case domain）；禁止在文件系统中使用驼峰命名

## 8. 验证

- [x] 8.1 运行 `pnpm typecheck` 确保无类型错误
- [x] 8.2 运行 `pnpm test` 确保无测试回归
- [ ] 8.3 启动应用验证 Settings → Agents 页面功能正常（列表加载、安装状态检测、安装流程）
