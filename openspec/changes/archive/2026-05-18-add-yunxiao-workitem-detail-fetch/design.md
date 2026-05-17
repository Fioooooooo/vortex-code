## Context

当前任务详情弹窗 `frontend/src/components/task/TaskDetailModal.vue` 只消费父层传入的 `task: TaskItem | null`，并直接渲染 `task.description`。本地任务的描述来自本地存储，因此可以完整展示；云效任务的描述来自 `electron/main/services/task/adapters/yunxiao-task-adapter.ts` 内部的 `searchWorkitems()` 聚合结果，而用户已确认云效任务列表接口没有稳定返回任务描述，因此点击云效任务详情时无法满足 `openspec/specs/task-panel/spec.md` 中“完整展示描述全文”的 requirement。

项目已经具备可复用基础：

- 统一云效 HTTP client：`electron/main/domain/integration/yunxiao/client.ts`
- 云效 Projex domain 封装：`electron/main/domain/integration/yunxiao/projex/index.ts`
- 任务来源分发：`electron/main/services/task/task-aggregator.ts`
- task IPC、preload、renderer API 与 task store 全链路
- 任务详情弹窗、任务页和相关单测

因此本次设计应优先沿用现有 task 域分层，新增一个“单条任务详情读取”的细粒度链路，而不是在 renderer 直接请求云效 API，也不是在列表阶段预取所有详情。

## Goals / Non-Goals

**Goals:**

- 为 task 领域新增单条任务详情读取能力，支持云效任务按需拉取详情。
- 在点击云效任务详情弹窗时触发详情读取，而不是在 `task:list` 阶段预取。
- 详情读取成功后，只要求把 `description` 回填到弹窗展示中；基础字段继续兼容列表已有数据。
- 明确失败回退：弹窗保持可见、描述区显示失败占位、不影响列表页。
- 让后续实现 agent 可以仅依据本 change artifacts 完成实现，不依赖当前对话上下文。

**Non-Goals:**

- 不在本期区分 `MARKDOWN` / `RICHTEXT`，不使用 `MarkStream`、不做 HTML/RichText 转换。
- 不在本期新增云效任务编辑、评论、状态更新、指派等写操作。
- 不在 `task:list` 阶段批量预取云效详情。
- 不要求详情接口成功后同步刷新卡片列表中的标题、标签、状态等非描述字段。
- 不新增新的 IPC 错误码；如需错误响应，优先复用现有 task / yunxiao 错误体系。

## Decisions

### Decision 1: 新增 task 域单条详情读取 channel，而不是复用 `task:list`

**Decision**

- 在 `shared/types/channels.ts` 中为 task 域新增 `TaskChannels.get = "task:get"`。
- 在 `shared/schemas/ipc/task.ts` 中新增 `getTaskInputSchema`，入参固定为：
  - `projectId: string`
  - `taskId: string`
- 在 `electron/main/ipc/task.ts` 中新增 `ipcMain.handle(TaskChannels.get, ...)`。
- Renderer 通过 `window.api.task.getTask(projectId, taskId)` 调用，而不是重载 `listTasks()` 或在 `updateTask()` 上附带查询语义。

**Rationale**

- 详情读取是独立的请求-响应行为，语义上应与列表读取、创建、更新、删除分离。
- 单独 channel 能让测试、失败处理与 preload 类型声明更清晰，也符合现有 `domain:action` 命名规范。

**Alternatives considered**

- 复用 `task:list`，在 source 为 `yunxiao` 时强行补全每条描述：被否决，因为会扩大列表加载成本，并改变列表阶段的性能特征。
- 让 renderer 直接调用 integration / yunxiao API：被否决，因为违反当前项目“renderer 只能经由 `frontend/src/api` → preload → main/ipc → service”的分层。

### Decision 2: task-aggregator 暴露 `getTask(projectId, taskId)`，按来源分发到 adapter

**Decision**

- 在 `electron/main/services/task/adapters/task-adapter.ts` 保持 `get(taskId, projectId): Promise<TaskItem | null>` 作为 adapter 统一接口。
- 在 `electron/main/services/task/task-aggregator.ts` 新增 `getTask(projectId: string, taskId: string): Promise<TaskItem | null>`。
- `getTask()` 的分发规则按 `taskId` 或已有来源确定：
  - `taskId` 以 `yunxiao:` 开头时，走 `yunxiaoTaskAdapter.get(taskId, projectId)`
  - `taskId` 以其他本地 ID 时，优先走 `localTaskAdapter.get(taskId, projectId)`
  - `github` 仍保留现状，如已有 adapter `get()` 实现则按现状处理；本次不扩展 GitHub 详情能力

**Rationale**

- 不让 IPC handler 直接判断来源并跨越 service 调 adapter，保持 `ipc -> service` 边界稳定。
- 详情读取和列表读取使用同一组 adapter，便于后续来源扩展复用。

### Decision 3: 云效详情通过 `getWorkitem` 读取，且严格解析命名空间 taskId

**Decision**

- 在 `electron/main/domain/integration/yunxiao/projex/index.ts` 中新增：
  - `export interface GetWorkitemParams { organizationId: string; id: string }`
  - `export async function getWorkitem(params: GetWorkitemParams): Promise<Workitem>`
- 该方法调用路径固定为：
  - `GET /oapi/v1/projex/organizations/{organizationId}/workitems/{id}`
- 在 `electron/main/services/task/adapters/yunxiao-task-adapter.ts` 中新增稳定解析函数，例如：
  - `parseYunxiaoTaskId(taskId: string): { spaceId: string; workitemId: string } | null`
