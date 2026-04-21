## 1. 共享类型和基础设施

- [x] 1.1 创建 `shared/types/ipc.ts`，定义 `IpcResponse<T>`、`IpcErrorInfo`、`StreamMessage` 类型
- [x] 1.2 创建 `shared/types/channels.ts`，定义所有 IPC channel 常量（按域分组：chat、project、pipeline、integration、settings、window）
- [x] 1.3 将 `frontend/src/types/` 下的业务类型（chat、project、pipeline、integration、settings）迁移到 `shared/types/`
- [x] 1.4 更新 frontend 中所有从 `@renderer/types/` 引用业务类型的 import 改为 `@shared/types/`
- [x] 1.5 删除 `frontend/src/types/` 下已迁移的文件（保留 `welcome.ts` 等纯前端类型）
- [x] 1.6 在 `electron.vite.config.ts` 中为 main/preload/renderer 三个构建目标添加 `@shared` 路径别名指向项目根目录的 `shared/`
- [x] 1.7 更新 `tsconfig` 配置，确保 `@shared` 路径在三个构建目标中均可解析

## 2. Main 层 IPC Handler 框架

- [x] 2.1 创建 `electron/main/ipc/index.ts`，导出 `registerAllHandlers()` 统一注册函数
- [x] 2.2 创建 `electron/main/ipc/utils.ts`，实现 `wrapHandler()` 工具函数——统一捕获异常并包装为 `IpcResponse`
- [x] 2.3 创建 `electron/main/ipc/chat.ts`，注册 chat 域的 handler 骨架（`chat:listSessions`、`chat:sendMessage`、`chat:stream:message` 等）
- [x] 2.4 创建 `electron/main/ipc/project.ts`，注册 project 域的 handler 骨架（`project:list`、`project:getById`、`project:create`、`project:update`、`project:remove`）
- [x] 2.5 创建 `electron/main/ipc/pipeline.ts`，注册 pipeline 域的 handler 骨架
- [x] 2.6 创建 `electron/main/ipc/integration.ts`，注册 integration 域的 handler 骨架
- [x] 2.7 创建 `electron/main/ipc/settings.ts`，注册 settings 域的 handler 骨架
- [x] 2.8 创建 `electron/main/ipc/window.ts`，注册 window 域的 handler 骨架（minimize、maximize、close、toggleDevTools）
- [x] 2.9 在 `electron/main/index.ts` 中移除 `ping` handler，调用 `registerAllHandlers()`

## 3. Preload 层领域 API

- [x] 3.1 创建 `electron/preload/api/chat.ts`，封装 chat 域的请求-响应 API 和流式 API（`streamMessage` 使用 MessagePort 回调封装）
- [x] 3.2 创建 `electron/preload/api/project.ts`，封装 project 域的标准 CRUD API
- [x] 3.3 创建 `electron/preload/api/pipeline.ts`，封装 pipeline 域的 API 和事件订阅（`onStageChanged`、`onRunCompleted`）
- [x] 3.4 创建 `electron/preload/api/integration.ts`，封装 integration 域的 API
- [x] 3.5 创建 `electron/preload/api/settings.ts`，封装 settings 域的 API
- [x] 3.6 创建 `electron/preload/api/window.ts`，封装 window 域的 API
- [x] 3.7 重构 `electron/preload/index.ts`，组合所有域 API 并通过 `contextBridge.exposeInMainWorld('api', { ... })` 暴露
- [x] 3.8 更新 `electron/preload/index.d.ts`，将 `Window.api` 类型从 `unknown` 改为具体的领域 API 接口类型

## 4. 流式通信实现

- [x] 4.1 在 `electron/main/ipc/chat.ts` 中实现 `chat:stream:message` handler 的 MessagePort 创建和 port 传递逻辑
- [x] 4.2 在 `electron/preload/api/chat.ts` 中实现 `streamMessage` 的 MessagePort 接收、回调分发和 cancel 函数
- [x] 4.3 在 `electron/main/ipc/pipeline.ts` 中实现 `event.sender.send` 推送 Pipeline 状态变更事件
- [x] 4.4 在 `electron/preload/api/pipeline.ts` 中实现 `onStageChanged` 等订阅 API，确保返回 unsubscribe 函数

## 5. 验证和清理

- [x] 5.1 运行 `vue-tsc` 确认无 TypeScript 类型错误
- [x] 5.2 运行 `npm run dev` 确认应用正常启动，`window.api` 在 renderer 中可访问
- [x] 5.3 在 renderer 控制台验证 `window.api` 的结构符合预期（包含 chat、project、pipeline、integration、settings、window 六个域）
- [x] 5.4 验证一个完整的请求-响应流程（如 `window.api.project.list()`）返回 `IpcResponse` 结构
- [x] 5.5 验证流式 API（`window.api.chat.streamMessage`）的 MessagePort 通信正常工作
