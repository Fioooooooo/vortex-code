## Context

FylloCode 的前端基于 Vue 3 + Pinia + Nuxt UI + vue-router (file-based routing) 构建。当前 `/integration` 路由已存在但仅展示占位文案。Activity Bar 中存在 Extension 导航项指向 `/extension`（该路由不存在）。

项目已有成熟的 store / types 分层模式：

- `src/types/` —— 纯类型定义，可被 electron preload 层共享
- `src/stores/` —— Pinia store，含 mock 数据生成器
- `src/components/<page>/` —— 按页面组织组件
- `src/pages/index/<page>.vue` —— 文件系统路由

## Goals / Non-Goals

**Goals:**

- 实现一个功能完整的 Integrations 管理页面，支持工具浏览、搜索、筛选、连接、配置
- 保持与现有代码库一致的架构风格（store + types + 组件分层，mock 数据）
- 使用 nuxt/ui 原生组件和语义化颜色，不直接写死颜色值
- 所有图标使用 lucide（通过 `i-lucide-*` 类名）
- 类型定义抽取到 `src/types/integration.ts`，方便未来与 electron 共享

**Non-Goals:**

- 真实的外部 API 调用（所有交互均为 mock）
- OAuth 回调的实际处理流程（仅模拟状态变化）
- 后端持久化（数据仅存在于前端 store 中）
- 国际化（仅英文界面）

## Decisions

### 1. Store 设计：单一 integration store 管理所有状态

**Rationale**: 集成页面的状态（工具列表、连接状态、配置数据）高度内聚，拆分多个 store 会增加不必要的复杂度。参照现有 `pipeline.ts` 的模式，使用一个 `integration.ts` store 配合 `integration.mock.ts` 生成 mock 数据。

**Alternative considered**: 拆分为 `toolRegistryStore`、`connectionStore`、`projectToolStore`。Rejected —— 当前页面是单一视图，状态间交互频繁（如连接后才能启用），单一 store 更简洁。

### 2. 组件拆分：按功能域拆分而非按分类拆分

**Rationale**: 六个分类的工具卡片共享相同的展示和交互逻辑（卡片正面、展开配置、连接表单、参数配置）。拆分为 `IntegrationToolCard`（单张卡片）、`IntegrationCategorySection`（分类区块）两个核心组件，而不是为每个分类单独建组件。

### 3. 配置面板内部状态：使用局部响应式对象而非独立 store

**Rationale**: 配置面板中的表单字段（token 输入、选择框等）属于临时编辑状态，不需要全局持久。仅在用户点击 Save/Connect 时才提交到 store。这避免了 store 中堆积大量临时表单状态。

### 4. 路由修正：Activity Bar `/extension` → `/integration`

**Rationale**: 当前 Activity Bar 中的 Extension 指向 `/extension`，但该路由不存在。提案要求的是 Integrations 页面。统一使用 `/integration` 路由，并将导航项重命名为 Integrations（保留 puzzle 图标语义）。

### 5. 不使用 Nuxt UI 的 UAccordion 做卡片展开

**Rationale**: UAccordion 的样式和交互（标题栏 + 内容区）与设计的卡片展开效果不完全匹配。卡片展开后配置区域是卡片自身的一部分延伸，而非独立的折叠面板。使用简单的 `v-if` 控制展开 + 过渡动画即可，更灵活。

## Risks / Trade-offs

- **[Risk]** 配置表单字段因工具而异，未来新增工具需要修改组件代码 → **Mitigation**: 使用配置驱动渲染，每个工具的连接参数和配置参数通过数据结构描述，组件根据数据结构动态渲染表单
- **[Risk]** mock 数据结构过于简化，未来对接真实 API 时可能需要大改 → **Mitigation**: 类型设计时预留扩展空间（如 `connectionDetails` 使用 `Record<string, unknown>`），store action 的签名保持与真实 API 一致
- **[Trade-off]** 所有工具配置面板写在同一套组件中，未来工具数量增加后组件可能变复杂 → 当前 MVP 仅 6 个工具，此风险可控；若未来扩展到 20+ 工具，再考虑按分类拆分组件

## Migration Plan

无需数据迁移（纯新增功能）。部署步骤：

1. 合并代码后自动通过文件路由注册 `/integration`
2. 用户刷新应用后即看到新的 Integrations 页面
3. 旧 `/extension` 路由已不存在，Activity Bar 导航自动指向 `/integration`

## Open Questions

- 工具的品牌 logo 在 MVP 阶段是否使用文字首字母替代（无真实 logo 资源）？→ **决策**: 使用 `ULetterAvatar` 或带品牌色的图标占位
- Custom Integration 的 MCP server 配置是否需要验证连接？→ **决策**: MVP 阶段仅提供表单输入，不做实际连通性验证
