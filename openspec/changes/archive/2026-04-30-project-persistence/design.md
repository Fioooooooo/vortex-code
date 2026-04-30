## Context

FylloCode 是 Electron + Vue 3 桌面应用。当前 project store 全部使用 mock 数据，主进程 IPC handler 均为空壳。session 存储以 `projectPath` 为根键（`data/projects/{encodedPath}/sessions/`），因此 project 持久化是 session 接入的前置依赖。

现有参考实现：`electron/main/chat-agent/session-store.ts` 已实现类似的文件系统持久化模式（JSON meta + JSONL messages），project store 将沿用相同模式。

## Goals / Non-Goals

**Goals:**

- 主进程实现 project 元数据的文件系统持久化（CRUD）
- 实现 `openFolder`（Electron dialog 选择目录）和 `createProject`（创建目录 + 写 meta）
- 前端 project store 去 mock，所有操作走 IPC
- 打开项目时做目录存在检测，不存在则提示用户，不自动移除
- `recentProjects` 从持久化数据派生（按 `lastOpenedAt` 排序取前 10）
- 移除 project store 中不真实的 project-level agent 占位数据

**Non-Goals:**

- active project 状态持久化（每次启动进 welcome 页，用户手动选项目）
- Git 克隆模板的实际 git 操作（本次只创建目录，git clone 留后续）
- project 级别的 agent 绑定持久化
- 项目文件监听或变更检测

## Decisions

### 1. 存储格式：meta.json 存于 encodedPath 子目录

每个 project 的元数据存储为 `data/projects/{encodedPath}/meta.json`，内容为 `ProjectMeta`（含 id、name、path、createdAt、lastOpenedAt）。

```
data/projects/
  Users-tao-projects-foo/
    meta.json          ← project 元数据
    sessions/          ← session 数据（session-store 已有）
      abc.json
      abc.messages.jsonl
```

`list()` 时扫描 `data/projects/` 下所有子目录，读取每个子目录的 `meta.json`。

**理由**：project meta 与 session 数据共用同一 `{encodedPath}/` 子目录，结构清晰，不会与 session 文件混淆；`list()` 只需读 `meta.json`，无需过滤 `.json` 与子目录的混合结果。

**备选**：`{encodedPath}.json` 平铺在 `data/projects/` 下 → 与 session 子目录混在同一层，`list()` 需要区分文件和目录，容易出错。

### 2. projectId = encodedPath

`projectId` 直接使用 `encodedPath`（将路径中的 `/` 替换为 `-`，去掉开头的 `/`），例如 `/Users/tao/projects/foo` → `Users-tao-projects-foo`。

**理由**：session-store 已使用相同的 `encodeProjectPath` 函数，保持一致；project 强依赖 path，ID 与 path 绑定是合理的；避免引入额外 ID 生成依赖。

**路径变化处理**：用户移动目录后，旧 encodedPath 对应的 meta 仍保留在列表中，打开时检测目录是否存在，不存在则提示用户，移除操作由用户主动触发。

### 3. openFolder：Electron dialog，主进程处理

`openFolder` 通过新增 IPC channel `project:openFolder` 触发主进程 `dialog.showOpenDialog`，返回选中路径后查找已有 meta 或创建新 meta。

**理由**：Electron dialog 只能在主进程调用。preload 层已有 project API 结构，新增一个 channel 即可。

### 4. 无 active 状态，每次启动进 welcome 页

不持久化 active project，应用每次启动默认无项目，进入 welcome 页，由用户手动选择。

**理由**：project 强依赖 path，路径可能失效；强制用户每次主动选择，避免启动时出现"项目不存在"的异常状态。

### 5. recentProjects 派生自 projects 列表

不单独维护 recentProjects 列表，直接从 `list()` 返回的 projects 按 `lastOpenedAt` 降序排列取前 10。

**理由**：消除数据冗余，打开项目时更新 `lastOpenedAt`，列表自然更新。

### 6. 项目列表不再派生 project-level agent

`projects` 在前端 store 中直接保存 `ProjectInfo[]`，不再额外包装为带 `agent` 字段的 `ProjectSummary[]`。Header 中的 agent 标签一并移除，聊天时的 agent 选择入口统一保留在 Chat Prompt 的 `ChatAgentSelect`。

**理由**：当前 project 持久化链路并不产生 project 级 agent 数据，`DEFAULT_AGENT` 只是为了满足旧 UI/类型而硬塞的占位值，会制造“每个项目绑定一个 agent”的假象；实际 agent 切换已经由 chat 层承担，继续保留该占位没有价值。

## Risks / Trade-offs

- **文件系统并发**：多窗口场景下并发写同一 project JSON 有竞态。当前 FylloCode 为单窗口应用，暂不处理。
- **路径变化**：用户移动项目目录后，存储的 path 失效，encodedPath 对应的 meta 变为"悬空"记录。打开时检测并提示，移除由用户决定。
- **Git 克隆留空**：`createProject` 选择 git 模板时，本次只创建目录，不执行 clone，UI 上需要说明或禁用该选项，避免用户误解。
