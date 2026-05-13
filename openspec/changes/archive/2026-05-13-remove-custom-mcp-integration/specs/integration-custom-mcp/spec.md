## REMOVED Requirements

### Requirement: 自定义集成入口位于页面底部

**Reason**: /integration 页面中"自定义集成"入口的实际实现为半成品——前端仅有折叠区块与"保存配置"按钮的空壳，preload 暴露的 API 在主进程未注册对应处理器，点击保存不会生效。同时，正在落地的 `separate-provider-credentials-and-project-integration` 将 /integration 重构为"项目级资源挂载"页，Custom MCP 不属于任何 provider 也不属于任何阶段资源，强行保留会让页面心智不统一。因此整个 capability 撤回，不再在 /integration 提供自定义集成入口。

**Migration**: 无需用户迁移动作——由于入口此前未打通，不存在真实用户数据；开发环境若有手工构造的 userData 文件可手动清理。未来的"自定义扩展"能力由 integration 主链路稳定后的新 change 以新 capability（而非复活本 capability）的形式重新引入，届时会另行给出使用方式。

### Requirement: 自定义集成支持 MCP 服务器配置

**Reason**: 该 requirement 依附于"自定义集成入口"存在；入口本身被撤回后，配置表单也随之失效。此外，配置能力在主进程从未接入任何 MCP server 生命周期管理、健康检查、权限隔离实现，继续保留规范描述会与实际能力持续脱节。

**Migration**: 无需用户迁移。未来重新引入扩展能力时，其具体形态（是否仍采用 MCP server URL + Skill 参数输入，还是其他机制）由新 change 独立设计，不继承本 requirement 的接口契约。
