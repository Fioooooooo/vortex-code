## 1. OpenSpec 与模块骨架

- [x] 1.1 新增 `app-bootstrap` capability spec，并补充 `chat-agent-selection`、`agent-status-panel`、`project-store-persistence` 的 delta spec
- [x] 1.2 新增 `frontend/src/bootstrap/core.ts`，定义 bootstrap 任务注册与 runner
- [x] 1.3 新增 `frontend/src/bootstrap/register.ts` 与 `frontend/src/bootstrap/tasks/acp-agents.ts`、`frontend/src/bootstrap/tasks/projects.ts`

## 2. ACP agent 初始化迁移

- [x] 2.1 在 `frontend/src/stores/acp-agents.ts` 中增加 `initialized`、`initializing`、`initializationError`、`initPromise`、`ensureInitialized()` 与 `refreshAll()`
- [x] 2.2 修改 `frontend/src/main.ts`，显式注册核心 bootstrap tasks，并在 app mount 后以并发失败隔离方式执行 bootstrap runner，触发 ACP agent 与 projects 预热
- [x] 2.3 修改 `frontend/src/components/settings/SettingsAgents.vue`，移除首次初始化主逻辑，改为消费 store、通过 `refreshAll()` 手动刷新，并在必要时调用 `ensureInitialized()` 兜底
- [x] 2.4 调整 `frontend/src/components/chat/ChatAgentSelect.vue` 与相关消费方，仅依赖 store 响应式数据，不再承担首次加载职责
- [x] 2.5 修改 `frontend/src/stores/project.ts` 与 `frontend/src/pages/index.vue`，移除分散的 projects 首次加载触发点，统一交给 bootstrap task

## 3. 验证

- [x] 3.1 为 bootstrap runner 补测试，覆盖任务注册、并发执行与失败隔离
- [x] 3.2 更新 `frontend/src/__tests__/stores/acp-agents.spec.ts`，覆盖 `ensureInitialized()` 去重、初始化错误状态与 `refreshAll()`
- [x] 3.3 更新相关测试，覆盖 projects bootstrap 预热与页面/ store 不再自启动加载
- [x] 3.4 运行 `pnpm typecheck`
- [x] 3.5 运行 `pnpm vitest run frontend/src/__tests__/stores/acp-agents.spec.ts frontend/src/__tests__/stores/project.spec.ts frontend/src/__tests__/bootstrap/fyllo-bootstrap.spec.ts`
