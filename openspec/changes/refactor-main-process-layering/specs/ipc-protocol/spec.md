## MODIFIED Requirements

### Requirement: 错误码采用 UPPER_SNAKE_CASE 格式并按域分组

错误码 SHALL 采用 `DOMAIN_ERROR_NAME` 格式（如 `CHAT_SESSION_NOT_FOUND`、`PROJECT_PATH_INVALID`），通用错误使用 `UNKNOWN_ERROR`、`VALIDATION_ERROR`、`NOT_FOUND` 前缀。

所有合法错误码 SHALL 集中声明为 `shared/constants/error-codes.ts` 中 `IpcErrorCodes` 对象的字段，并派生 `IpcErrorCode` 联合类型。`IpcResponse` 的 `error.code` 类型 SHALL 收紧为 `IpcErrorCode`，handler 只能返回已声明的错误码。新增错误码必须通过 OpenSpec change 提交。

#### Scenario: 业务域错误码

- **WHEN** chat 域找不到指定会话
- **THEN** 错误码为 `CHAT_SESSION_NOT_FOUND`
- **AND** `CHAT_SESSION_NOT_FOUND` 存在于 `shared/constants/error-codes.ts` 的 `IpcErrorCodes` 常量中

#### Scenario: 通用错误码

- **WHEN** 请求参数校验失败
- **THEN** 错误码为 `VALIDATION_ERROR`

#### Scenario: 非法错误码触发类型错误

- **WHEN** 开发者在 handler 中返回未在 `IpcErrorCodes` 中声明的错误码字面量
- **THEN** TypeScript 编译器在 `pnpm typecheck` 阶段报错

## ADDED Requirements

### Requirement: IPC handler 入参使用 zod schema 校验

所有 `ipcMain.handle` 或 `ipcMain.on` 注册的 handler SHALL 通过 `ipc/_kit/schema.ts` 导出的 `validate` 对入参执行 zod schema 校验；schema 定义集中在 `shared/schemas/ipc/<domain>.ts`。校验失败 SHALL 通过 `IpcResponse` 返回 `VALIDATION_ERROR` 错误码和人类可读的 message，不抛出异常。

#### Scenario: 入参不符合 schema

- **WHEN** renderer 通过 `window.api.project.create({ ... })` 发送参数，但缺失必填字段 `name`
- **THEN** main handler 通过 `validate` 捕获到校验错误
- **AND** 返回 `{ ok: false, error: { code: "VALIDATION_ERROR", message: "<字段描述>" } }`

#### Scenario: schema 定义位置

- **WHEN** 查看 `shared/schemas/ipc/` 目录
- **THEN** 每个业务域（chat、project、workflow、integration、proposal、settings 等）都有对应的 `<domain>.ts` 文件
- **AND** 每个 handler 的入参 schema 作为具名 export 存在
