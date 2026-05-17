## ADDED Requirements

### Requirement: 云效任务适配层支持按单条工作项按需读取详情

系统 SHALL 在主进程 `electron/main/services/task/adapters/yunxiao-task-adapter.ts` 中提供单条云效任务详情读取能力，用于任务详情弹窗在打开时按需获取完整描述。该能力 SHALL 接收任务命名空间 ID `yunxiao:<spaceId>:<workitemId>` 与当前 FylloCode `projectId`，并 SHALL 调用云效 `getworkitem` 接口读取工作项详情，而 SHALL NOT 通过重新执行 `list(projectId)` 后在结果中全量扫描来补详情。

#### Scenario: 通过命名空间任务 ID 读取详情

- **WHEN** 系统收到 `taskId = "yunxiao:space-1:workitem-102"` 且 `projectId = "project-1"` 的详情读取请求
- **THEN** 适配层解析出 `spaceId = "space-1"` 与 `workitemId = "workitem-102"`
- **AND** 适配层调用云效 `getworkitem` 接口读取该工作项详情

#### Scenario: 非法命名空间任务 ID 不走全量扫描

- **WHEN** 系统收到不符合 `yunxiao:<spaceId>:<workitemId>` 格式的 taskId
- **THEN** 适配层不调用 `list(projectId)` 做全量扫描补救
- **AND** 适配层返回空结果或 task-not-found 语义，由上层按 task 详情读取失败处理

### Requirement: 云效详情读取使用固定 getworkitem API 与已持久化组织信息

系统 SHALL 在 `electron/main/domain/integration/yunxiao/projex/index.ts` 中新增 `getWorkitem` 方法，使用固定请求语义 `GET /oapi/v1/projex/organizations/{organizationId}/workitems/{id}`。其中 `organizationId` SHALL 通过已持久化的 `getYunxiaoOrganizationId()` 读取，工作项 `id` SHALL 使用从命名空间 taskId 中解析出的 `workitemId`。实现 SHALL 复用现有 `YunxiaoClient` 和 token 获取方式，而 SHALL NOT 在 renderer 传入组织 ID、token 或其他云效鉴权参数。

#### Scenario: 使用已保存 organizationId 调用详情接口

- **WHEN** 适配层开始读取云效任务详情
- **THEN** 系统通过 `getYunxiaoOrganizationId()` 读取 organizationId
- **AND** 系统通过现有云效 client 发起 `GET /oapi/v1/projex/organizations/{organizationId}/workitems/{workitemId}` 请求

### Requirement: 云效详情映射回统一 TaskItem 并原样保留 description

云效任务详情读取成功后，系统 SHALL 将返回的工作项映射回统一 `TaskItem`，而不是把原始 `Workitem` 透传给 renderer。映射结果 SHALL 继续使用任务列表阶段的统一规则：`id` 为 `yunxiao:<spaceId>:<workitemId>`，`projectId` 为当前 FylloCode 项目 ID，`source` 为 `yunxiao`，`status` 为 `open`，`sourceMeta.key` 使用 `serialNumber`，`sourceMeta.issueType` 使用固定中文类型枚举，`labels` 继续按项目名称、类型、状态三项构造。`description` SHALL 使用详情接口返回的 `description ?? ""`，并 SHALL NOT 在主进程内依据 `formatType` 执行 Markdown / RichText 转换。

#### Scenario: 详情成功后返回补齐 description 的 TaskItem

- **WHEN** 云效详情接口返回一条工作项，且其 `description` 为 `"第一行\n第二行"`
- **THEN** 适配层返回的 `TaskItem.description` 等于 `"第一行\n第二行"`
- **AND** 其他映射字段继续遵循任务列表阶段的云效映射规则

#### Scenario: formatType 不影响 description 原样保留

- **WHEN** 云效详情接口返回 `formatType = "MARKDOWN"` 或 `formatType = "RICHTEXT"`
- **THEN** 适配层仍然把原始 `description` 字符串写入 `TaskItem.description`
- **AND** 适配层不在主进程执行格式转换
