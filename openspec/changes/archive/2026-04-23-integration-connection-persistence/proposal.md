# Proposal: Integration Connection Persistence

## Problem

Integration 页面的连接状态和凭证数据全部存在前端内存（mock 数据），刷新后丢失，无法回显用户已配置的凭证，也无法在主进程中使用这些凭证调用外部 API。

## Solution

将连接状态持久化到主进程，凭证存储到各集成平台独立的 credentials 文件，前端通过 IPC 获取连接状态和脱敏后的凭证回显。

- `data/integrations/connections.json`：存储各 tool 的连接状态（非敏感字段）
- `data/integrations/yunxiao/credentials.json`：存储云效个人访问令牌
- IPC 链路：frontend api → preload → channels → ipc handler → service → integration

## Non-goals

- 不实现 parameterFields / projectConfigFields 的持久化（后续单独处理）
- 不实现 OAuth 类型的真实连接流程
