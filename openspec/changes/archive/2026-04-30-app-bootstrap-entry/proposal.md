## Why

FylloCode 目前缺少一个统一的、应用启动后但不阻塞主流程的前端数据预热入口。结果是 ACP agent 数据的首次加载被错误地绑在 settings 页面，而项目列表加载又分散在 page/store 两处，导致启动期职责不清，后续扩展也没有统一落点。

## What Changes

- 新增一个应用级的前端 bootstrap 入口，用于在 app 启动后异步执行可扩展的初始化任务
- 将 ACP agent 的首次预热从 settings 页面迁移到该 bootstrap 入口
- 将 persisted projects 的首次加载从页面 / store 分散触发迁移到该 bootstrap 入口
- 为 bootstrap 任务提供注册与统一执行机制，支持未来继续追加其他非阻塞启动任务，并以并发失败隔离方式执行
- 调整 `acp-agents` store，使其具备一次性初始化、并发去重、显式初始化错误状态与显式刷新能力
- 调整 settings 页面职责：以全局 bootstrap 为主，但保留轻量 `ensureInitialized()` 兜底，不再承担唯一的首次初始化职责

## Capabilities

### New Capabilities

- `app-bootstrap`: 定义应用启动后的非阻塞 bootstrap 入口、任务注册机制与失败隔离约束

### Modified Capabilities

- `chat-agent-selection`: ACP agent 数据应在 app 启动后预热，聊天区不再依赖 settings 页面触发首次加载
- `agent-status-panel`: settings agents 面板从“首次加载入口”调整为“展示与手动刷新入口”
- `project-store-persistence`: persisted projects 应在 app 启动后的 bootstrap 阶段预热，而不是由 page/store 分散触发首次加载

## Impact

- `frontend/src/main.ts`：挂载统一 bootstrap 执行入口
- `frontend/src/bootstrap/*`：新增 bootstrap 注册与执行模块，以及内置 ACP agent / projects 任务
- `frontend/src/stores/acp-agents.ts`：新增 `ensureInitialized()`、`refreshAll()`、初始化错误状态与更稳健的 loading 管理
- `frontend/src/stores/project.ts`：移除隐式自启动加载，改为由 bootstrap 统一触发 persisted projects 预热
- `frontend/src/pages/index.vue`：移除 `ensureLoaded()` 的 mounted 触发，只保留路由判断
- `frontend/src/components/settings/SettingsAgents.vue`：移除首次初始化主逻辑，改为消费 store、提供显式刷新，并在必要时做轻量兜底初始化
- `frontend/src/components/chat/ChatAgentSelect.vue`、`frontend/src/stores/session.ts`、`frontend/src/components/WelcomeView.vue`：继续消费同一份 store，但不再承担首次初始化职责
- `frontend/src/__tests__/stores/acp-agents.spec.ts`、`frontend/src/__tests__/stores/project.spec.ts` 及新增 bootstrap 测试：覆盖初始化去重、错误状态与并发任务执行语义
