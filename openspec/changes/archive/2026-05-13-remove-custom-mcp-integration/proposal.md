## Why

当前 /integration 页面底部有一个"高级 — 自定义集成"折叠区块（`CustomIntegrationSection.vue`），供用户手动配置 MCP server 地址与 Skill 参数。但这个入口实际上是个半成品：

- 前端只有一个带"保存配置"按钮的折叠表单，`saveCustomIntegration` 没有真正的持久化路径；
- preload 的 `integration.listCustom` / 保存方法在主进程里**没有任何 IPC 处理器**——整条链路只有前端存根，调用必然失败；
- 主进程里完全没有 MCP server 的生命周期管理、健康检查、权限隔离等能力。

与此同时，我们正在通过 `separate-provider-credentials-and-project-integration` 重构 integration：把凭证抽到 settings/Integration Providers，/integration 回归"项目级资源挂载"纯粹形态。Custom MCP 在这个新模型里**没有对应位置**——它既不是 provider（没有凭证语义）、也不属于任何阶段的资源挂载。保留它会让用户看到一个"其他一切都明确，只有这里不明确"的角落，交互概念被稀释；更糟的是点了还不 work。

产品未公开发布，最务实的做法是：**先拆掉，等 integration 主链路打通、确定好扩展点应该长什么样（例如纳入 provider manifest 的扩展机制、或独立页面）之后，再用一个新 change 重新引入**，而不是让一个没通的开放入口继续占位。

## What Changes

- 从 /integration 页面移除"自定义集成"折叠区块及其组件、按钮、入口文案。
- 删除前端相关资源：`CustomIntegrationSection.vue` 组件文件、`frontend/src/api/integration.ts` 中 `listCustom` 等自定义集成 API 封装、`frontend/src/pages/integration.vue` 的相关 import 与使用。
- 删除 preload 暴露的 `integration.listCustom` 等自定义集成 API（由于主进程并无对应处理器，删除不影响任何现有 IPC 契约使用者）。
- 删除共享类型 `shared/types/integration.ts` 中的 `CustomIntegration` 接口。
- 更新 `docs/DataModel.md`，去掉 `CustomIntegration` 相关描述。
- 撤回 `integration-custom-mcp` capability：通过 spec delta 使用 `## REMOVED Requirements` 标记其下全部 requirement（自定义集成入口位于页面底部、自定义集成支持 MCP 服务器配置）。本次撤回后，openspec 中不再存在 `integration-custom-mcp` capability；后续由新 change 在链路打通后重新建立。
- **Out of scope（明确不在本次范围）**：
  - 不引入新的"扩展点"替代方案；未来的可插拔扩展机制等 integration 主链路稳定后，由独立 change 设计（可能以 provider manifest 外挂、或设置页独立入口的形式出现）。
  - 不改动 settings 的 Integration Providers 页，也不改动 /integration 的六个阶段分区与资源挂载主体。
  - 不做数据迁移：userData 下若有任何 Custom MCP 相关持久化文件（当前链路未打通，通常不存在），由各开发者手动清理即可，不写入自动清理逻辑。

## Capabilities

### Removed Capabilities

- `integration-custom-mcp`: 移除"自定义集成"能力，包括"入口位于页面底部"与"支持 MCP 服务器配置"两条 requirement。原因：链路未打通的半成品入口与本次 integration 重构不兼容，先行撤回，待整体 integration 主链路稳定后由新 change 以更明确的形态重新引入。

## Impact

- **前端代码**：
  - 删除 `frontend/src/components/integration/CustomIntegrationSection.vue`；
  - 修改 `frontend/src/pages/integration.vue`：移除 `CustomIntegrationSection` 的 import 与 template 使用；
  - 修改 `frontend/src/api/integration.ts`：移除 `CustomIntegration` import、`listCustom` 方法及其相关封装。
- **preload 代码**：
  - 修改 `electron/preload/api/integration.ts`：移除 `CustomIntegration` import、`listCustom` 与相关保存方法，使 preload 暴露的 integration API 不再包含自定义集成能力。
- **共享类型**：
  - 修改 `shared/types/integration.ts`：删除 `CustomIntegration` 接口。
- **主进程**：无代码改动（主进程从未注册 Custom MCP 相关 IPC 处理器）。
- **文档**：
  - 修改 `docs/DataModel.md`：删除 `CustomIntegration` 数据结构描述；
  - 无需 CHANGELOG（产品未公开发布）。
- **既有 spec**：
  - 撤回 `integration-custom-mcp` capability 的全部 requirement；
  - 不影响 `integration-providers`、`integration-tool-registry`、`integration-connection-management`、`integration-project-enablement`、`integration-config-panel`。
- **依赖与基础设施**：不新增依赖，不调整横切机制。
