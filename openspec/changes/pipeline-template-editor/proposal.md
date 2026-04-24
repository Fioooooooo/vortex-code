## Why

用户需要创建和编辑 Pipeline 模板来定义自动化流程。MVP 阶段提供表单式编辑器（非拖拽），配合 YAML 只读预览，让用户能增删 stage、调整顺序、配置 Gate 条件（含 review severity 阈值）、选择 integration tool。内置模板不可直接编辑，需先复制为自定义模板。

## What Changes

- **新增** 模板编辑器主视图 `PipelineTemplateEditor.vue`：表单式 stage 配置 + YAML 只读预览面板
- **新增** Stage 配置卡片组件 `StageConfigCard.vue`：展开/折叠式，包含 type、name、integration 选择、prompt 编辑、Gate 配置、失败策略
- **新增** Gate 配置组件 `GateConfigEditor.vue`：按 gate type 渲染不同表单（threshold 输入、severity 下拉、approval prompt 输入）
- **新增** 上下箭头排序交互（不做拖拽）
- **新增** YAML 只读预览面板：将模板配置序列化为 YAML 展示
- **新增** 内置模板复制机制：编辑内置模板时自动创建 custom 副本
- **新增** Integration 下拉选择：仅显示已 connected 的 integration，未 connected 的不可选

## Capabilities

### New Capabilities

- `pipeline-template-editor`: 模板编辑器的完整交互定义，包括 stage 增删排序、Gate 配置、YAML 预览、内置模板复制

### Modified Capabilities

- `pipeline-templates`: 新增编辑/复制/设为默认的 UI 行为
- `pipeline-page`: Sidebar Templates Tab 选中模板后主区域渲染编辑器

## Impact

- **代码**：新增 ~5 个 Vue 组件；修改 `PipelinePage.vue` 主区域路由逻辑
- **Store**：pipeline store 新增 `selectedTemplateId`、模板编辑状态
- **依赖**：YAML 序列化用 `yaml` npm 包（或 `js-yaml`）
