## ADDED Requirements

### Requirement: 类型系统定义 Template / Run / Stage / Event / Gate

系统 SHALL 在 `shared/types/pipeline.ts` 中导出以下核心类型，作为前后端共享契约：`PipelineTemplate`、`PipelineStageConfig`、`InputSpec`、`GateConfig`、`PipelineRun`、`PipelineStageRun`、`StageEvent`、`StageOutput`、`ReviewSeverity`、`ReviewComment`、`TestResult`、`DeployLog`。

#### Scenario: 类型导出完整

- **WHEN** 前端或主进程从 `@shared/types/pipeline` 导入类型
- **THEN** 上述所有类型均可导入且互相一致
- **AND** TypeScript `strict` 模式下编译通过

#### Scenario: GateConfig 为判别联合

- **WHEN** 代码访问 `GateConfig` 实例的 `type` 字段
- **THEN** 类型收窄到对应分支：`test-pass-rate`/`coverage` 提供 `threshold`，`no-critical-issue` 提供 `maxAllowedSeverity`，`build-success` 无额外字段，`approval` 提供可选 `prompt`
- **AND** `kind` 字段区分 `auto` 与 `manual`

### Requirement: Template 包含 inputSpec 与 stages

系统 SHALL 要求 `PipelineTemplate` 携带 `inputSpec`（描述触发输入要求）与 `stages: PipelineStageConfig[]`（按顺序排列的 stage 配置）。

#### Scenario: 模板声明输入来源

- **WHEN** 模板定义中 `inputSpec.acceptedSources` 包含 `['manual', 'yunxiao']`
- **THEN** 创建 Run 流程允许用户在这两种来源中选择一种

#### Scenario: 每个 stage 携带必要配置

- **WHEN** 读取任意 `PipelineStageConfig`
- **THEN** 包含 `id`、`type`、`name`、`promptTemplate`、`integrationRef`（可为 `null`）、`gates`、`failureStrategy`、可选 `maxRetries`

### Requirement: Run 携带 templateSnapshot 与状态机

系统 SHALL 在 `PipelineRun` 中存储 `templateSnapshot: PipelineTemplate`（创建时深拷贝），且 `status` 取值限定为 `created` / `running` / `waiting-approval` / `waiting-clarification` / `completed` / `failed` / `aborted`。

#### Scenario: 模板修改不影响历史 Run

- **WHEN** 一个 Run 创建后，源模板被编辑或删除
- **THEN** 该 Run 的 `templateSnapshot` 保持原貌
- **AND** 历史 Run 详情仍可正常渲染 stage 配置

#### Scenario: Run 状态枚举完整

- **WHEN** 任意 Run 状态变更
- **THEN** 新状态属于上述 7 种之一
- **AND** 不允许出现其他字符串值

### Requirement: Stage 状态与 Stage Run 引用事件流

系统 SHALL 要求 `PipelineStageRun.status` 取值为 `pending` / `running` / `passed` / `failed` / `skipped` / `waiting-approval`，并通过 `eventCount`、`tokensUsed`、`startedAt`、`endedAt`、`durationMs` 提供运行摘要；事件详情存储于独立 JSONL 文件。

#### Scenario: Stage 摘要轻量

- **WHEN** 读取 `run.json` 中的 `stages` 数组
- **THEN** 仅包含状态与摘要字段
- **AND** 不包含 `events` 数组的内容

#### Scenario: 事件按需 lazy load

- **WHEN** 用户在 UI 中选中某个 stage
- **THEN** 系统按 `runId` 与 `stageId` 读取对应 `events.jsonl`
- **AND** 未被选中的 stage 不读取事件文件

### Requirement: StageEvent 为统一结构化事件

系统 SHALL 定义 `StageEvent` 为判别联合类型，覆盖 `agent-message` / `tool-call` / `file-change` / `test-result` / `review-comment` / `deploy-log` / `clarification` / `gate-evaluated`，每个事件携带 `id`、`stageId`、`timestamp`、`type` 与对应 payload。

