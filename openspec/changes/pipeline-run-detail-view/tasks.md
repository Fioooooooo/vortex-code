## 1. 主视图骨架

- [ ] 1.1 新增 `PipelineRunDetail.vue`：三段式布局（Run Header + Stage Flow + Stage Detail Panel），接收 `runId` prop
- [ ] 1.2 新增 `PipelineRunHeader.vue`：显示 Run 标题、模板名、时间、运行时长（运行中实时更新）、Abort 按钮
- [ ] 1.3 新增 `PipelineEmptyState.vue`：未选中 Run 时的空态引导
- [ ] 1.4 修改 `PipelinePage.vue`：主区域根据 `selectedRunId` 渲染 `PipelineRunDetail` 或 `PipelineEmptyState`

## 2. Stage Flow 组件

- [ ] 2.1 新增 `StageFlow.vue`：横向排列 stage 节点 + 连接线 + Gate 菱形标记
- [ ] 2.2 实现节点状态视觉样式（遵循 `pipeline-stage-visualization` spec 的颜色规则）
- [ ] 2.3 实现选中态样式（加粗边框或底部指示器）
- [ ] 2.4 实现点击节点切换 `selectedStageId`
- [ ] 2.5 实现自动定位逻辑：运行中默认选中活动 stage，stage 变更时自动切换
- [ ] 2.6 实现"跟随最新"按钮：手动选中后暂停自动定位，点击按钮恢复

## 3. Stage Detail Panel 框架

- [ ] 3.1 新增 `StageDetailPanel.vue`：Summary / Agent Log Tab 切换，根据 stage type 动态渲染对应面板
- [ ] 3.2 新增 `AgentLogView.vue`：通用事件流渲染（agent-message 气泡、tool-call 折叠块），支持虚拟滚动

## 4. 5 种 Stage Summary 面板

- [ ] 4.1 新增 `DiscussStagePanel.vue`：需求摘要 + 澄清问答列表
- [ ] 4.2 新增 `CodeStagePanel.vue`：文件变更列表 + 当前动作指示器
- [ ] 4.3 新增 `TestStagePanel.vue`：测试结果摘要（通过/失败/跳过/覆盖率）+ 失败用例列表
- [ ] 4.4 新增 `ReviewStagePanel.vue`：severity 统计 + review 意见列表（severity badge + 文件位置 + 建议）
- [ ] 4.5 新增 `DeployStagePanel.vue`：部署状态 + 日志流 + 部署 URL

## 5. Orchestrator 折叠抽屉

- [ ] 5.1 新增 `OrchestratorDrawer.vue`：折叠/展开切换，折叠时显示一行摘要，展开时显示消息流
- [ ] 5.2 实现高度可拖拽调整
- [ ] 5.3 集成到 `StageDetailPanel.vue` 底部

## 6. Store 与数据流

- [ ] 6.1 在 pipeline store 中新增 `selectedRunId`、`selectedStageId`、`stageEvents`、`isAutoFollowing` 状态
- [ ] 6.2 实现 `loadStageEvents(runId, stageId)` action：通过 IPC 读取 events.jsonl
- [ ] 6.3 实现 stage event 实时订阅：监听 `pipeline:stage-event`，过滤当前 runId + stageId 后追加
- [ ] 6.4 实现 stage 切换时清空事件缓存并重新加载

## 7. 测试

- [ ] 7.1 为 `StageFlow.vue` 编写组件测试（节点渲染、点击切换、自动定位）
- [ ] 7.2 为各 Stage Summary 面板编写组件测试（mock StageEvent 数据验证渲染）
