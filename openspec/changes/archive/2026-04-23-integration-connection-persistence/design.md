# Design: Integration Connection Persistence

## Architecture

```
frontend/src/api/integration.ts        # 前端 API 封装
        ↓ window.api.integration.*
electron/preload/api/integration.ts    # contextBridge 暴露
        ↓ ipcRenderer.invoke
shared/types/channels.ts               # channel 常量
        ↓ ipcMain.handle
electron/main/ipc/integration.ts       # IPC handler，按 toolId 前缀路由
        ↓
electron/main/services/integrations/
  ├── connections.ts                   # connections.json 读写
  └── yunxiao.ts                       # 云效连接逻辑
        ↓
electron/main/integrations/yunxiao/   # 云效 OpenAPI 客户端
  ├── credentials/index.ts            # credentials.json 读写
  ├── organization/                   # 组织 API
  ├── codeup/                         # 代码库 API
  └── projex/                         # 项目协作 API
```

## Data Model

### connections.json (`data/integrations/connections.json`)

```ts
ToolConnection[]

interface ToolConnection {
  toolId: string;           // 集成标识，如 "yunxiao"
  status: ConnectionStatus; // "connected" | "not-connected" | "connecting"
  accountName?: string;
  connectedAt?: string;     // ISO 8601
  credentialPreview?: Record<string, string>; // 脱敏后的凭证回显
}
```

### credentials.json (`data/integrations/yunxiao/credentials.json`)

```ts
interface YunxiaoCredentials {
  "x-yunxiao-token"?: string;
  userId?: string;
  organizationId?: string;
}
```

## Tool ID 映射规则

云效有三个 tool（`yunxiao-projex`、`yunxiao-codeup`、`yunxiao-flow`），共享同一套凭证。

- connections.json 中统一用 `yunxiao` 作为 toolId
- 前端通过 `resolveConnectionId`：`yunxiao-*` → `yunxiao`
- IPC handler 通过 `toolId.startsWith("yunxiao-")` 路由到云效 service

## Connect 流程（以云效为例）

1. 用户填写 `x-yunxiao-token`，点击连接
2. `connectTool(toolId, credentials)` → `integrationApi.connect`
3. IPC handler 识别 `yunxiao-` 前缀，调用 `setYunxiaoToken(token)`
4. `setYunxiaoToken`：写 credentials.json → 调用 `listOrganizations` 验证 → 写 connections.json
5. 成功后 `loadConnections()` 刷新前端状态，三张云效卡片均显示已连接

## Frontend 数据分层

- `integration.config.ts`：tool 静态 UI 元数据（connectionFields、parameterFields 等），纯前端
- `connections`（来自主进程）：运行时连接状态，通过 IPC 获取
