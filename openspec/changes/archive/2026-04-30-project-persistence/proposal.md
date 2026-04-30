## Why

当前 project store 全部使用 mock 数据（硬编码的假项目列表、假路径），主进程 IPC handler 均为空壳（返回 `[]` / `null`），导致项目无法真实创建、持久化和恢复。这是 session 接入的前置依赖——session 的存储路径以 `projectPath` 为根键，没有真实 project 上下文，session 数据就无法正确归属。

## What Changes

- 新增主进程 project 持久化层：project meta 以 `meta.json` 存储在 `data/projects/{encodedPath}/` 子目录下，与 session 数据共用同一目录结构
- 实现主进程 IPC handler：`list`、`getById`、`create`、`update`、`remove`、`openFolder`
- 实现 `openFolder`：通过 Electron dialog 让用户选择本地目录，返回真实路径
- 实现 `createProject`：在指定路径创建目录（支持空项目和 Git 克隆模板），写入 meta
- 前端 project store 去 mock：初始化时从 IPC 加载真实项目列表，所有写操作调用 IPC
- 移除 project store 中仅用于占位的 project-level agent 数据，project 列表统一回归为真实 `ProjectInfo`
- 每次启动进入 welcome 页，无 active 状态持久化，用户手动选择项目
- 打开项目时做目录存在检测，不存在则提示用户，移除操作由用户主动触发
- `recentProjects` 从持久化数据派生，不再使用 mock
- Header 中不再展示 agent 标签，聊天时的 agent 切换统一由 Chat Prompt 区域的 `ChatAgentSelect` 承担

## Capabilities

### New Capabilities

- `project-store-persistence`: 主进程 project 元数据的文件系统持久化层（读写、列表、删除），meta 存于 `data/projects/{encodedPath}/meta.json`，与 session-store 目录结构对齐

### Modified Capabilities

- `project-creation`: 从 mock setTimeout 改为真实目录创建 + IPC 调用
- `recent-projects`: 从 mock 数据改为从持久化 project 列表派生最近项目
- `project-switcher`: 切换项目时调用真实 IPC，打开前检测目录存在性

## Impact

- `electron/main/ipc/project.ts` — 实现所有 handler
- `electron/main/services/project-store.ts` — 新增持久化服务（类比 `session-store.ts`）
- `frontend/src/stores/project.ts` — 去除所有 mock，改为 IPC 调用
- `shared/types/project.ts` — 补充 `ProjectMeta` 类型（主进程存储格式）及 `pathMissing` 可选字段
- `frontend/src/components/layout/AppHeader.vue` — 去掉 header 中的 agent 展示
- `frontend/src/components/chat/ProjectSwitcher.vue` — 去掉项目列表中的 agent 标签
- `electron/main/ipc/chat.ts` — `FALLBACK_PROJECT_PATH` 替换为从 project store 读取的真实路径
