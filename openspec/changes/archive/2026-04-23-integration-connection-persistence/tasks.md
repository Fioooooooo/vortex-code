# Tasks: Integration Connection Persistence

- [x] 创建 `electron/main/integrations/yunxiao/credentials/index.ts`，包含 YunxiaoCredentials 类型和读写函数
- [x] 创建 `electron/main/integrations/yunxiao/organization/`、`codeup/`、`projex/` 子模块，集成云效 API
- [x] 创建 `electron/main/services/integrations/connections.ts`，实现 connections.json 读写
- [x] 创建 `electron/main/services/integrations/yunxiao.ts`，实现 setYunxiaoToken / setYunxiaoOrganization / disconnectYunxiao
- [x] 更新 `shared/types/integration.ts`：ToolConnection 改用 credentialPreview，connectedAt 改为 string，新增 YunxiaoOrganization
- [x] 更新 `shared/types/channels.ts`：新增 getConnections、yunxiaoSetToken、yunxiaoSetOrganization channel
- [x] 更新 `electron/main/ipc/integration.ts`：接入 getConnections、connect（按前缀路由）、disconnect
- [x] 更新 `electron/preload/api/integration.ts`：新增 getConnections、yunxiaoSetToken、yunxiaoSetOrganization
- [x] 更新 `frontend/src/api/integration.ts`：同步新增对应方法
- [x] 将 `integration.mock.ts` 重命名为 `integration.config.ts`，删除 mock 生成函数
- [x] 更新 `frontend/src/stores/integration.ts`：connections 从主进程加载，加入 resolveConnectionId 前缀映射
- [x] 更新 `frontend/src/components/integration/IntegrationToolCardExpand.vue`：连接失败显示错误信息
- [x] 更新 `frontend/src/components/integration/IntegrationToolCard.vue`：移除项目启用开关（依赖已删除的 mock 数据）
- [x] 更新云效三个 tool 的 connectionFields，统一改为只填 x-yunxiao-token
- [x] 更新 `frontend/src/pages/integration.vue`：onMounted 触发 loadConnections
