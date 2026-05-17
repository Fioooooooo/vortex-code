## Why

当前 `/task` 页的云效任务详情弹窗虽然已经被 `task-panel` capability 定义为应展示完整描述，但现有实现只使用任务列表聚合结果；而云效任务列表接口没有稳定返回详情描述，导致用户点击云效任务查看详情时看不到真实任务内容。这会让“任务看板查看详情并继续讨论”的链路在云效来源下失效。

本次 change 需要补齐一条精确且最小化的详情读取链路：在用户点击云效任务详情时，按需调用云效 `getworkitem` 接口读取单条工作项详情，把 `description` 原样回显到任务详情弹窗中，并在失败时保持弹窗可用且不阻断列表。

## What Changes

- 为云效任务增加“详情按需读取”能力：当用户在 `/task` 页点击云效任务卡片主体区域打开详情弹窗时，系统按需调用云效 `getworkitem` 接口读取该任务详情。
- 在 task 领域新增单条任务详情读取链路，覆盖 `shared/types/channels.ts`、`shared/schemas/ipc/task.ts`、`electron/main/ipc/task.ts`、`electron/preload/api/task.ts`、`electron/preload/index.d.ts`、`frontend/src/api/task.ts`、`frontend/src/stores/task.ts` 等 task IPC/API/store 路径。
- 扩展主进程云效 task adapter：从任务命名空间 ID `yunxiao:<spaceId>:<workitemId>` 解析云效工作项标识，调用 `electron/main/domain/integration/yunxiao/projex` 中新增的 `getWorkitem` 方法，并将返回结果映射回 `TaskItem`。
- 修改任务详情弹窗的云效任务行为：弹窗立即打开并展示列表已有的标题、状态、标签、来源等基础字段；描述区在详情读取成功后以原始字符串回显 `description`，不区分 `MARKDOWN` / `RICHTEXT`、不做格式转换。
- 明确详情读取失败时的回退：弹窗保持打开，基础信息继续使用列表数据，描述区域显示“详情加载失败”，不新增全局错误提示，不影响任务列表和 tab 切换。
- 保持任务列表加载链路不变：本次不在 `task:list` 阶段预取云效详情，不新增列表页批量详情请求。

## Capabilities

### New Capabilities

<!-- 无新增独立 capability，本次变更属于既有 capability 的补充与修正。 -->

### Modified Capabilities

- `task-panel`: 明确云效任务详情弹窗在打开时需要按需读取详情描述、加载期间和失败时的展示行为，以及描述内容“原样回显”的约束。
- `yunxiao-task-read-model`: 在现有“云效任务列表聚合”之外，补充“按单条工作项 ID 读取详情并映射回 `TaskItem`”的能力约束。

## Impact

- **共享协议与类型**
  - `shared/types/channels.ts`
  - `shared/schemas/ipc/task.ts`
  - `shared/types/task.ts`
- **主进程 task 领域**
  - `electron/main/ipc/task.ts`
  - `electron/main/services/task/task-aggregator.ts`
  - `electron/main/services/task/adapters/task-adapter.ts`
  - `electron/main/services/task/adapters/yunxiao-task-adapter.ts`
  - `electron/main/domain/integration/yunxiao/projex/index.ts`
  - `electron/main/domain/integration/yunxiao/projex/types.ts`
- **preload / renderer 调用链**
  - `electron/preload/api/task.ts`
  - `electron/preload/index.d.ts`
  - `frontend/src/api/task.ts`
  - `frontend/src/stores/task.ts`
  - `frontend/src/pages/task.vue`
  - `frontend/src/components/task/TaskDetailModal.vue`
- **测试**
  - `electron/main/__tests__/services/task/yunxiao-task-adapter.spec.ts`
  - `electron/main/__tests__/services/task/task-aggregator.spec.ts`
  - `electron/main/__tests__/ipc/task.spec.ts`（如当前不存在则新增）
  - `frontend/src/__tests__/stores/task.spec.ts`
  - `frontend/src/__tests__/components/task-detail-modal.spec.ts`
  - `frontend/src/__tests__/pages/task.spec.ts`
