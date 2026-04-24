## ADDED Requirements

### Requirement: Sidebar Runs Tab 提供 New Run 入口

系统 SHALL 在 Sidebar Runs Tab 顶部显示"+ New Run"按钮，点击后打开 New Run 对话框。

#### Scenario: 点击 New Run 按钮

- **WHEN** 用户点击"+ New Run"按钮
- **THEN** 弹出 New Run 对话框

### Requirement: New Run 对话框支持模板选择

系统 SHALL 在 New Run 对话框中提供模板选择下拉，默认选中项目默认模板，选中后显示 stage 序列预览。

#### Scenario: 默认模板选中

- **WHEN** 对话框打开
- **AND** 项目有设为默认的模板
- **THEN** 模板下拉默认选中该模板

#### Scenario: 无默认模板

- **WHEN** 对话框打开
- **AND** 项目无默认模板
- **THEN** 模板下拉默认选中第一个内置模板

#### Scenario: 显示 stage 序列预览

- **WHEN** 用户选中某个模板
- **THEN** 下拉下方显示该模板的 stage 序列（如"Discuss → Code → Test → Review"）
- **AND** 仅展示 enabled 的 stage

### Requirement: New Run 对话框支持输入源选择

系统 SHALL 在 New Run 对话框中提供输入源选择，根据模板的 `inputSpec.acceptedSources` 显示可用选项。

#### Scenario: Manual 文本输入

- **WHEN** 用户选择 Manual 输入源
- **THEN** 显示 textarea 供用户输入需求文本

#### Scenario: Integration 任务选择

- **WHEN** 用户选择 Integration 输入源
- **THEN** 显示 integration 下拉（仅已 connected）
- **AND** 选择 integration 后显示任务选择下拉
- **AND** 任务列表通过 IPC 从 integration 拉取

#### Scenario: 仅一种输入源

- **WHEN** 模板的 `acceptedSources` 仅包含一种来源
- **THEN** 不显示 radio 切换，直接显示对应输入表单

### Requirement: Run 标题可选填写

系统 SHALL 在 New Run 对话框中提供可选的 Run 标题输入框，留空时从输入内容自动生成。

#### Scenario: 用户填写标题

- **WHEN** 用户在标题输入框中填写文本
- **THEN** 创建的 Run 使用该标题

#### Scenario: 标题留空

- **WHEN** 用户未填写标题
- **THEN** 系统从 triggerInput 内容自动生成标题（截取前 50 字符）

### Requirement: 创建 Run 并跳转

系统 SHALL 在用户点击"Start Run"后创建 Run、关闭对话框、自动选中新 Run 并跳转到详情视图。

#### Scenario: 创建成功

- **WHEN** 用户点击"Start Run"
- **AND** 输入验证通过
- **THEN** 调用 `createRun` IPC
- **AND** 关闭对话框
- **AND** Sidebar 自动选中新创建的 Run
- **AND** 主区域显示该 Run 的详情视图

#### Scenario: 创建失败

- **WHEN** `createRun` IPC 返回错误
- **THEN** 对话框内显示错误信息
- **AND** 对话框不关闭

#### Scenario: 输入验证

- **WHEN** 用户点击"Start Run"
- **AND** 未提供任何输入（Manual 文本为空且未选择 integration 任务）
- **THEN** 显示验证错误"请提供输入"
- **AND** 不执行创建
