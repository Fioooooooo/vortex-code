## Context

Vortex Code 是一个基于 Nuxt 4 + Nuxt UI v4 构建的桌面端应用前端项目。目前已完成 welcome 页面（项目创建、最近项目列表）和基础项目搭建（Pinia、Vitest、@nuxt/ui）。用户从 welcome 页面进入某个项目后，需要一个功能完整的 Workspace 页面作为与 AI agent 交互的主界面。

当前状态：

- 技术栈：Nuxt 4, Vue 3, TypeScript, Nuxt UI v4, Pinia, VueUse, Vitest
- UI 组件库：@nuxt/ui v4（基于 Tailwind Variants）
- 图标：lucide-vue-next
- 状态管理：Pinia
- 测试：Vitest
- 无真实后端，所有数据 mock

## Goals / Non-Goals

**Goals:**

- 实现 Workspace 页面完整布局和所有交互组件
- 所有数据通过 Pinia store 管理并 mock
- 类型定义集中放在 `src/types`，便于未来与 Electron 共享
- 100% 使用 Nuxt UI 原生组件，遵循语义化颜色体系
- 支持多断点响应式和深浅主题
- 组件拆分清晰，便于后续接入真实 API

**Non-Goals:**

- 不连接任何真实后端 API
- 不承担代码编辑职责（文件树点击仅做 diff 预览，不是编辑器）
- 不实现 agent 核心逻辑（仅 UI 展示和状态管理）
- 不实现流水线、插件市场、活动历史等 Activity Bar 其他页面的内容

## Decisions

### 1. Store 架构：单一 Workspace Store

**决策**：使用一个 `useWorkspaceStore` 管理 Workspace 页面全部状态，而非拆分为多个小 store。

**理由**：

- Workspace 页面内各区域高度耦合（选中会话影响文件树变更标记、文件操作影响 diff 面板、agent 状态影响会话列表状态）
- 单一 store 减少跨 store 同步的复杂度
- 未来接入真实 API 时，所有接口调用集中在 action 中，便于替换

**替代方案**：拆分为 `useSessionStore`、`useFileStore`、`useProjectStore`。拒绝原因：当前页面内状态联动频繁，拆分后需要大量跨 store 监听。

### 2. 类型定义：src/types/workspace.ts

**决策**：所有 Workspace 相关类型统一放在 `src/types/workspace.ts`，并在 store 中导入使用。

**理由**：

- 明确为未来 Electron 主进程/渲染进程共享类型做准备
- 避免类型散落在组件中

### 3. 组件组织：按区域平铺

**决策**：组件按页面区域平铺到 `src/components/workspace/` 下，不做过深层级嵌套。

**目录结构**：

```
src/components/workspace/
  AppHeader.vue          # 顶栏
  ActivityBar.vue        # 左侧图标栏
  Sidebar.vue            # 左侧面板容器（含 tab 切换）
  SessionList.vue        # Sessions tab 内容
  FileTree.vue           # Files tab 内容
  ChatArea.vue           # 中央对话区容器
  MessageUser.vue        # 用户消息卡片
  MessageThinking.vue    # 思考过程卡片（可折叠）
  MessageFileOp.vue      # 文件操作卡片
  MessageCommand.vue     # 命令执行卡片
  MessageConfirm.vue     # 确认请求卡片
  MessageText.vue        # 普通回复卡片
  InputBar.vue           # 底部输入栏
  DiffPanel.vue          # 右侧 Diff 面板
  ProjectSwitcher.vue    # 项目切换器弹窗/下拉
```

**理由**：

- 区域划分清晰，便于定位
- 消息类型组件独立，未来扩展新消息类型只需新增一个组件

### 4. 响应式策略：CSS 断点 + 状态驱动

**决策**：布局响应式主要通过 CSS/Tailwind 断点控制，面板折叠状态通过 Pinia state 管理。

**具体规则**：

- `xl`（≥1280px）：完整五栏布局
- `lg`（≥1024px）：Diff 面板折叠，可通过触发展开为 overlay
- `<lg`：左侧面板折叠，通过 Activity Bar 或汉堡菜单呼出
- 面板折叠状态持久化到 store，不持久化到 localStorage（暂不需要）

### 5. Mock 数据策略：集中 mock，结构对齐真实 API

**决策**：在 store 的 action 中返回 mock 数据，数据结构按未来真实 API 设计。

**理由**：

- 未来替换为真实 API 时，只需修改 action 内部实现，组件层无感知
- mock 数据包含多种状态（运行中/已结束、有变更/无变更），覆盖所有 UI 分支

### 6. Diff 渲染：简单文本 diff，不引入 diff 库

**决策**：diff 面板使用简单的行级 diff 展示，mock 数据中直接包含 diff 行数据（`{ type: 'added' | 'removed' | 'context', content: string }[]`），不引入 `diff` 或 `jsdiff` 等库。

**理由**：

- 当前阶段仅做 UI 展示，无需真实 diff 算法
- 减少依赖，未来需要真实 diff 时再引入

## Risks / Trade-offs

| 风险                            | 缓解措施                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| 单一 store 过大导致维护困难     | store 内部按功能区域分模块（state 分区），未来再考虑拆分      |
| Mock 数据结构与真实 API 偏差    | 设计类型时预留扩展字段，action 返回完整对象而非仅 UI 需要字段 |
| 消息类型组件过多                | 每种消息类型视觉差异大，合并不现实；通过命名规范保持可读性    |
| Diff 面板简单实现与未来需求冲突 | Diff 行数据结构标准化，后续替换渲染层即可，组件接口不变       |

## Migration Plan

无需迁移，这是全新页面。部署步骤：

1. 创建类型定义和 store
2. 创建布局容器组件
3. 创建各区域子组件
4. 组装到页面路由
5. 从 welcome 页面点击进入项目时跳转至此页面

## Open Questions

1. 会话消息的实时更新是否需要 WebSocket mock？（当前决定：不需要，用定时器模拟状态变化即可）
2. 文件树变更标记是否需要支持多层目录汇总？（当前决定：仅叶子文件显示标记，不向上汇总）
