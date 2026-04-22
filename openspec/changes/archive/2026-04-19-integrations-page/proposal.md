## Why

FylloCode 需要有一个统一的入口让用户管理和配置外部开发工具集成。当前 `/integration` 路由仅展示一个占位页面，用户无法连接云效、钉钉、阿里云 SLS 等工具账号，也无法在项目中启用或配置这些工具。没有集成管理，Pipeline 的各阶段无法与外部系统交互，自动化流程的价值大打折扣。

## What Changes

- 重写 `/integration` 页面，从占位页升级为完整的 Integrations 管理页面
- 新增 `integration` store，集中管理工具连接状态、项目级启用状态、配置数据（数据 mock）
- 新增 `src/types/integration.ts`，定义集成相关的所有类型，便于未来与 electron 层共享
- Activity Bar 中的 Extension 图标更新为 Integrations，并修正路由指向
- 实现六大分类的工具卡片展示：Project Management、Source Control、CI/CD、Deployment、Communication、Observability
- 每张工具卡片支持展开配置面板，包含账号连接、工具参数、项目级配置三个区域
- 支持搜索过滤和状态筛选（All / Connected / Enabled in Project）
- Coming Soon 工具置灰展示，Custom Integration 入口折叠在页面底部

## Capabilities

### New Capabilities

- `integration-tool-registry`: 集成工具的注册与展示。包括分类结构、工具元数据（名称、描述、logo、可用性状态）、搜索过滤和状态筛选。
- `integration-connection-management`: 账号连接生命周期管理。包括 API Token / OAuth 两种连接方式、连通性测试、连接信息展示、断开连接。
- `integration-project-enablement`: 项目级工具启用管理。包括按项目启用/禁用工具、项目级配置覆盖。
- `integration-config-panel`: 工具卡片的展开配置面板。包括手风琴交互、分区域展示（连接、参数、项目配置）、表单验证。
- `integration-custom-mcp`: 自定义集成入口。允许高级用户手动配置 MCP server 地址或自定义 Skill。

### Modified Capabilities

- `app-shell-routing`: Activity Bar 的导航项需要更新（Extension → Integrations，路由 `/extension` → `/integration`）。

## Impact

- **前端页面**: `frontend/src/pages/index/integration.vue` 完全重写
- **Store 层**: 新增 `frontend/src/stores/integration.ts` 和 `frontend/src/stores/integration.mock.ts`
- **类型层**: 新增 `frontend/src/types/integration.ts`
- **组件层**: 新增 `frontend/src/components/integration/` 目录下的多个组件
- **路由/导航**: `frontend/src/components/layout/ActivityBar.vue` 和 `frontend/src/pages/index.vue` 小幅更新
- **依赖**: 无新增外部依赖，全部使用现有 nuxt/ui + lucide 图标体系
