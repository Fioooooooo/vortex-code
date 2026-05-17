## 1. OpenSpec 与行为边界固化

- [x] 1.1 核对本 change artifacts 与既有 spec 的关系：确认本次只修改 `openspec/specs/task-panel/spec.md` 与 `openspec/specs/yunxiao-task-read-model/spec.md` 的行为语义，不额外扩展到 markdown/richtext 渲染、列表预取详情、云效写操作或 GitHub 详情能力。
- [x] 1.2 在实施前通读以下现有文件，避免实现偏移：
  - `openspec/specs/task-panel/spec.md`
  - `openspec/specs/yunxiao-task-read-model/spec.md`
  - `guidelines/IPC.md`
  - `guidelines/RendererProcess.md`
  - `guidelines/integrations/yunxiao/get_workitem.md`
- [x] 1.3 实施过程中若发现需要新增错误码、修改共享类型对外语义或改变 `taskId` 命名空间格式，必须先回到 OpenSpec 更新 change，不得在实现阶段自行扩展范围。

## 2. 共享 channel、schema 与类型契约

- [x] 2.1 修改 `shared/types/channels.ts`：在 `TaskChannels` 中新增 `get: "task:get"`，保持其余已有字段 `list/create/update/delete` 不变。
- [x] 2.2 修改 `shared/schemas/ipc/task.ts`：新增 `getTaskInputSchema = z.object({ projectId: z.string().min(1), taskId: z.string().min(1) })`；不要复用 `deleteTaskInputSchema`，以免语义不清。
- [x] 2.3 检查 `shared/types/task.ts`：
  - 保持 `TaskItem` 结构不做破坏性修改
  - 如需给 renderer 传递详情加载态，优先放在 store / 组件 props 中，不要把 loading/error 状态塞进 `TaskItem`
  - `YunxiaoTaskMeta` 仅在必要时补最小字段；本期不要为了 `formatType` 新增 renderer 依赖字段
- [x] 2.4 如果实现方在详情映射中需要给 `electron/main/domain/integration/yunxiao/projex/types.ts` 新增 `GetWorkitemParams` 或补 `Workitem.categoryId` 等字段，必须放在 domain 类型文件中完成，禁止在 service 中通过 `as any` 绕过类型。

## 3. 云效 domain：新增 getWorkitem API 封装

- [x] 3.1 修改 `electron/main/domain/integration/yunxiao/projex/types.ts`：
  - 新增 `GetWorkitemParams`，字段精确为：
    - `organizationId: string`
    - `id: string`
  - 确保 `Workitem` 类型至少覆盖详情映射会读取的字段：
    - `id`
    - `subject`
    - `description?`
    - `formatType?`
    - `serialNumber`
    - `space.id`
    - `space.name`
    - `status.id`
    - `status.displayName`
    - `assignedTo?.id`
    - `assignedTo?.name`
    - `gmtCreate`
    - `gmtModified?`
    - `updateStatusAt?`
    - `categoryId?`
- [x] 3.2 修改 `electron/main/domain/integration/yunxiao/projex/index.ts`：
  - 导出 `GetWorkitemParams`
  - 新增 `export async function getWorkitem(params: GetWorkitemParams): Promise<Workitem>`
  - 该函数内部步骤必须固定为：
    1. `const token = getYunxiaoToken()`
    2. 解构 `organizationId` 与 `id`
    3. 调用 `client.get<Workitem>(\`/oapi/v1/projex/organizations/${organizationId}/workitems/${id}\`, token)`
- [x] 3.3 不要在 `getWorkitem()` 中加入 task 领域映射、`TaskItem` 构造、错误吞掉或 renderer 相关逻辑；domain 层只负责云效 API 封装。
- [x] 3.4 如 `electron/main/domain/integration/yunxiao/README.md` 有 API 列表说明，补充“支持 getWorkitem”一行，避免后续 agent 误判能力缺失。

## 4. 主进程 task adapter：实现云效单条详情读取

- [x] 4.1 修改 `electron/main/services/task/adapters/yunxiao-task-adapter.ts` 的 import：
  - 从 `@main/domain/integration/yunxiao/projex` 额外引入 `getWorkitem`
  - 保持现有 `searchWorkitems` 路径不变
