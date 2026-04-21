## Why

Vortex-Code 的前端目前使用 Pinia store 中的 mock 数据驱动 UI，主进程仅有一个测试用的 `ping` handler，preload 暴露的 `window.api` 是空对象。要让应用真正运行起来（AI 聊天、项目管理、Pipeline 执行、集成工具连接、设置持久化），必须建立一套完整的 IPC 通信层。现在前端 UI 和类型定义已经基本成型，是搭建通信基础设施的最佳时机。

## What Changes

- 定义统一的 IPC 响应结构（`IpcResponse<T>`）和错误码规范
- 在 preload 层按业务域（chat、project、pipeline、integration、settings、window）拆分，通过 `contextBridge` 暴露类 RESTful 的领域 API（`window.api.chat.sendMessage()`），renderer 不接触任何 IPC channel 字符串
- 在 main 层按业务域注册 `ipcMain.handle` handler，统一包装响应和错误处理
- 建立 `domain:action` 命名规范的 IPC channel 体系（如 `chat:sendMessage`、`project:list`）
- 为流式场景（AI 聊天流式输出）建立基于 MessagePort 的通信机制
- 为事件推送场景（Pipeline 阶段状态变更、下载进度）建立基于 `ipcRenderer.on` 的订阅/取消订阅机制
- 将 `frontend/src/types/` 下的业务类型（chat、project、pipeline、integration、settings）迁移到 `shared/types/`，frontend 改为从 `@shared/types/` 引用，确保 main/preload/renderer 三层共享同一份类型定义
- **BREAKING**: 移除现有的空 `window.api` 对象和 `ping` 测试 handler

## Capabilities

### New Capabilities

- `ipc-protocol`: IPC 通信协议规范——channel 命名规则（`domain:action`）、统一响应结构（`IpcResponse<T>`）、错误码体系、共享类型定义
- `ipc-request-response`: 基于 `invoke/handle` 的请求-响应通信——preload 领域 API 封装、main handler 注册、参数校验边界
- `ipc-streaming`: 流式数据通信——基于 MessagePort 的 AI 聊天流式输出、基于 `ipcRenderer.on` 的事件推送（进度、状态变更）、订阅生命周期管理

### Modified Capabilities

_(无现有 spec 需要修改——当前 IPC 层为空白状态)_

## Impact

- `electron/preload/index.ts`: 从空对象重构为按域暴露完整 API
- `electron/preload/index.d.ts`: 更新 `Window.api` 类型声明为具体的领域 API 接口
- `electron/main/index.ts`: 移除 `ping` handler，引入模块化的 handler 注册
- 新增 `electron/main/ipc/` 目录：按域拆分的 handler 文件
- 新增 `electron/preload/api/` 目录：按域拆分的 preload API 文件
- 新增 `shared/types/` 目录（项目根目录）：IPC 协议类型（`ipc.ts`、`channels.ts`）+ 业务类型（`chat.ts`、`project.ts`、`pipeline.ts`、`integration.ts`、`settings.ts`），通过 `@shared` 别名在三个构建目标中引用
- `frontend/src/types/`：业务类型文件迁移至 `shared/types/` 后删除，`welcome.ts` 等纯前端类型保留
- `electron.vite.config.ts`: 为 main/preload/renderer 三个构建目标添加 `@shared` 路径别名
- `tsconfig*.json`: 添加 `@shared/*` paths 映射
- 新增 `frontend/src/api/` 目录：对 `window.api` 的薄封装层，store 通过 `@renderer/api/` 调用，不直接依赖 `window.api`
- 前端 Pinia store 将从直接操作 mock 数据改为调用 `@renderer/api/*`（本次不实施，仅建立基础设施）
