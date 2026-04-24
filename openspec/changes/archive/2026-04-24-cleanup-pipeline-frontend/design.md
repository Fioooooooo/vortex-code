## Context

Pipeline 页面当前的前端实现依赖 `pipeline.mock.ts` 提供初始数据，并在 store 初始化时自动启动 `simulateProgress` 定时器（每 2 秒更新一次状态）。整个运行流程、阶段状态流转、stage 详情内容均基于 mock 驱动。

后续计划将 Pipeline store 接入真实的 Electron IPC API（通过 `api/pipeline.ts` 中已声明的接口），因此需要先清理掉 mock 层，避免旧有 mock 逻辑与真实数据层产生干扰或混淆。

## Goals / Non-Goals

**Goals:**

- 删除 `pipeline.mock.ts`，彻底移除 mock 数据生成模块
- 精简 `pipeline store`：移除 mock 初始化、模拟进度定时器、所有依赖 mock 数据的初始状态填充
- 删除 `frontend/src/components/pipeline/` 下除 `PipelineSidebar.vue` 外的所有组件文件
- 将 `PipelineSidebar.vue` 精简为 sidebar 外壳：保留 UTabs 和 content div，删除 RunList / TemplateList 引用
- 将 `pipeline.vue` 精简为 sidebar + main 空白布局，不再引用已删除的 Pipeline 子组件
- 保持 `/pipeline` 路由页面可正常渲染，为后续从头重构留出干净结构

**Non-Goals:**

- 不修改 `api/pipeline.ts`
- 不修改 `shared/types/pipeline.ts`
- 不实现任何真实的 IPC 数据接入逻辑
- 不修改应用外壳（AppLayout、ActivityBar、AppHeader）
- 不调整 pipeline-page spec 中的布局结构要求

## Decisions

### 决策 1：删除 mock 文件而非注释掉

**选择**：直接删除 `pipeline.mock.ts`，而不是保留并注释。

**理由**：mock 文件会产生误导，让后续开发者误以为这是真实数据结构的参考。类型定义已在 `shared/types/pipeline.ts` 中，不依赖 mock 文件。

**替代方案**：保留但 export 空数组 → 拒绝，因为会保留无意义的依赖关系。

### 决策 2：Store 保留状态字段，清空初始值

**选择**：保留 store 中所有状态字段（`templates`、`runs`、`selectedRunId` 等），但初始值全部改为空/null，移除 mock 数据填充调用。

**理由**：后续 IPC 接入时 store 结构不变，只需添加从 API 加载数据的 action。若连字段也删除，重构成本更高。

**替代方案**：同时重构 store 为更精简的结构 → 推迟到 IPC 联动阶段，本次变更范围保持最小。

### 决策 3：删除所有 Pipeline 子组件，仅保留 PipelineSidebar 骨架

**选择**：删除 `components/pipeline/` 下除 `PipelineSidebar.vue` 外的全部 18 个组件文件；`PipelineSidebar.vue` 保留 UTabs 切换器和 content div，移除内部的 RunList / TemplateList 引用。

**理由**：用户明确表示需要从头重构，保留现有组件骨架反而会形成惯性包袱，影响重构自由度。干净删除后重构方向更清晰，不受旧实现约束。

**替代方案**：保留骨架替换内容 → 拒绝，旧组件结构（props、emit、内部逻辑）仍会干扰重构判断。

### 决策 4：pipeline.vue 改为最小布局占位

**选择**：`pipeline.vue` 保留 flex 布局（`<PipelineSidebar>` + `<main>` 空 div），移除对 RunDetailView、TemplateEditor、PipelineEmptyState、NewRunModal 的所有引用。

**理由**：页面文件不依赖任何已删除组件，`pnpm typecheck` 才能通过。后续重构时直接在 main 区域添加内容即可。

## Risks / Trade-offs

- **风险**：清理后某些组件内部仍可能有对 mock 数据字段的隐式依赖（如类型断言）→ **缓解**：清理时同步检查 TypeScript 类型，确保 `pnpm typecheck` 通过
- **风险**：store 中移除 `simulateProgress` 后，若某处代码仍调用该方法则编译报错 → **缓解**：全局 grep 确认无残留调用再删除
- **Trade-off**：stage 详情组件清理后显示占位内容，页面视觉上会有退化 → 这是预期的，属于本次变更的目标状态
