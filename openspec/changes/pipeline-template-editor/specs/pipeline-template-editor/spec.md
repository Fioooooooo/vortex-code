## ADDED Requirements

### Requirement: 模板编辑器表单式布局

系统 SHALL 在用户选中 Sidebar Templates Tab 中的某个模板并点击编辑时，在主区域渲染表单式编辑器，包含模板基本信息、Stage 列表与 YAML 预览。

#### Scenario: 打开编辑器

- **WHEN** 用户点击自定义模板的编辑按钮
- **THEN** 主区域渲染模板编辑器
- **AND** 顶部显示模板名称输入、描述输入、输入源多选
- **AND** 中部显示 Stage 配置卡片列表
- **AND** 底部显示 YAML 只读预览（默认折叠）
- **AND** 顶部右侧显示 Save 和 Cancel 按钮

### Requirement: Stage 配置卡片支持展开/折叠

系统 SHALL 以手风琴模式渲染 Stage 配置卡片，默认折叠显示序号、名称、类型与操作按钮，展开显示完整配置表单。

#### Scenario: 折叠态

- **WHEN** Stage 卡片处于折叠态
- **THEN** 显示序号、stage 名称、stage 类型标签
- **AND** 显示上移/下移/删除按钮与展开箭头

#### Scenario: 展开态

- **WHEN** 用户点击展开某个 Stage 卡片
- **THEN** 该卡片展开显示完整配置表单
- **AND** 其他已展开的卡片自动折叠

#### Scenario: 展开态表单内容

- **WHEN** Stage 卡片展开
- **THEN** 显示 Name 输入框、Integration 下拉、Prompt Template textarea、Gates 配置区、Failure Strategy 下拉
- **AND** 若 failureStrategy 为 `retry`，额外显示 maxRetries 数字输入

### Requirement: 上下箭头排序 Stage

系统 SHALL 在每个 Stage 卡片上提供上移和下移按钮，点击后调整 stage 在列表中的位置。

#### Scenario: 上移 stage

- **WHEN** 用户点击某 stage 的上移按钮
- **AND** 该 stage 不是第一个
- **THEN** 该 stage 与上方 stage 交换位置

#### Scenario: 首个 stage 上移按钮禁用

- **WHEN** stage 是列表中的第一个
- **THEN** 上移按钮显示为禁用状态

### Requirement: 增删 Stage

系统 SHALL 在 Stage 列表底部提供"Add Stage"按钮，点击后弹出 stage 类型选择下拉，选择后在列表末尾添加新 stage。每个 stage 卡片提供删除按钮。

#### Scenario: 添加 stage

- **WHEN** 用户点击"Add Stage"并选择类型（如 `test`）
- **THEN** 列表末尾添加一个新的 stage 卡片
- **AND** 新 stage 使用该类型的默认配置

#### Scenario: 删除 stage

- **WHEN** 用户点击某 stage 的删除按钮
- **THEN** 弹出确认对话框
- **AND** 确认后从列表中移除该 stage

### Requirement: Gate 配置按类型渲染

系统 SHALL 在 Stage 卡片的 Gates 配置区，按 Gate 类型渲染不同的配置表单。

#### Scenario: test-pass-rate Gate

- **WHEN** 用户添加 `test-pass-rate` Gate
- **THEN** 显示 threshold 数字输入（0-100%）

#### Scenario: no-critical-issue Gate

- **WHEN** 用户添加 `no-critical-issue` Gate
- **THEN** 显示 maxAllowedSeverity 下拉（blocker/critical/major/minor/info）
- **AND** 默认值为 `major`

#### Scenario: manual-approval Gate

- **WHEN** 用户添加 `manual-approval` Gate
- **THEN** 显示可选的 prompt 文本输入

### Requirement: Integration 下拉仅显示已 connected 的工具

系统 SHALL 在 Stage 配置的 Integration 下拉中，仅列出当前项目已 connected 的 integration tool。

#### Scenario: 有已连接工具

- **WHEN** 项目已连接云效
- **THEN** Integration 下拉中显示"云效"选项
- **AND** 未连接的工具不出现

#### Scenario: 无可用工具

- **WHEN** 当前 stage 类型需要 integration 但无已连接工具
- **THEN** 下拉显示为空
- **AND** 下方显示提示"请先在 Integration 页面连接工具"

### Requirement: YAML 只读预览

系统 SHALL 在编辑器底部提供可折叠的 YAML 预览面板，实时展示当前模板配置的 YAML 序列化结果，不可编辑。

#### Scenario: 展开 YAML 预览

- **WHEN** 用户展开 YAML 预览面板
- **THEN** 显示当前模板配置的 YAML 格式文本
- **AND** 文本带语法高亮
- **AND** 不可编辑

#### Scenario: 实时同步

- **WHEN** 用户修改表单中的任何配置
- **THEN** YAML 预览实时更新

### Requirement: 内置模板编辑触发复制

系统 SHALL 在用户尝试编辑内置模板时，自动创建自定义副本并打开副本的编辑器。

#### Scenario: 编辑内置模板

- **WHEN** 用户点击内置模板的编辑按钮
- **THEN** 弹出提示"内置模板不可直接编辑，将创建副本"
- **AND** 用户确认后创建 `source='custom'` 的副本
- **AND** 打开副本的编辑器

### Requirement: 保存模板验证

系统 SHALL 在用户点击 Save 时验证模板配置的完整性。

#### Scenario: 验证通过

- **WHEN** 模板名称非空且至少有一个 stage
- **THEN** 保存成功并返回模板列表

#### Scenario: 验证失败

- **WHEN** 模板名称为空或无 stage
- **THEN** 显示验证错误提示
- **AND** 不执行保存