- [x] 4.2 在同文件新增专门的 taskId 解析函数，例如 `parseYunxiaoTaskId(taskId: string)`，要求：
  - 只接受 `yunxiao:<spaceId>:<workitemId>` 精确三段格式
  - `spaceId` 与 `workitemId` 都必须是非空字符串
  - 非法格式返回 `null`
  - 不得在 parser 内抛出未捕获异常
- [x] 4.3 不要在 `get(taskId, projectId)` 中通过 `await this.list(projectId)` 后查找匹配项来补详情；必须直接走 `getWorkitem`。
- [x] 4.4 改造 `mapToTaskItem()` 或补一个可复用映射函数，使其既能服务列表查询，也能服务详情查询。要求：
  - 参数中必须显式传入 `projectId`
  - 参数中必须显式传入 `spaceId`
  - 类型中文映射仍然只允许 `"需求" | "任务" | "缺陷"`
- [x] 4.5 若详情接口返回的 `Workitem` 中无法可靠推断类别，优先使用以下顺序补类型：
  1. 若 `categoryId` 是 `Req` / `Task` / `Bug`，直接使用
  2. 否则从 `taskId` 对应的已有列表任务或 domain 已知字段中推断
  3. 若仍无法确定，必须在实现说明中显式标出，并在代码中选择一个可审查的、单点封装的回退策略；禁止把这个判断散落在 renderer
- [x] 4.6 实现 `yunxiaoTaskAdapter.get(taskId, projectId)` 的固定步骤：
  1. 用 parser 解析 `spaceId` 与 `workitemId`
  2. 读取 `organizationId = getYunxiaoOrganizationId()`
  3. 调用 `getWorkitem({ organizationId, id: workitemId })`
  4. 将结果映射为 `TaskItem`
  5. 返回映射结果
- [x] 4.7 `TaskItem.description` 必须写入 `workitem.description ?? ""`，不区分 `formatType`
- [x] 4.8 `TaskItem.id` 必须仍为 `yunxiao:<spaceId>:<workitemId>`，不要改成单独的 workitemId
- [x] 4.9 `TaskItem.sourceMeta.key` 必须使用 `workitem.serialNumber`
- [x] 4.10 `TaskItem.labels` 继续沿用三项顺序：`space.name`、中文类型枚举、`status.displayName`
- [x] 4.11 `TaskItem.updatedAt` 继续沿用列表阶段回退规则：`gmtModified` → `updateStatusAt` → `createdAt`
- [x] 4.12 云效详情请求失败时，adapter 可以把 domain 错误继续向上抛给 task service / IPC；不要在 adapter 内转换成 renderer 文案“详情加载失败”，该文案属于 UI 层。

## 5. task service / aggregator / IPC：打通 task:get 请求链

- [x] 5.1 修改 `electron/main/services/task/task-aggregator.ts`：
  - 新增 `export async function getTask(projectId: string, taskId: string): Promise<TaskItem | null>`
  - 分发规则至少覆盖：
    - `taskId.startsWith("yunxiao:")` → `yunxiaoTaskAdapter.get(taskId, projectId)`
    - 其他 taskId → `localTaskAdapter.get(taskId, projectId)`；若当前代码库已有 github 判定逻辑，可保持现状，但本期不扩展 GitHub 详情行为
- [x] 5.2 检查 `electron/main/services/task/adapters/local-task-adapter.ts` 是否已实现 `get()`；若未实现，补足使 `task:get` 对本地任务也可工作，避免页面在不同来源下出现分支型接口。
- [x] 5.3 修改 `electron/main/ipc/task.ts`：
  - 从 `@shared/schemas/ipc/task` 引入 `getTaskInputSchema`
  - 从 `@main/services/task/task-aggregator` 引入 `getTask`
  - 新增 `ipcMain.handle(TaskChannels.get, ...)`
  - handler 内固定步骤：
    1. `const { projectId, taskId } = validate(getTaskInputSchema, input)`
    2. `const task = await getTask(projectId, taskId)`
    3. 若 `task` 为空，返回 task-not-found 语义（推荐复用 `IpcErrorCodes.TASK_NOT_FOUND`）
    4. 否则返回 `task`
- [x] 5.4 不要在新的 `task:get` handler 中直接 import `fs`、`path`、`fetch` 或云效 client；所有业务逻辑必须留在 `services/task/*`
- [x] 5.5 若新增了 `task:get`，检查 `guidelines/IPC.md` 或实现说明中是否需要同步更新 channel 列表；如果项目要求文档跟随实现，请补齐。

