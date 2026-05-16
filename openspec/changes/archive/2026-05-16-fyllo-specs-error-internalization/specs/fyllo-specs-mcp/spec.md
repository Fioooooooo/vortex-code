## MODIFIED Requirements

### Requirement: 错误内敛

MCP server SHALL 将所有 tool 执行异常内敛到返回 state 的 `errors` 字段中，不再向外抛出 `McpError`。无论业务逻辑成功或失败，tool 响应 SHALL 始终包含完整的 skill prompt 与 state 双段文本。

返回 state 中的 `errors` 字段为数组，每个元素包含：

| 字段      | 类型   | 说明         |
| --------- | ------ | ------------ |
| `type`    | string | 错误类型标识 |
| `message` | string | 错误描述文本 |

工具层 SHALL 通过统一的 `runTool` 包装器实现错误内敛，确保 prompt 始终返回。`runTool` SHALL 在 catch 块中将异常转换为 `state.errors` 条目，并继续使用 `wrapState` 返回双段文本。

zod schema 校验失败（如入参类型错误）仍由 MCP SDK 在 `registerTool` 层面拦截并返回标准 `InvalidParams` 错误，这类错误不涉及 skill prompt 的丢失，SHALL 保持原行为不变。

#### Scenario: CLI 调用失败时返回错误 state

- **WHEN** 调用 `explore` 且 openspec CLI 执行失败（如 `OpenspecCliError`）
- **THEN** 响应仍包含 `<skill_prompt>` 与 `<state>` 两段
- **AND** `state.errors` 为包含 `{ type: "OpenspecCliError", message: ... }` 的非空数组

#### Scenario: 不存在的 change

- **WHEN** 调用 `apply-change` 传入不存在的 `changeName`
- **THEN** 响应包含 `<skill_prompt>` 与 `<state>` 两段
- **AND** `state.errors` 为包含 `{ type: "Error", message: "Change not found: ..." }` 的非空数组
- **AND** 响应 `isError` 为 `false`

#### Scenario: 目标冲突时拒绝归档

- **WHEN** 调用 `archive-change` 传入 `confirm: true`，目标路径已存在
- **THEN** `state.conflicts` 非空
- **AND** `state.errors` 为包含 `{ type: "Error", message: "Archive target exists: ..." }` 的非空数组
- **AND** 不执行任何移动
- **AND** 响应 `isError` 为 `false`

#### Scenario: 入参类型错误

- **WHEN** 调用 `create-proposal` 传入 `name: 123`（非字符串）
- **THEN** MCP SDK 拦截并返回 `isError: true`
- **AND** error code 等于 `InvalidParams`
- **AND** tool handler 不执行，不返回 skill prompt

#### Scenario: 超时错误内敛

- **WHEN** 调用任一 tool 且 openspec CLI 超时（`OpenspecTimeoutError`）
- **THEN** 响应仍包含 `<skill_prompt>` 与 `<state>` 两段
- **AND** `state.errors` 为包含 `{ type: "OpenspecTimeoutError", message: ... }` 的非空数组
