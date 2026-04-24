## 1. 编辑器主视图

- [ ] 1.1 新增 `PipelineTemplateEditor.vue`：表单布局（基本信息 + Stage 列表 + YAML 预览），接收 `templateId` prop
- [ ] 1.2 实现 Save / Cancel 按钮逻辑：Save 触发验证 → 调用 IPC 保存 → 返回列表；Cancel 丢弃修改
- [ ] 1.3 实现模板基本信息表单：Name 输入、Description 输入、Input Source 多选（checkbox）
- [ ] 1.4 修改 `PipelinePage.vue`：Sidebar Templates Tab 选中模板后主区域渲染编辑器

## 2. Stage 配置卡片

- [ ] 2.1 新增 `StageConfigCard.vue`：手风琴展开/折叠，折叠态显示序号+名称+类型+操作按钮
- [ ] 2.2 实现展开态表单：Name、Integration 下拉、Prompt textarea、Gates 区、Failure Strategy 下拉（retry 时显示 maxRetries）
- [ ] 2.3 实现上移/下移按钮（首个禁用上移，末个禁用下移）
- [ ] 2.4 实现删除按钮（带确认对话框）
- [ ] 2.5 实现"Add Stage"按钮 + stage 类型选择下拉

## 3. Gate 配置

- [ ] 3.1 新增 `GateConfigEditor.vue`：按 gate type 渲染不同表单
- [ ] 3.2 实现 `test-pass-rate` / `coverage` 的 threshold 数字输入
- [ ] 3.3 实现 `no-critical-issue` 的 maxAllowedSeverity 下拉（5 级）
- [ ] 3.4 实现 `build-success` 的无配置提示
- [ ] 3.5 实现 `manual-approval` 的 prompt 文本输入
- [ ] 3.6 实现"Add Gate"按钮 + gate type 选择下拉

## 4. Integration 下拉

- [ ] 4.1 从 integration store 获取已 connected 的 tool 列表
- [ ] 4.2 实现下拉组件：仅显示已 connected 的工具，未 connected 不出现
- [ ] 4.3 无可用工具时显示提示文案

## 5. YAML 预览

- [ ] 5.1 安装 `js-yaml` 依赖（如未安装）
- [ ] 5.2 新增 `YamlPreview.vue`：折叠面板，展开后显示只读 YAML 文本（带语法高亮）
- [ ] 5.3 实现从 reactive 表单数据实时计算 YAML 字符串

## 6. 内置模板复制

- [ ] 6.1 实现编辑内置模板时的复制逻辑：弹提示 → 创建 custom 副本 → 打开副本编辑器
- [ ] 6.2 Sidebar Templates Tab 中内置模板显示"复制"按钮而非"编辑"按钮

## 7. Store 适配

- [ ] 7.1 在 pipeline store 中新增 `selectedTemplateId`、`editingTemplate` 状态
- [ ] 7.2 实现 `copyTemplate(id)` action：调用 IPC 复制模板
- [ ] 7.3 实现 `setDefaultTemplate(projectId, templateId)` action

## 8. 测试

- [ ] 8.1 为 `StageConfigCard.vue` 编写组件测试（展开/折叠、上下移动、删除）
- [ ] 8.2 为 `GateConfigEditor.vue` 编写组件测试（各 gate type 表单渲染）
- [ ] 8.3 为 YAML 预览编写单元测试（模板配置 → YAML 字符串转换）
