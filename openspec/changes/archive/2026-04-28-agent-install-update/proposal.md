## Why

Settings 页面的 Agents tab 目前只能从 ACP registry 展示 agent 列表，无法安装、检测安装状态或更新；网络不佳时页面直接报错，无任何降级。需要补全从"浏览"到"安装/更新"的完整闭环，并通过本地缓存保证弱网下的可用性。

## What Changes

- 新增 registry 本地缓存（`getDataSubPath('agents')/registry-cache.json`），主进程负责读写，弱网时降级展示缓存数据
- 新增 agent 图标本地缓存（`getDataSubPath('agents')/icons/<agent-id>`），避免每次重新下载
- 新增 `getDataSubPath('agents')/installed.json`，记录每个已安装 agent 的安装方式、路径、版本、管理方（FylloCode / 用户自行安装）
- 新增安装流程：支持 `npx`（npm global install）、`uvx`（uv tool install）、`binary`（平台特定 archive 下载解压）三种分发方式
- 新增更新检测：比对本地版本与 registry 版本，展示"Update Available"状态
- 更新检测区分管理方：用户自行安装的 agent 更新前需二次确认
- 前端请求链路全部迁移至 `settings:agents:*` IPC 通道，移除 `netApi` 在 Agents 页面的直接使用
- 前端链路规范为：component → store → `src/api/settings` → IPC → main

## Capabilities

### New Capabilities

- `agent-registry-cache`: 主进程管理 ACP registry 数据与图标的本地缓存，提供后台刷新与弱网降级
- `agent-install`: agent 安装流程，支持 npx / uvx / binary 三种分发方式，含进度推送
- `agent-update`: 已安装 agent 的更新检测与更新执行，区分 FylloCode 管理与用户自管理

### Modified Capabilities

- `agent-status-panel`: 在现有安装状态展示基础上，新增"Update Available"状态、安装操作入口、安装进度展示，以及 registry 数据来源从 netApi 迁移至 store

## Impact

- **新增 IPC 通道**（`settings:agents:*`）：getRegistry、refreshRegistry、getIcons、detectStatus、install、registryUpdated（push）、installProgress（push）
- **新增主进程模块**：`electron/main/agents/`（registry cache、icon cache、installer、detector）
- **新增/修改前端**：`src/api/settings.ts`（新增 agents 方法）、`src/stores/settings.ts`（新增 agent 状态）、`SettingsAgents.vue`、`AgentCard.vue`
- **新增共享类型**：`shared/types/agents.ts`（AgentRegistryCache、InstalledAgentRecord、InstallMethod 等）
- **新增持久化文件**：通过 `getDataSubPath('agents')` 获取根目录，存储 `registry-cache.json`、`installed.json`、`icons/<id>`、`bin/<id>/`（binary 类型）
- **移除旧通道**：`SettingsChannels.listAgents`（`settings:listAgents`）及对应 preload 方法，由 `settings:agents:detectStatus` 替代
- **依赖**：安装 npx 类型需要 Node/npm 环境，uvx 类型需要 uv 环境，binary 类型需要网络下载权限
