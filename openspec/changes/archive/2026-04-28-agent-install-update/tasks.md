## 1. 共享类型与 IPC 通道

- [x] 1.1 新增 `shared/types/agents.ts`，定义 `AgentRegistry`、`AgentEntry`、`AgentDistribution`（含 `npx`/`uvx`/`binary` 三种）、`InstalledAgentRecord`、`AgentStatus`、`InstallProgress` 等类型；将 `frontend/src/types/settings.ts` 中的 `Agent` 类型迁移至此并删除旧文件
- [x] 1.2 在 `shared/types/channels.ts` 新增 `AgentsChannels`，定义所有 `settings:agents:*` 通道常量；移除 `SettingsChannels.listAgents`

## 2. 主进程 — Registry 缓存模块

- [x] 2.1 创建 `electron/main/agents/registryCache.ts`，实现读写 `getDataSubPath('agents')/registry-cache.json`（结构 `{ fetchedAt, data }`），含 TTL 判断；后台刷新时对比各 agent `icon` URL 变化，删除对应图标缓存文件
- [x] 2.2 实现后台刷新逻辑：缓存过期时先返回旧数据，后台请求成功后通过 `registryUpdated` 推送新数据
- [x] 2.3 创建 `electron/main/agents/iconCache.ts`，实现图标下载、存储到 `getDataSubPath('agents')/icons/<id>`、读取为 base64 data URL，以及版本变化时清空图标目录

## 3. 主进程 — 安装状态检测模块

- [x] 3.1 创建 `electron/main/agents/detector.ts`，实现 npx 类型检测（`npm list -g`）、uvx 类型检测（`uv tool list`）、binary 类型检测（文件存在性）
- [x] 3.2 实现读写 `getDataSubPath('agents')/installed.json`，检测到用户自行安装时自动写入 `managedBy: "user"` 记录
- [x] 3.3 实现 semver 比较，将 `detectedVersion` 与 registry 版本对比，输出 `updateAvailable` 与 `latestVersion`

## 4. 主进程 — 安装模块

- [x] 4.1 创建 `electron/main/agents/installer.ts`，实现并发锁（同时只允许一个安装任务）
- [x] 4.2 实现 npx 安装：环境检测 → `npm install -g` → 进度推送 → 写入 `installed.json`
- [x] 4.3 实现 uvx 安装：环境检测 → `uv tool install` → 进度推送 → 写入 `installed.json`
- [x] 4.4 实现 binary 安装：平台选择 → 下载到临时文件 → 解压到 `getDataSubPath('agents')/bin/<id>/` → 进度推送 → 写入 `installed.json`；下载失败时清理临时文件

## 5. 主进程 — IPC Handler 注册

- [x] 5.1 创建 `electron/main/ipc/agents.ts`，注册 `getRegistry`、`refreshRegistry`、`getIcons`、`detectStatus`、`install` 的 `ipcMain.handle`
- [x] 5.2 在 `electron/main/ipc/index.ts` 中调用 `registerAgentsHandlers()`；从 `electron/main/ipc/settings.ts` 中移除 `listAgents` handler

## 6. Preload — contextBridge 扩展

- [x] 6.1 在 `electron/preload/api/settings.ts` 中将 `settingsApi` 扩展为包含 `agents` 子对象，暴露所有 `settings:agents:*` invoke 通道；同步更新 `electron/preload/index.d.ts` 中的类型声明
- [x] 6.2 新增 `onRegistryUpdated` 和 `onInstallProgress` 监听方法，返回 unsubscribe 函数；从 `settingsApi` 中移除 `listAgents()` 方法

## 7. 前端 API 层

- [x] 7.1 在 `src/api/settings.ts` 中新增 `agentsApi` 对象，封装所有 `window.api.settings.agents.*` 调用

## 8. 前端 Store

- [x] 8.1 在 `src/stores/settings.ts` 中新增 agent 相关状态：`agentRegistry`、`agentIcons`、`agentStatuses`、`installProgress`、`registryLoading`、`registryError`
- [x] 8.2 实现 `loadRegistry()` action：调用 `agentsApi.getRegistry`，监听 `onRegistryUpdated` 推送
- [x] 8.3 实现 `loadIcons()` action：调用 `agentsApi.getIcons`，合并到 `agentIcons`
- [x] 8.4 实现 `refreshAgentStatus()` action：调用 `agentsApi.detectStatus`，更新 `agentStatuses`
- [x] 8.5 实现 `installAgent(agentId)` action：调用 `agentsApi.install`，监听 `onInstallProgress` 推送，安装完成后自动调用 `refreshAgentStatus()`

## 9. 前端组件更新

- [x] 9.1 更新 `SettingsAgents.vue`：移除 `netApi` 调用，改为从 store 读取 `agentRegistry`、`agentIcons`；`onMounted` 调用 `loadRegistry()` + `loadIcons()` + `refreshAgentStatus()`；添加 Refresh 按钮
- [x] 9.2 更新 `AgentCard.vue`：接收 `agentStatus`（含 `installed`、`updateAvailable`、`managedBy`、`latestVersion`）prop；根据状态渲染"安装"/"更新"/"Installed"/"loading"四种右侧区域
- [x] 9.3 在 `AgentCard.vue` 中实现用户自管理 agent 更新的确认对话框（`managedBy: "user"` 且 `updateAvailable: true` 时）