#### Scenario: 事件按 type 收窄

- **WHEN** 处理 `StageEvent` 时分支判断 `type === 'review-comment'`
- **THEN** TypeScript 收窄到包含 `severity`、`file`、`line`、`message`、`category` 等字段的具体形态

#### Scenario: 事件可被前端按 stage 类型分组渲染

- **WHEN** 前端渲染 Test Stage 详情
- **THEN** 仅消费 `test-result` 与 `agent-message`/`tool-call` 等通用事件
- **AND** 忽略不相关类型

### Requirement: Review Severity 5 级且强制可比

系统 SHALL 定义 `ReviewSeverity = 'blocker' | 'critical' | 'major' | 'minor' | 'info'`，并提供 `compareSeverity(a, b)` 工具函数（blocker > critical > major > minor > info）。

#### Scenario: Gate 阈值判定

- **WHEN** Gate 配置 `maxAllowedSeverity = 'major'` 且某 review-comment 的 `severity = 'critical'`
- **THEN** `compareSeverity('critical', 'major') > 0` 成立
- **AND** Gate 评估结果为失败

#### Scenario: 无问题或仅低于阈值

- **WHEN** 所有 review-comment 的 severity 均不高于 `maxAllowedSeverity`
- **THEN** Gate 评估结果为通过

### Requirement: 持久化文件布局固定

系统 SHALL 在用户数据目录下使用以下结构持久化 Pipeline 数据：

```
data/pipelines/
  templates/
    builtin-<id>.json
    custom-<uuid>.json
  runs/
    <runId>/
      run.json
      stages/
        <stageId>/
          events.jsonl
          output.json
```

#### Scenario: Template 文件按 source 命名

- **WHEN** 创建一个自定义模板
- **THEN** 文件名形如 `custom-<uuid>.json`
- **AND** 内置模板文件名以 `builtin-` 开头

#### Scenario: Run 目录组织

- **WHEN** 创建一个新 Run
- **THEN** 创建 `runs/<runId>/` 目录与 `run.json`
- **AND** 每个 stage 启动时创建 `stages/<stageId>/` 子目录

### Requirement: JSON 文件原子写入

系统 SHALL 在写入 `templates/*.json`、`runs/<id>/run.json`、`stages/<id>/output.json` 时采用 "写入临时文件 + 原子 rename" 策略，避免崩溃导致文件半写。

#### Scenario: 进程在写入中崩溃

- **WHEN** 主进程在写入 `run.json` 期间崩溃
- **THEN** 原 `run.json` 保持上一次成功写入后的内容
- **AND** 残留的临时文件可在下次启动时清理

### Requirement: events.jsonl 按行追加

系统 SHALL 以 JSONL 格式（每行一个 `StageEvent` JSON）追加写入事件，使用 `fs.appendFile`，每次写入构造完整的"行 + 换行符"字符串后一次性追加。

#### Scenario: 流式写入不阻塞读取

- **WHEN** subagent 持续输出，主进程持续追加事件
- **THEN** 前端读取已有部分事件不被阻塞
- **AND** 事件按写入顺序读出

#### Scenario: 进程崩溃丢失最后一行

- **WHEN** 主进程在追加事件 N 期间崩溃
- **THEN** 已成功写入的事件 1..N-1 保持完整可解析
- **AND** 第 N 条事件最多丢失，不损坏整个文件

### Requirement: Run 列表读取轻量

系统 SHALL 提供运行列表读取能力，仅枚举 `runs/<runId>/run.json`，不读取任何 stage 事件文件。

#### Scenario: 列表加载

- **WHEN** Pipeline 页 Sidebar Runs Tab 打开
- **THEN** 主进程枚举 `runs/` 目录下的 `run.json` 文件
- **AND** 返回精简的 Run 列表（id、title、status、currentStageIndex、updatedAt 等）
- **AND** 不读取任何 `events.jsonl` 或 `output.json`
