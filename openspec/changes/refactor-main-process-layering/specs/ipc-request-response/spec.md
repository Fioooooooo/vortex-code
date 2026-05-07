## MODIFIED Requirements

### Requirement: Main 按业务域注册 handler

Main 进程 SHALL 为每个业务域创建独立的 handler 模块（`main/ipc/<domain>.ts`），每个模块导出 `register<Domain>Handlers()` 函数，在 `main/ipc/index.ts` 中统一注册。每个 handler 函数体 SHALL 仅包含参数校验、调用 service、返回归一化响应三类操作，业务逻辑必须下沉到 `services/<domain>/`。

#### Scenario: Handler 模块化注册

- **WHEN** 应用启动
- **THEN** `main/ipc/index.ts` 调用所有域的 `registerXxxHandlers()` 完成 handler 注册

#### Scenario: Handler 统一包装响应

- **WHEN** 任意 handler 处理请求
- **THEN** handler 通过 `ipc/_kit/wrap-handler.ts` 导出的 `wrapHandler` 包装异步逻辑
- **AND** 返回值符合 `IpcResponse<T>` 结构，异常被 `wrapHandler` 捕获并转为 `{ ok: false, error }` 响应
- **AND** handler 函数体不自行实现 try/catch + 错误归一化样板

#### Scenario: Handler 不直接访问基础设施

- **WHEN** 审查任意 `main/ipc/<domain>.ts` 文件（`_kit/` 除外）的 import 列表
- **THEN** 不存在 `from "fs"`、`from "child_process"`、`from "path"` 的 import
- **AND** 不直接实例化 `AcpSession`、`MessageChannelMain`、`spawn` 等运行时对象

## ADDED Requirements

### Requirement: Handler 入参通过共享 schema 校验

每个 `ipcMain.handle` 注册的 handler SHALL 在执行业务逻辑之前调用 `ipc/_kit/schema.ts` 的 `validate(schema, input)` 校验 renderer 传入参数，schema 从 `shared/schemas/ipc/<domain>.ts` 按具名导入。校验失败由 `wrapHandler` 统一返回 `VALIDATION_ERROR`。

#### Scenario: 校验不通过返回标准错误

- **WHEN** renderer 调用 `window.api.workflow.save({ projectId, name: "" , yaml: "..." })`，其中 name 为空
- **THEN** handler 在进入 service 之前返回 `{ ok: false, error: { code: "VALIDATION_ERROR", message: "<字段描述>" } }`

#### Scenario: schema 与 handler 同域

- **WHEN** 查看 `main/ipc/chat.ts` 的 handler 注册代码
- **THEN** 每个 handler 在调用 service 前调用了 `validate(ChatXxxSchema, input)`
- **AND** `ChatXxxSchema` 从 `@shared/schemas/ipc/chat` 导入
