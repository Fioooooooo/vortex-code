## ADDED Requirements

### Requirement: Discuss Stage Summary 面板

系统 SHALL 在 Discuss Stage 的 Summary 视图中展示需求摘要、澄清问答列表与最终确认的需求文档。

#### Scenario: 渲染需求摘要

- **WHEN** 用户查看已完成的 Discuss Stage Summary
- **THEN** 面板显示需求摘要文本（从 `StageOutput.summary` 提取）
- **AND** 显示澄清问答列表（从 `clarification` 类型事件提取）

### Requirement: Code Stage Summary 面板

系统 SHALL 在 Code Stage 的 Summary 视图中展示文件变更列表与当前动作指示器。

#### Scenario: 渲染文件变更列表

- **WHEN** 用户查看 Code Stage Summary
- **THEN** 面板显示文件变更列表（文件名 + 操作类型 + diff 统计）
- **AND** 从 `file-change` 类型事件中提取数据

#### Scenario: 运行中显示当前动作

- **WHEN** Code Stage 正在运行
- **THEN** Summary 底部显示当前动作指示器（如"Running: pnpm typecheck"）
- **AND** 从最新的 `tool-call` 事件中提取

### Requirement: Test Stage Summary 面板

系统 SHALL 在 Test Stage 的 Summary 视图中展示测试运行摘要、覆盖率与失败用例列表。

#### Scenario: 渲染测试结果

- **WHEN** 用户查看 Test Stage Summary
- **THEN** 面板显示通过/失败/跳过数量
- **AND** 显示覆盖率百分比
- **AND** 从 `test-result` 类型事件中提取数据

#### Scenario: 展示失败用例

- **WHEN** 存在失败的测试用例
- **THEN** 面板显示失败用例列表（测试名、文件路径、错误信息）
- **AND** 列表按 severity 排序

### Requirement: Review Stage Summary 面板

系统 SHALL 在 Review Stage 的 Summary 视图中展示 review 意见列表与整体统计。

#### Scenario: 渲染 review 意见

- **WHEN** 用户查看 Review Stage Summary
- **THEN** 面板显示 review 意见列表
- **AND** 每条意见包含 severity badge（颜色编码）、文件位置、建议内容
- **AND** 从 `review-comment` 类型事件中提取数据

#### Scenario: 显示 severity 统计

- **WHEN** Review Stage 有 review 意见
- **THEN** 面板顶部显示各 severity 级别的数量统计（如"1 blocker · 2 critical · 3 major"）
- **AND** 显示 Gate 阈值（如"Threshold: major"）

### Requirement: Deploy Stage Summary 面板

系统 SHALL 在 Deploy Stage 的 Summary 视图中展示部署状态、部署日志流与部署 URL。

#### Scenario: 渲染部署结果

- **WHEN** 用户查看已完成的 Deploy Stage Summary
- **THEN** 面板显示部署状态（success/failed）
- **AND** 显示部署 URL（可点击）
- **AND** 显示部署日志流（从 `deploy-log` 类型事件提取）

### Requirement: Agent Log 视图通用渲染

系统 SHALL 在 Agent Log 视图中以时间顺序渲染该 stage 的所有 `StageEvent`，不同事件类型使用不同的视觉样式。

#### Scenario: 渲染 agent-message 事件

- **WHEN** Agent Log 中包含 `agent-message` 事件
- **THEN** 以对话气泡形式渲染（区分 assistant/user/system role）

#### Scenario: 渲染 tool-call 事件

- **WHEN** Agent Log 中包含 `tool-call` 事件
- **THEN** 以折叠块形式渲染（工具名 + 输入摘要，展开可看完整输入输出）

#### Scenario: 大量事件虚拟滚动

- **WHEN** 某 stage 的事件数量超过 100 条
- **THEN** Agent Log 使用虚拟滚动渲染
- **AND** 滚动性能不受事件总量影响
