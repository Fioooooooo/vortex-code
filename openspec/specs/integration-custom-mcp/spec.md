# integration-custom-mcp 规范

## Purpose

自定义集成（Custom MCP）规范定义 /integration 页面底部高级扩展入口及其 MCP 服务器配置能力。**此 capability 已移除。**

## REMOVED Requirements

### Requirement: 自定义集成入口位于页面底部

**Reason**: /integration 页面中"自定义集成"入口的实际实现为半成品，点击保存不会生效；同时当前 integration 主链路正在收敛为 provider/项目资源挂载模型，Custom MCP 不属于该模型中的任一层。继续保留会让页面心智与实际能力持续脱节，因此撤回该入口 requirement。

**Migration**: 无需用户迁移。由于该入口此前未打通，不存在真实用户数据。未来若重新引入扩展能力，将由新的 capability 独立定义。

### Requirement: 自定义集成支持 MCP 服务器配置

**Reason**: 该 requirement 依附于自定义集成入口存在；入口撤回后，配置表单能力也一并失效。此外主进程从未接入 MCP server 生命周期管理、健康检查与权限隔离，继续保留此 requirement 会与实现严重背离。

**Migration**: 无需用户迁移。未来扩展能力的具体配置形态将由后续 change 重新设计，不继承本 requirement 的接口契约。
