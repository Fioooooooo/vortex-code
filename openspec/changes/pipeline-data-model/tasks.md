## 1. 类型系统重构

- [ ] 1.1 重写 `shared/types/pipeline.ts`：定义 `ReviewSeverity`、`GateConfig`（判别联合）、`StageEvent`（判别联合）、`InputSpec`、更新 `PipelineTemplate`（加 `inputSpec`、`builtinVersion`）、`PipelineStageConfig`（`gates` 改为 `GateConfig[]`、加 `integrationRef`、`enabled`、`maxRetries`）、`PipelineRun`（加 `templateSnapshot`、新状态枚举）、`PipelineStageRun`（移除内嵌 events，加 `eventCount`）
- [ ] 1.2 新增 `shared/pipeline/severity.ts`：导出 `SEVERITY_ORDER` 常量与 `compareSeverity(a, b)` 工具函数
- [ ] 1.3 确保 `tsconfig.web.json` 和 `tsconfig.node.json` 均可解析 `@shared/pipeline/*` 路径

## 2. 内置模板定义

- [ ] 2.1 新增 `shared/pipeline/builtin-templates.ts`：导出 `BUILTIN_TEMPLATES: PipelineTemplate[]`，包含 Standard Dev Flow、Quick Fix、Review Only 三个模板的完整配置（stage 序列、Gate、failureStrategy、promptTemplate 骨架、inputSpec）
- [ ] 2.2 为每个内置模板设置 `builtinVersion: 1`，供升级检测使用

## 3. 持久化层

- [ ] 3.1 新增 `electron/main/services/pipeline-storage.ts`：实现 Template CRUD（`listTemplates`、`getTemplate`、`saveTemplate`、`removeTemplate`）与 Run CRUD（`listRuns`、`getRun`、`saveRun`）
- [ ] 3.2 实现原子写入工具函数 `atomicWriteJson(filePath, data)`：写临时文件 + `fs.rename`
- [ ] 3.3 实现 `appendStageEvent(runId, stageId, event)`：构造完整行 + `\n` 后 `fs.appendFile`
- [ ] 3.4 实现 `readStageEvents(runId, stageId)`：逐行解析 JSONL，跳过不完整的末行
- [ ] 3.5 实现 `saveStageOutput(runId, stageId, output)` 与 `readStageOutput(runId, stageId)`
- [ ] 3.6 实现内置模板注入逻辑：检查 `builtin-*.json` 是否存在及 `builtinVersion`，按需写入/覆盖

## 4. IPC 层适配

- [ ] 4.1 更新 `electron/main/ipc/pipeline.ts`：所有 handler 改用 `pipeline-storage` 服务
- [ ] 4.2 更新 `electron/preload/index.ts`：确保 `window.api.pipeline` 类型与新数据模型一致
- [ ] 4.3 更新 `frontend/src/api/pipeline.ts`：调用签名与返回类型同步

## 5. 前端 Store 同步

- [ ] 5.1 更新 `frontend/src/stores/pipeline.ts`：类型对齐新 `PipelineTemplate` / `PipelineRun`
- [ ] 5.2 确保 `sortedRuns` computed 正确处理新增的 `waiting-approval` / `waiting-clarification` 状态（与 `running` 同优先级置顶）

## 6. 测试

- [ ] 6.1 为 `compareSeverity` 编写单元测试（覆盖全部 5 级两两比较）
- [ ] 6.2 为 `atomicWriteJson` 编写单元测试（正常写入 + 模拟崩溃场景）
- [ ] 6.3 为 `appendStageEvent` / `readStageEvents` 编写单元测试（空文件、多行、末行不完整）
- [ ] 6.4 为内置模板注入逻辑编写单元测试（首次注入、重复跳过、版本升级覆盖）
- [ ] 6.5 为 `GateConfig` 类型收窄编写类型测试（确保 `type` 判别后字段可访问）
