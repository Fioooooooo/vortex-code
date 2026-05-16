## Why

当前 fyllo-specs MCP server 在 tool 执行遇到业务错误（如 change 不存在、CLI 调用失败、归档目标冲突）时，通过抛出 `McpError` 将错误直接暴露给 MCP client。这导致 agent 在调用 tool 后只收到一个裸错误消息，无法同时看到 skill prompt（即完整的工作流指导文本），严重削弱了 MCP server 作为 skill 封装层的价值。skill prompt 本身已经包含了错误处理策略（如遇到 blocker 时 pause 并等待 guidance），错误应当作为状态信息返回给 agent，而非中断 tool 调用。

## What Changes

- **BREAKING**: 所有 tool（explore / create-proposal / apply-change / archive-change）不再将业务错误和 CLI 错误抛出为 `McpError`，而是内敛到返回 state 的 `errors` 字段中
- 新增 `runTool` 包装函数，确保无论成功或失败，skill prompt 始终返回
- 更新 `fyllo-specs-mcp` spec，将"错误归一化"要求改为"错误内敛"语义
- 更新相关测试断言（`rejects.toBeInstanceOf(McpError)` → 检查 `state.errors` 非空）
- zod schema 校验错误仍由 MCP SDK 原样处理（这是真正的契约错误，不应掩盖）

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `fyllo-specs-mcp`: 将 Requirement "错误归一化"改为"错误内敛"，所有业务错误和 CLI 错误通过 `state.errors` 返回，不再抛出 `McpError`

## Impact

- 调用 fyllo-specs tool 的 agent 代码需要适应新的错误模式（从 try/catch 改为检查 `state.errors`）
- `mcp-servers/fyllo-specs/src/` 下 tool handler 和测试文件需要修改
- openspec spec 文件 `openspec/specs/fyllo-specs-mcp/spec.md` 需要更新
