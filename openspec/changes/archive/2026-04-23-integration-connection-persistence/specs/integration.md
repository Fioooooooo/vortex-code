# Spec: Integration Connection Persistence

## Requirements

### R1 连接状态持久化

- SHALL 将各 tool 的连接状态持久化到 `data/integrations/connections.json`
- SHALL 在应用启动后、integration 页面加载时从主进程读取连接状态
- SHALL 连接状态包含：toolId、status、accountName、connectedAt、credentialPreview

### R2 凭证存储

- SHALL 各集成平台的凭证存储在独立文件 `data/integrations/<platform>/credentials.json`
- SHALL 凭证原文不得传递给前端，仅传递脱敏后的 credentialPreview
- SHALL 云效凭证格式：`{ "x-yunxiao-token": string, userId?: string, organizationId?: string }`

### R3 云效连接

- SHALL 云效三个 tool（yunxiao-projex、yunxiao-codeup、yunxiao-flow）共享同一套凭证
- SHALL connectionFields 只包含 `x-yunxiao-token` 一个字段
- SHALL 连接时调用 `listOrganizations` 验证 token 有效性，失败则不写入连接状态
- SHALL 连接失败时向前端返回具体错误信息

### R4 IPC 接口

- SHALL 提供 `integration:getConnections` 获取所有连接状态
- SHALL 提供 `integration:getConnection` 获取单个 tool 连接状态
- SHALL `integration:connect` 按 toolId 前缀路由到对应 service
- SHALL `integration:disconnect` 按 toolId 前缀路由，云效断开时同时清除 credentials

### R5 前端数据分层

- SHALL tool 静态 UI 元数据（connectionFields 等）保留在前端 `integration.config.ts`
- SHALL 连接状态通过 IPC 从主进程获取，不在前端 mock

## Scenarios

### S1 首次连接云效

1. 用户打开 integration 页面，三张云效卡片均显示"未连接"
2. 用户展开任意一张卡片，填写个人访问令牌
3. 点击"连接"，loading 状态
4. 主进程验证 token 有效，写入 credentials.json 和 connections.json
5. 前端刷新连接状态，三张云效卡片均显示"已连接"

### S2 连接失败

1. 用户填写无效 token，点击"连接"
2. 主进程调用 listOrganizations 返回 401
3. 前端显示错误信息（如"令牌无效"），连接状态不变

### S3 重启后回显

1. 用户重启应用，打开 integration 页面
2. 页面加载时调用 getConnections，从 connections.json 读取状态
3. 已连接的 tool 显示"已连接"，credentialPreview 回显脱敏后的 token

### S4 断开连接

1. 用户点击"断开连接"
2. 主进程清除 credentials.json 中的 token 和 connections.json 中的记录
3. 三张云效卡片均恢复"未连接"状态
