## 1. 主进程持久化层

- [x] 1.1 新增 `electron/main/services/project-store.ts`：实现 `ProjectMeta` 类型、`encodeProjectPath`（路径转 encodedPath）、`saveProject`、`loadProject`、`listProjects`、`deleteProject` 函数；meta 存储路径为 `data/projects/{encodedPath}/meta.json`，`list()` 扫描子目录读取各自的 `meta.json`
- [x] 1.2 在 `shared/types/channels.ts` 的 `ProjectChannels` 中新增 `openFolder: "project:openFolder"` channel（移除 `getActive`/`setActive`，这两个不再需要）
- [x] 1.3 在 `electron/preload/api/project.ts` 中新增 `openFolder()` 方法，移除 `setActive`/`getActive`（若存在）
- [x] 1.4 在 `frontend/src/api/project.ts` 中新增 `openFolder()` 方法，移除 `setActive`/`getActive`（若存在）

## 2. 主进程 IPC Handler 实现

- [x] 2.1 实现 `project:list` handler：调用 `listProjects()`，按 lastOpenedAt 降序排列后返回
- [x] 2.2 实现 `project:getById` handler：调用 `loadProject(encodedPath)` 返回 meta
- [x] 2.3 实现 `project:create` handler：用 `encodeProjectPath(path)` 生成 id、创建目录（`fs.mkdir`）、调用 `saveProject()`，返回 `ProjectInfo`
- [x] 2.4 实现 `project:update` handler：`loadProject` + merge patch + `saveProject`
- [x] 2.5 实现 `project:remove` handler：调用 `deleteProject(encodedPath)`
- [x] 2.6 实现 `project:openFolder` handler：调用 `dialog.showOpenDialog({ properties: ['openDirectory'] })`，用户选择后用 `encodeProjectPath` 生成 id，查找已有 meta 或创建新 meta，更新 `lastOpenedAt`，返回 `ProjectInfo | null`；用户取消则返回 null
- [x] 2.7 在 `project:openFolder` 和 `project:getById` 中加入目录存在检测：用 `fs.access` 检查 path 是否存在，不存在时在返回的 `ProjectInfo` 中附加 `pathMissing: true` 标记（需在 `shared/types/project.ts` 的 `ProjectInfo` 上补充该可选字段）

## 3. 前端 project store 去 mock

- [x] 3.1 删除 `generateMockRecentProjects` 和 `generateMockProjectSummaries` 函数
- [x] 3.2 `projects` 初始化改为空数组，在 store 初始化时调用 `projectApi.list()` 加载真实数据
- [x] 3.3 `openFolder` 改为调用 `projectApi.openFolder()`，成功后调用 `activateProject()` 更新本地状态；若返回 `pathMissing: true` 则 toast 提示目录不存在
- [x] 3.4 `createProject` 改为调用 `projectApi.create(form)`，成功后调用 `activateProject()` 更新本地状态
- [x] 3.5 `openRecentProject` 改为调用 `projectApi.getById(id)` 检查目录是否存在：若 `pathMissing: true` 则 toast 提示目录不存在，不打开项目，不自动移除；否则调用 `activateProject()`
- [x] 3.6 `switchProject` 同 3.5，打开前先检测目录存在性
- [x] 3.7 `removeRecentProject` 改为调用 `projectApi.remove(id)`
- [x] 3.8 `recentProjects` 改为从 `projects` 计算属性派生（按 lastOpenedAt 降序取前 10）
- [x] 3.9 移除 `setActive`/`getActive` 相关调用（不再需要）

## 4. 打通 chat 的 projectPath

- [x] 4.1 在 `electron/main/ipc/chat.ts` 中，`streamMessage` 和 `persistMessage` handler 将 `FALLBACK_PROJECT_PATH` 替换为从 project store 读取的真实 `projectPath`：通过 `loadProject(projectId)` 获取 `path` 字段，`projectId` 由前端在请求参数中传入

## 5. 清理 project 级 agent 占位

- [x] 5.1 在 `shared/types/project.ts` 和 `frontend/src/stores/project.ts` 中移除 `ProjectSummary` / `ProjectAgent` / `DEFAULT_AGENT` 这套仅用于占位的 project-level agent 数据，`projects` 回归为 `ProjectInfo[]`
- [x] 5.2 在 `frontend/src/components/layout/AppHeader.vue` 中移除 header 项目切换器里的 agent 标签展示
- [x] 5.3 在 `frontend/src/components/chat/ProjectSwitcher.vue` 中移除项目列表里的 agent 标签展示，并适配 `projectStore.projects` 的类型变化
