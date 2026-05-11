## Context

`ActivityBar.vue` 当前同时承担三件事：

1. 定义菜单项（id、icon、label、to、group）。
2. 根据当前路由计算 `activeItem`（6 条 `if/startsWith` 硬编码）。
3. 作为"默认应用页是什么"的隐式事实来源——因为 `activeItem` 的 fallback 是 `"task"`，所以其他组件（`WelcomeView`、`AppHeader`）才敢写 `router.push("/task")`。

这三件事耦合在一个组件里，导致：

- 新增路由必须同时改 ActivityBar 的 `items` 和 `activeItem` 两处，漏改一处就出现静默错误。
- "默认应用页"没有显式声明，散落在各组件的 `router.push("/task")` 里。
- spec 文本（`/chat`、`/workspace`）与代码（`/task`）已经三方不一致。

## Goals / Non-Goals

**Goals:**

- 将 ActivityBar 的菜单定义提升为单一、显式、可导入的注册表。
- 让 `activeItem` 计算完全从注册表派生，不再手写 `if/startsWith`。
- 让"跳转到默认应用页"有显式 API（composable），取代所有硬编码 `router.push("/task")`。
- 修正 spec 文本中默认重定向目标与实际行为不一致的问题。

**Non-Goals:**

- 不修改 ActivityBar 的视觉样式、布局、图标、tooltip。
- 不新增/删除任何页面路由。
- 不改业务语义独立的内部跳转（task→chat、proposal 内部导航）。
- `index.vue` 中的 `protectedRoutes` 数组从注册表 `requiresProject: true` 的条目派生，取代硬编码字面量列表；根路径重定向同样使用 `useDefaultAppRoute()` 取代硬编码 `/chat`。
- `requiresProject` 从注册表元数据升级为被 `index.vue` 消费，用于动态构建受保护路由列表。
- 不迁移到其他导航库或路由方案。

## Decisions

### 1. 注册表放在 `frontend/src/config/activity-bar.ts`

- **Rationale**: `config/` 目录已有 `auto-routes.ts`，是前端配置的中心位置。注册表不是 composable（无运行时依赖）、不是 store（无状态），放在 `config/` 最自然。
- **Alternatives considered**: 放在 `composables/` 里导出——但注册表是纯数据，不需要 `use*` 语义；放在 `stores/` 里——无响应式状态，不契合。

### 2. `path` 字段同时承担 `to` 和高亮匹配前缀

- **Rationale**: ActivityBar 的每个菜单项恰好对应一个顶级路由前缀（`/task`、`/chat` 等），用同一个字段做 `UButton :to` 和 `startsWith` 匹配，避免双写。
- **Alternatives considered**: 拆分为 `to` 和 `matchPrefix`——更灵活，但当前所有条目都是 `to === matchPrefix`，增加字段反而冗余。未来如果出现嵌套路由需要差异化匹配时再加不迟。

### 3. `isDefault` 布尔标记 + dev assert 校验唯一性

- **Rationale**: TypeScript 字面量类型无法在不使用复杂元组推导的情况下表达"数组中恰好一个 true"。运行期 `assert` 在 dev/test 阶段兜底即可，实现成本最低。
- **Alternatives considered**: 用 `export const defaultPath = '/task'` 单独导出——但默认页语义与菜单项强相关，分开维护容易再次漂移。用 `readonly [ActivityBarItem, ...ActivityBarItem[]]` 元组 + 泛型约束——TypeScript 类型体操过重，不值得。

### 4. `activeItem` 采用"最长前缀匹配"策略

- **Rationale**: 当前路径结构不存在冲突（所有顶级路由都是独立前缀），但未来如果新增 `/task` 和 `/task-detail`，`startsWith('/task')` 会同时命中两者。取最长匹配前缀（`sort((a, b) => b.path.length - a.path.length)`）可以正确区分 `/proposal` vs `/proposal/:id` 的情况。
- **Alternatives considered**: 用 `route.matched` 对比——更精确，但 vue-router/auto 的 `route.matched` 在文件系统路由下与文件路径绑定，可读性不如直接前缀匹配；且当前场景下前缀匹配已足够。

### 5. 未匹配时返回 `null`（不再 fallback 到 task）

- **Rationale**: 静默 fallback 会掩盖"新增路由但忘了注册"的错误。返回 `null` 让 ActivityBar 什么都不高亮，是更安全的失败模式——开发者看到"没高亮"会主动排查，而不是"错误地高亮了 task"。
- **Alternatives considered**: fallback 到 `isDefault` 项——与当前行为一致，但违背"显式优于隐式"原则。

## Risks / Trade-offs

| Risk                                                                                                                      | Mitigation                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 未来新增嵌套路由（如 `/task/:id`）时，`startsWith('/task')` 会同时命中 `/task` 和 `/task/:id`，最长前缀匹配仍可能不够精确 | 当前所有路由都是顶级独立页面，无嵌套；若未来出现嵌套，可升级为 `route.matched` 匹配或引入 `match` 正则字段                        |
| `isDefault` 唯一性靠运行期 assert，生产环境不会报错                                                                       | assert 只在 dev 和 test 环境触发；生产环境即使出现双 default，也只是 `find()` 取第一个，行为仍确定                                |
| 替换 `router.push("/task")` 时误伤业务跳转                                                                                | 本次只替换语义为"跳默认应用页"的调用（`WelcomeView`、`AppHeader`），task→chat、proposal 内部跳转不动；review 时重点检查 grep 结果 |
| spec 修正后，旧 archive 中引用的 `/chat`、`/workspace` 字面量成为历史遗迹                                                 | archive 只读，不修改；spec 修正明确说明"默认页由注册表决定"，未来不再出现字面量漂移                                               |