- 解析规则必须固定匹配 `yunxiao:<spaceId>:<workitemId>`，不得通过 `split(":")` 后忽略长度校验。
- 若 taskId 不是该格式，adapter `get()` 直接返回 `null` 或抛出 task-not-found 语义，由上层统一处理；实现时不得默默 fallback 成 `list(projectId)` 后全量扫描。

**Rationale**

- 列表任务 ID 已被 `yunxiao-task-read-model` spec 固定为 `yunxiao:<spaceId>:<workitemId>`，详情读取必须沿用同一标识规则。
- `getworkitem` 只需要 `organizationId + workitemId`，但保留 `spaceId` 在解析结果中可以用于二次映射、回构 `TaskItem.id` 与与列表数据对齐。

### Decision 4: 云效详情映射沿用列表映射规则，只要求 description 原样回填

**Decision**

- `yunxiaoTaskAdapter.get(taskId, projectId)` 读取云效详情后，仍返回统一 `TaskItem`。
- 映射规则尽量复用列表阶段已有 `mapToTaskItem()`：
  - `id` 仍为 `yunxiao:<spaceId>:<workitemId>`
  - `projectId` 为当前 FylloCode 项目 ID
  - `source` 固定 `"yunxiao"`
  - `status` 固定 `"open"`
  - `sourceMeta.key` 取 `serialNumber`
  - `sourceMeta.url` 保持当前列表阶段的规则，不在本 change 中单独修改 URL 策略
  - `labels` 仍按 `space.name` / 中文类型枚举 / `status.displayName`
- 本期唯一强要求是：
  - `TaskItem.description` 使用 `getworkitem` 返回的 `description ?? ""`
  - 不对 `formatType` 做分支，不转换 Markdown/HTML/RichText，原样回显字符串

**Rationale**

- 让详情返回值仍然是 `TaskItem`，可以最大化复用现有 `TaskDetailModal` 输入类型与页面状态。
- 只把“描述补齐”设为硬目标，避免本期扩散成“详情返回要刷新所有字段”的大改。

### Decision 5: 云效详情弹窗立即打开，描述区域独立建模 loading / error

**Decision**

- 点击云效任务卡片主体区域时，`frontend/src/pages/task.vue` 仍然立即设置：
  - `activeDetailTask = 列表任务`
  - `showDetailModal = true`
- 然后异步调用 store 中新增的详情读取 action。
- `frontend/src/stores/task.ts` 需要新增独立于列表加载的详情状态，建议至少包含：
  - `detailLoadingTaskId: string | null`
  - `detailErrorTaskId: string | null`
- `TaskDetailModal.vue` 增加与详情状态对应的 props，至少包含：
  - `detailLoading?: boolean`
  - `detailError?: string | null`
- 查看模式中描述区的优先级固定为：
  1. 若 `detailLoading === true`，显示“正在加载详情”或等价加载态
  2. 若 `detailError` 有值，显示“详情加载失败”
  3. 否则显示 `task.description`；为空时仍显示“暂无描述”

**Rationale**

- 用户已确认失败时弹窗仍需打开并展示基础信息，因此详情状态必须与弹窗打开状态解耦。
- 若继续复用 `taskStore.error` 作为全局列表错误，会把详情失败错误污染到整个页面，不符合这次范围。

**Alternatives considered**

- 点击卡片后先等待详情成功再打开弹窗：被否决，因为失败时会让“点击无响应”，且破坏既有详情弹窗交互。
- 继续使用 `taskStore.error`：被否决，因为它当前承担列表级错误，不适合承载单条详情失败。

### Decision 6: 详情回填仅覆盖当前打开任务，不要求同步刷新列表数组

**Decision**

- `frontend/src/stores/task.ts` 新增如 `loadTaskDetail(taskId)` 的 action，成功后返回 `TaskItem`。
- `frontend/src/pages/task.vue` 在详情成功后只更新 `activeDetailTask`，不强制调用 `upsertTask()` 覆盖 `tasks[]` 中对应项。
- 如实现方认为覆盖列表项几乎无成本，也只能做“等价附加”，不能改变本 change 的验收基线；验收仍以“弹窗显示正确描述”为准。

**Rationale**

- 本期核心是详情弹窗 correctness，不是列表数据一致性重构。
- 避免别的 agent 因“是否需要同步刷新列表”产生实现岔路。

## Risks / Trade-offs

- `[新增 task:get channel]` → 需要同时改 shared schema、preload、renderer API、类型声明，多文件联动。Mitigation：在 `tasks.md` 中按文件顺序拆开，逐步落地并逐层测试。
- `[云效详情失败状态与列表错误混淆]` → 如果实现方偷懒复用 `taskStore.error`，会导致页面整体报错。Mitigation：在 spec 和 tasks 中明确要求详情状态单独建模。
- `[taskId 解析实现不严格]` → 可能错误匹配本地任务或在格式不合法时触发异常。Mitigation：要求新增专门的 parser 及其单测，覆盖非法输入。
- `[description 原样回显富文本噪音]` → 云效返回若包含富文本标记，弹窗会按纯文本显示。Mitigation：这是用户明确接受的本期范围，后续如需渲染策略再独立提 change。
- `[详情成功后不更新列表]` → 列表卡片摘要可能仍为空，而弹窗已有完整描述。Mitigation：该差异是有意接受的范围控制，不作为本期 bug。