## 6. preload / renderer API：暴露 getTask 能力

- [x] 6.1 修改 `electron/preload/api/task.ts`，新增：
  - `getTask(projectId: string, taskId: string): Promise<IpcResponse<TaskItem>>`
  - 内部实现必须是 `ipcRenderer.invoke(TaskChannels.get, { projectId, taskId })`
- [x] 6.2 修改 `electron/preload/index.d.ts`，确保 `AppApi.task` 的类型自动包含新增的 `getTask`
- [x] 6.3 修改 `frontend/src/api/task.ts`，新增薄封装：
  - `getTask(projectId: string, taskId: string): Promise<IpcResponse<TaskItem>>`
  - 只做 `window.api.task.getTask(projectId, taskId)` 转发，不加入业务逻辑

## 7. task store：新增详情加载状态与 action

- [x] 7.1 修改 `frontend/src/stores/task.ts`，新增与列表错误隔离的详情状态，至少包含：
  - `detailLoadingTaskId = ref<string | null>(null)`
  - `detailErrorTaskId = ref<string | null>(null)`
  - 如实现上需要附带 message，可额外加 `detailErrorMessage = ref<string | null>(null)`
- [x] 7.2 不要复用现有 `error` 字段承载详情失败；`error` 继续保留给列表加载、创建、更新、删除等现有全局 task 行为。
- [x] 7.3 新增 action，例如：
  - `async function loadTaskDetail(taskId: string): Promise<TaskItem>`
  - 固定步骤：
    1. 读取当前 `projectId`
    2. 设置 `detailLoadingTaskId = taskId`
    3. 清空上一条详情错误状态
    4. 调 `taskApi.getTask(projectId, taskId)`
    5. 成功时返回标准化后的 `TaskItem`
    6. 失败时仅设置详情错误状态并抛出错误
    7. `finally` 中清理 loading
- [x] 7.4 `loadTaskDetail()` 成功后不要强制调用 `upsertTask()` 覆盖列表；本期只要求把结果返回给页面层，用于更新当前打开的详情任务。
- [x] 7.5 增加一个便于页面消费的判定方法或 computed，例如：
  - `isDetailLoading(taskId: string | null): boolean`
  - 或在页面层直接比较 `detailLoadingTaskId === activeDetailTask?.id`
- [x] 7.6 项目切换时若详情弹窗已打开，页面层可以重新拉取或关闭弹窗，但本期最小要求是不要让旧项目的详情错误状态污染新项目；必要时在 `loadTasks()` 或项目切换逻辑中重置详情状态。

## 8. 任务页与详情弹窗：按需拉取并展示 description

- [x] 8.1 修改 `frontend/src/pages/task.vue`：
  - 保留现有 `activeDetailTask` 与 `showDetailModal`
  - 改造 `handleViewDetail(task: TaskItem)` 为 `async` 或在内部触发异步流程
- [x] 8.2 `handleViewDetail(task)` 的固定时序必须是：
  1. 先 `activeDetailTask.value = task`
  2. 再 `showDetailModal.value = true`
  3. 若 `task.source === "yunxiao"`，触发 `taskStore.loadTaskDetail(task.id)`
  4. 成功后仅更新 `activeDetailTask.value = 返回的详细 TaskItem`
  5. 失败时不关闭弹窗，不覆盖 `activeDetailTask` 为 `null`
- [x] 8.3 修改 `frontend/src/components/task/TaskDetailModal.vue` props，新增：
  - `detailLoading?: boolean`
  - `detailError?: string | null`
  - 保持现有 `error`（本地编辑保存错误）语义不混用；如有必要，可把原 prop 更名为更准确的 `saveError`，但若更名需同步修改调用点和测试，避免引入不必要歧义
- [x] 8.4 修改 `TaskDetailModal.vue` 查看模式中的描述区渲染优先级：
  - `detailLoading === true` → 显示加载态文案或 spinner + “正在加载详情”
  - `detailError` 非空 → 显示“详情加载失败”
  - 否则按既有逻辑显示 `task.description` 或 “暂无描述”
