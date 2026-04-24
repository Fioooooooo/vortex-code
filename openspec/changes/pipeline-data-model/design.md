## Context

Pipeline 模块是 FylloCode 的核心自动化能力：用户定义模板 → 触发 Run → LLM 驱动的 Fyllo Orchestrator 按 stage 编排 headless Claude Code subagent → 人工在 Gate 节点介入。模块跨越 main/renderer 两端与多个子进程，状态复杂，需要稳定的数据模型与持久化契约作为地基。

**既有资产：**

- `shared/types/pipeline.ts` 已有初版类型（template/run/stage/gate/review 等）
- `openspec/specs/pipeline-runs/spec.md`、`pipeline-templates/spec.md`、`pipeline-stage-details/spec.md` 已有上层 UI 需求
- `electron/main/ipc/pipeline.ts`（推测路径）已有 CRUD IPC 骨架

**核心约束：**

- MVP 阶段不支持自定义 Gate 类型、不支持自定义 Stage 类型、不做并行分支
- 3 个内置模板必须开箱可用
- 历史 Run 在模板删除/修改后仍可完整查看
- Agent log 可能很大（单 stage 数 MB），不能全量塞进 run.json

## Goals / Non-Goals

**Goals:**

- 定义稳定的 Template / Run / Stage / Event / Gate 类型，支撑后续所有 UI 与 Orchestrator 实现
- 规定持久化文件布局，支持流式写入、按需 lazy load、崩溃安全
- 锁定 5 种 Gate 类型与 5 级 Review Severity
- 提供 3 个内置模板的数据定义与首次注入机制

**Non-Goals:**

- 不定义 Orchestrator 行为与 Tool 集合（归 `pipeline-orchestrator-architecture`）
- 不定义 UI 渲染规则（归 `pipeline-run-detail-view` 等）
- 不支持用户自定义 Gate/Stage 类型（V2+）
- 不做跨项目模板共享、不做模板版本历史（V2+）

## Decisions

### Decision 1: Run 创建时深拷贝 templateSnapshot

**选择：** Run 记录内嵌完整 `templateSnapshot`，与源模板完全解耦。

**理由：**

- 模板删除/修改不影响历史 Run 的可读性
- 历史 Run 可完整回放 stage 配置（prompt、gate、integration）
- Orchestrator 只读 Run 自己的 snapshot，无需二次查询模板库

**替代方案：** 用 `templateId + versionHash` 引用 + 模板库做版本管理。否决原因：MVP 阶段不值得引入版本化存储的复杂度。

### Decision 2: StageEvent 分 stage 存储为 JSONL

**选择：** 每个 stage 独立一份 `events.jsonl`，按行追加。

**路径：** `data/pipelines/runs/<runId>/stages/<stageId>/events.jsonl`

**理由：**

- **append-only**：subagent 流式输出只需 `fs.appendFile`，无需重写
- **崩溃安全**：任意时刻崩溃，已写入的行依然合法 JSON
- **按需 lazy load**：详情页切换到某 stage 时才读取；切换前不占内存
- **run.json 轻量**：只存状态摘要与 event count / tokens / 时间戳

**替代方案：** 全部塞 `run.json`。否决原因：run 列表需要频繁读 run.json，事件全量化会显著拖慢。

### Decision 3: Gate 类型用判别联合（5 种预设）

```ts
type GateConfig =
  | { kind: "auto"; type: "test-pass-rate"; threshold: number }
  | { kind: "auto"; type: "coverage"; threshold: number }
  | { kind: "auto"; type: "no-critical-issue"; maxAllowedSeverity: ReviewSeverity }
  | { kind: "auto"; type: "build-success" }
  | { kind: "manual"; type: "approval"; prompt?: string };
```

**理由：**

- 类型系统强约束，避免 `params: Record<string, unknown>` 的运行时错误
- 每种 Gate 的 evaluate 逻辑各自独立，易测
- 移除原先的 `custom-script`，MVP 阶段不允许用户写脚本

### Decision 4: Review Severity 5 级 + 模板阈值

5 级：`blocker` > `critical` > `major` > `minor` > `info`

模板通过 `no-critical-issue` Gate 的 `maxAllowedSeverity` 字段配置：严重度高于该值的任一问题触发 Gate 失败。Orchestrator 读取 Gate 配置后，遍历 review-comment 事件做判定。

### Decision 5: Run 状态新增 waiting-approval / waiting-clarification

- `waiting-approval`：某个 stage 的 `manual-approval` Gate 在等用户点按钮
- `waiting-clarification`：Orchestrator 主动调用 `request_user_clarification` tool，等用户回答

两种"等待"合并为 Sidebar 的"🟡 需要人工介入"视觉状态，但底层区分——前者是模板预设的 Gate，后者是运行时 LLM 决策。

### Decision 6: 内置模板用代码常量 + 首次注入

**路径：** `shared/pipeline/builtin-templates.ts` 导出 3 个 `PipelineTemplate` 常量。

**注入时机：** 项目首次打开 Pipeline 页时，若 `data/pipelines/templates/` 目录缺失内置模板文件，主进程写入三份 `builtin-<id>.json`。

**升级策略：** 内置模板带 `builtinVersion` 字段，FylloCode 升级后若检测到版本号变更，覆盖 `builtin-*.json`（用户的 custom 复制品不受影响）。

### Decision 7: 文件原子写入

Template / Run 的 `*.json` 写入使用 `write temp + rename`（tmp 文件 + `fs.rename` 原子替换）。`events.jsonl` 用 append 即可（每行独立，部分写入不损坏整体）。

## Risks / Trade-offs

- **[风险] JSONL 行跨写入边界损坏** → 缓解：每行写入前 buffer 整行 + `\n` 再一次性 `appendFile`；崩溃时最多丢最后一行
- **[风险] templateSnapshot 导致存储膨胀** → 缓解：模板本身很小（KB 级），且 Run 本就需要存完整 stage 列表，增量可忽略
- **[风险] 内置模板版本升级覆盖用户改动** → 缓解：只覆盖 `source='builtin'` 的文件；用户改动模板必须先复制为 custom
- **[Trade-off] BREAKING 类型变更** → 项目处于 MVP 阶段、Pipeline 功能尚未真正落地，类型重构成本可控；已有前端 store 会被同步调整

## Migration Plan

1. 升级 `shared/types/pipeline.ts`（新旧类型冲突处直接 BREAKING）
2. 清理 `data/pipelines/` 目录（或加版本标记，低版本数据直接忽略）
3. 主进程 pipeline IPC 改用新类型；前端 store 同步
4. 首次启动注入 3 个内置模板

**回滚策略：** 数据目录可直接删除重建；代码层走 git revert。MVP 前期无真实用户数据。

## Open Questions

- 内置模板的 `promptTemplate` 具体文案由谁定？**建议：** 本 change 提供骨架文案，`pipeline-orchestrator-architecture` 定稿
- 是否需要 Run 的全局索引文件（`runs/index.json`）加速列表？**建议：** 先不做，目录枚举 + 懒读 run.json 即可；性能不够再加
