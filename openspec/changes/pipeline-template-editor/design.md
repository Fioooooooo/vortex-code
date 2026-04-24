## Context

Pipeline 模板定义了 stage 序列、Gate 条件、失败策略与 prompt 模板。`pipeline-data-model` change 已定义了 `PipelineTemplate` / `PipelineStageConfig` / `GateConfig` 类型。本 change 实现模板的 UI 编辑能力。

**已有资产：**

- `pipeline-templates` spec 定义了 Sidebar Templates Tab 的列表行为
- Integration 页面已完善，可查询已 connected 的 tool 列表

**核心约束：**

- MVP 不做拖拽排序，用上下箭头
- YAML 预览只读，不支持双向编辑
- 内置模板不可直接编辑，编辑时自动复制为 custom

## Goals / Non-Goals

**Goals:**

- 实现表单式模板编辑器，覆盖 stage 增删排序、Gate 配置、integration 选择
- 实现 YAML 只读预览
- 实现内置模板复制机制
- 实现 review severity 阈值配置（`no-critical-issue` Gate 的 `maxAllowedSeverity` 下拉）

**Non-Goals:**

- 不做拖拽排序（V2 可加）
- 不做 YAML 双向编辑
- 不做自定义 Gate 类型
- 不做 prompt 模板变量系统（MVP 用纯文本 textarea）

## Decisions

### Decision 1: 表单式编辑器布局

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Template: My Backend Flow                [Save][Cancel]│
├─────────────────────────────────────────────────────────────┤
│  Name        [_______________________]                       │
│  Description [_______________________]                       │
│  Input Source ☑ Manual  ☑ 云效  ☐ ...                       │
│                                                              │
│  Stages                                                      │
│  ┌────────────────────────────────────────────────┐         │
│  │ 1. Discuss        [⬆][⬇][🗑] [▼ Expand]        │         │
│  │   Type: discuss                                 │         │
│  │   Integration: [云效 ▼] (only connected)        │         │
│  │   Prompt: [textarea]                            │         │
│  │   Gates: [+ Add Gate]                           │         │
│  │   Failure: [pause ▼]                            │         │
│  └────────────────────────────────────────────────┘         │
│  [+ Add Stage ▼]                                            │
│                                                              │
│  ── YAML Preview ──                                         │
│  (折叠的只读 YAML 面板)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Decision 2: Stage 配置卡片展开/折叠

每个 stage 默认折叠（只显示序号、名称、类型、操作按钮），点击展开显示完整配置表单。同一时间只展开一个 stage（手风琴模式）。

### Decision 3: Gate 配置按类型渲染

- `test-pass-rate`：数字输入（threshold %）
- `coverage`：数字输入（threshold %）
- `no-critical-issue`：下拉选择 maxAllowedSeverity（blocker/critical/major/minor/info）
- `build-success`：无额外配置
- `manual-approval`：可选文本输入（prompt）

### Decision 4: Integration 下拉仅显示已 connected

从 integration store 获取已 connected 的 tool 列表，未 connected 的不出现在下拉中。若当前 stage 需要 integration 但无可用选项，显示提示"请先在 Integration 页面连接工具"。

### Decision 5: YAML 预览用 `js-yaml` 序列化

将当前编辑中的模板配置实时序列化为 YAML 字符串，在折叠面板中以代码高亮展示。只读，不可编辑。

### Decision 6: 内置模板编辑触发复制

用户点击内置模板的"编辑"按钮时：

1. 弹出提示"内置模板不可直接编辑，将创建副本"
2. 创建 `source='custom'` 的副本
3. 打开副本的编辑器

## Risks / Trade-offs

- **[Trade-off] 上下箭头排序体验不如拖拽** → MVP 可接受，V2 可引入拖拽库
- **[风险] YAML 预览与表单不同步** → 缓解：YAML 从 reactive 表单数据实时计算，无独立状态
