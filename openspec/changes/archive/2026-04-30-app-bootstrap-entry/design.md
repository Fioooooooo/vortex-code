## Context

当前前端缺少统一的“应用启动后异步预热”扩展点。`SettingsAgents.vue` 在页面 `onMounted` 时手动执行 `loadRegistry()`、`loadIcons()`、`refreshStatus()`，而 `projects` 的首次加载又同时分散在 `pages/index.vue` 和 `project` store 自启动逻辑里，导致启动期职责边界不清晰。

本次改动需要建立一个通用 bootstrap 机制，满足以下约束：

- app 主界面必须先正常挂载，不得等待 bootstrap 完成
- bootstrap 任务应支持未来持续增加，而不是把逻辑堆在 `main.ts`
- 单个任务失败不得中断其他任务，也不得阻塞主流程
- 任务执行结果应沉淀在各自 store 中，由消费页面自动响应

## Goals / Non-Goals

**Goals:**

- 提供统一的 `onFylloBootstrap` / `runBootstrapTasks` 入口
- 将 ACP agent 数据预热与 persisted projects 预热注册为首批 bootstrap 任务
- 让 chat/settings/session 等页面统一依赖同一份已预热的 `acp-agents` store
- 让 welcome/header/project-switcher 等页面统一依赖同一份已预热的 `project` store
- 保证初始化调用具备并发去重能力，避免重复请求

**Non-Goals:**

- 引入复杂的优先级调度、依赖图或取消机制
- 让 bootstrap 任务阻塞 app mount 或首屏路由渲染
- 在本次改动里新增除 ACP agent 之外的其他预热任务

## Decisions

### 决策 1：bootstrap 入口放在前端应用级，而不是页面级

新增 `frontend/src/bootstrap/core.ts`，对外提供：

- `onFylloBootstrap(task)`
- `runBootstrapTasks(context)`

`main.ts` 在 app `mount("#app")` 之后以 fire-and-forget 方式执行 `runBootstrapTasks(...)`。这样 bootstrap 不会阻塞主流程，同时也不会再依赖任意页面组件的 mounted 时机。

### 决策 2：任务注册与任务执行分离

新增：

- `frontend/src/bootstrap/tasks/acp-agents.ts`
- `frontend/src/bootstrap/tasks/projects.ts`
- `frontend/src/bootstrap/register.ts`

每个任务文件只负责调用 `onFylloBootstrap(...)` 注册自身；`register.ts` 负责集中 import 内置任务。未来如果增加 `loadOtherElse()`、`initSomething()`，只需要新增任务文件并在该注册文件中引入即可。

### 决策 3：bootstrap runner 非阻塞、并发执行且失败隔离

`runBootstrapTasks(context)` 使用 `Promise.allSettled(...)` 并发执行当前注册任务，但不会 `throw` 到调用方。每个任务的失败都被隔离并记录日志，不影响其他任务完成。

这满足：

- 主流程不被 bootstrap 失败打断
- 单个任务失败不影响其他任务
- 独立任务之间默认不会相互等待
- 日后可以在日志中定位具体失败任务

### 决策 4：核心任务显式注册，而不是只依赖副作用 import

`register.ts` 对外提供显式的 `registerBootstrapTasks()`，内部负责注册内置任务。`main.ts` 先调用该注册函数，再触发 `runBootstrapTasks(...)`。

这比单纯依赖 `import "./tasks/foo"` 的副作用更清晰，也更利于测试和未来维护。

### 决策 5：ACP agent store 自己负责初始化去重和错误建模

`useAcpAgentsStore` 增加：

- `initialized`
- `initializing`
- `initializationError`
- `initPromise`
- `ensureInitialized()`
- `refreshAll()`

其中：

- `ensureInitialized()`：首次初始化入口，负责监听器注册、registry/status/icons 加载，以及并发去重
- `initializationError`：表示最近一次初始化失败的错误信息
- `refreshAll()`：settings 页显式刷新入口，负责主动刷新 registry 后重新拉取 icons/status

这样 bootstrap 任务和 settings 页面都只调用语义化 action，而不是自己拼装底层加载顺序。

### 决策 6：ACP agent 初始化成功判定与 loading 管理要明确

`ensureInitialized()` 不得在关键初始化失败时仍标记 `initialized = true`。只有在首次预热链路成功完成后，才可置为已初始化。

同时，所有带 loading 的异步 action 都应使用 `try/finally` 确保状态可回收，避免界面卡死在 loading 状态。

### 决策 7：ACP agent 初始化顺序

`ensureInitialized()` 的推荐顺序：

1. `ensureAgentListeners()`
2. `loadRegistry()`
3. `Promise.all([loadIcons(), refreshStatus()])`

原因是 `loadIcons()` 和 `detectStatus()` 内部都会依赖主进程 `getRegistry()`，但前端先持有 registry 后可以更早恢复标签、名称和错误状态语义。该顺序也与现有逻辑兼容，改动最小。

### 决策 8：SettingsAgents 以 bootstrap 为主，但保留轻量兜底

`SettingsAgents.vue` 不再承担全局首次初始化的主责任，但在 mounted 时可以执行轻量兜底：

- 若 `!initialized && !initializing`
- 则调用 `ensureInitialized()`

这样可以在未来某个入口漏掉 bootstrap 时，页面仍具备自愈能力，同时不改变“全局 bootstrap 为主路径”的职责边界。

### 决策 9：SettingsAgents 只保留展示与手动刷新职责

`SettingsAgents.vue` 移除 `onMounted` 中的首次加载逻辑，不再承担全局初始化责任。其“刷新”按钮改为调用 `store.refreshAll()`，页面只消费：

- `registry`
- `icons`
- `statuses`
- `installProgress`
- `registryLoading`
- `registryError`

### 决策 10：projects 预热也纳入 bootstrap 主路径

`projectStore.ensureLoaded()` 应由 bootstrap task 统一触发，避免：

- `pages/index.vue` 在 mounted 时主动拉取
- `project` store 在模块初始化时隐式自启动

迁移后：

- bootstrap 负责 persisted projects 首次预热
- `project` store 只暴露 `loadProjects()` / `ensureLoaded()` 能力
- `pages/index.vue` 只保留路由保护与 `/ -> /chat` 跳转判断

### 决策 11：聊天侧不主动拉取，仅消费预热结果

`ChatAgentSelect.vue` 与 `session.ts` 保持响应式消费 store 状态，不再增加额外初始化逻辑。bootstrap 完成后：

- `installedAgentIds` 自动更新
- `draftAgentId` 的 watch 自动回填
- `ChatAgentSelect` 的下拉项自动出现

## Risks / Trade-offs

- [Bootstrap 任务静默失败] → 通过统一 logger 记录任务名和错误，且不阻塞主流程
- [重复初始化请求] → `acp-agents` store 内部用 `initPromise` 去重
- [初始化失败后被误判为成功] → 通过 `initializationError` 与成功后才设置 `initialized = true` 避免误判
- [未来任务数量增加后 `register.ts` 变大] → 先接受集中注册文件，后续再按领域拆分
- [部分页面在 bootstrap 完成前短暂拿不到数据] → 这是可接受的短暂空态，UI 会随 store 更新自动恢复
- [projects 数据在 bootstrap 完成前短暂为空] → `WelcomeView` 与 header 继续消费 store 响应式状态，预热完成后自动更新