- [x] 8.5 详情加载态和失败态只作用于描述区域；不要隐藏标题、来源、状态、标签、创建时间。
- [x] 8.6 本期不要在 `TaskDetailModal.vue` 中引入 `MarkStream.vue` 或任何富文本渲染组件；描述仍以普通文本方式展示。
- [x] 8.7 修改 `frontend/src/pages/task.vue` 模板，向 `TaskDetailModal` 传入：
  - `:task="activeDetailTask"`
  - `:detail-loading="taskStore.detailLoadingTaskId === activeDetailTask?.id"`
  - `:detail-error="taskStore.detailErrorTaskId === activeDetailTask?.id ? '详情加载失败' : null"` 或等价 message prop
- [x] 8.8 详情关闭时（`showDetailModal` 变为 `false`）建议清理页面层与 store 的当前详情错误状态；如果不清理，必须保证下一次打开别的任务时不会错误继承上一条失败态。

## 9. 测试：主进程、IPC、store、页面、组件

- [x] 9.1 修改 `electron/main/__tests__/services/task/yunxiao-task-adapter.spec.ts`，新增或补充以下用例：
  - 合法 `yunxiao:<spaceId>:<workitemId>` taskId 会调用 `getWorkitem`
  - 非法 taskId 不会 fallback 到 `list(projectId)`
  - `description` 使用详情接口返回值原样映射
  - `formatType = "MARKDOWN"` / `"RICHTEXT"` 不影响 `description`
  - `updatedAt` 回退逻辑对详情同样成立
- [x] 9.2 修改 `electron/main/__tests__/services/task/task-aggregator.spec.ts`，补充：
  - `taskId` 以 `yunxiao:` 开头时走 `yunxiaoTaskAdapter.get`
  - 其他 taskId 走本地 adapter
- [x] 9.3 若仓库目前没有 `electron/main/__tests__/ipc/task.spec.ts`，新增该文件；至少覆盖：
  - `task:get` 使用 `getTaskInputSchema` 校验入参
  - 成功返回 `IpcResponse<TaskItem>`
  - task 不存在时返回 `TASK_NOT_FOUND`
- [x] 9.4 修改 `frontend/src/__tests__/stores/task.spec.ts`，补充：
  - `loadTaskDetail()` 成功时设置并清理 `detailLoadingTaskId`
  - 失败时不污染 `error`
  - 失败时设置详情错误状态
- [x] 9.5 修改 `frontend/src/__tests__/components/task-detail-modal.spec.ts`，补充：
  - `detailLoading` 时描述区显示加载态
  - `detailError` 时描述区显示“详情加载失败”
  - 两者都为空时仍按原逻辑显示描述或“暂无描述”
- [x] 9.6 修改 `frontend/src/__tests__/pages/task.spec.ts`，补充：
  - 点击云效任务卡片后先打开弹窗，再异步拉详情
  - 详情成功后把 `activeDetailTask` 更新为返回值
  - 详情失败时弹窗保持打开且不触发页面全局错误块
- [x] 9.7 若页面测试中 `TaskDetailModal` 当前被完全 stub 掉，至少新增能断言传参的 stub 或单独页面状态测试，确保实现 agent 不会遗漏 `detailLoading` / `detailError` props 传递。

## 10. 验证与交付说明

- [x] 10.1 运行与本 change 直接相关的测试集，至少包括：
  - `frontend/src/__tests__/components/task-detail-modal.spec.ts`
  - `frontend/src/__tests__/pages/task.spec.ts`
  - `frontend/src/__tests__/stores/task.spec.ts`
  - `electron/main/__tests__/services/task/yunxiao-task-adapter.spec.ts`
  - `electron/main/__tests__/services/task/task-aggregator.spec.ts`
  - `electron/main/__tests__/ipc/task.spec.ts`（如新增）
- [x] 10.2 运行 `pnpm typecheck`；如 task preload 或 `window.api` 类型有遗漏，这一步应能暴露。
- [x] 10.3 如条件允许，运行定向测试或 `pnpm test`；若环境限制无法运行，必须在实现说明中逐项列出未验证项。
- [x] 10.4 手动验收建议路径写入实现说明：
  - 进入 `/task`
  - 切到“云效”来源
  - 点击一条云效任务卡片主体区域
  - 观察弹窗立即打开
  - 观察描述区先出现加载态
  - 成功时出现真实描述；失败时出现“详情加载失败”
  - 关闭弹窗后列表与 tab 不受影响
