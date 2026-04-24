## 1. New Run 对话框

- [ ] 1.1 新增 `NewRunDialog.vue`：UModal 包裹，包含模板选择、输入源切换、标题输入、Start Run / Cancel 按钮
- [ ] 1.2 实现模板选择下拉：从 pipeline store 获取模板列表，默认选中 `isDefault` 模板或首个内置模板
- [ ] 1.3 实现选中模板后的 stage 序列预览（只读文本，如"Discuss → Code → Test → Review"）

## 2. 输入源

- [ ] 2.1 实现 Manual / Integration radio 切换（根据 `inputSpec.acceptedSources` 决定可用选项）
- [ ] 2.2 实现 Manual 文本 textarea
- [ ] 2.3 实现 Integration 下拉：从 integration store 获取已 connected 列表
- [ ] 2.4 实现任务选择下拉：选择 integration 后通过 IPC 拉取任务列表，支持 loading 状态与搜索过滤
- [ ] 2.5 仅一种输入源时隐藏 radio，直接显示对应表单

## 3. 创建逻辑

- [ ] 3.1 实现输入验证：模板已选 + 输入非空
- [ ] 3.2 实现 Start Run 按钮：调用 pipeline store `createRun` action → 关闭对话框 → 选中新 Run
- [ ] 3.3 实现错误处理：创建失败时对话框内显示错误
- [ ] 3.4 实现标题自动生成：留空时从 triggerInput 截取前 50 字符

## 4. Sidebar 入口

- [ ] 4.1 在 `PipelineSidebar.vue` Runs Tab 顶部添加"+ New Run"按钮
- [ ] 4.2 点击按钮打开 `NewRunDialog`

## 5. Store 适配

- [ ] 5.1 在 pipeline store 新增 `createRun({ templateId, triggerInput, title? })` action
- [ ] 5.2 新增 `fetchIntegrationTasks(integrationRef)` action：通过 IPC 拉取任务列表

## 6. 测试

- [ ] 6.1 为 `NewRunDialog.vue` 编写组件测试（模板选择、输入源切换、验证、创建流程）
