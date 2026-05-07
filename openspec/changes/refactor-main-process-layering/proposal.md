## Why

Electron 主进程（`electron/main/`，共 ~4.9k 行 TS）在快速交付 chat / proposal-apply / workflow / integration 多个功能后，累积出大量结构性问题，已严重影响可维护性与下一步 feature 推进：

- **层次不清**：`ipc/` 目录承担了大量业务编排（如 `proposal-apply.ts` 单文件 585 行，在 handler 内部直接编排 `AcpSession`、`MessageChannelMain`、run meta 持久化），`services/` 形同虚设，`chat-agent/` / `acp/` / `integrations/` / `workflows/` 各行其是，没有统一的"应用服务 / 领域 / 基础设施"划分。
- **IPC handler 无标准**：错误构造样板在 `chat.ts`、`proposal.ts`、`proposal-apply.ts`、`workflow.ts`、`integration.ts` 中复制了 4 份；`wrapHandler` 使用不彻底（流式 handler 各自手写 try/catch）；handler 入参无统一校验。
- **流式 MessagePort 协议被三处重复实现**：`chat.ts` `streamMessage`、`proposal-apply.ts` `stageStream`、`proposal-apply.ts` `archive` 各自手写 port 握手 / portClosed 守卫 / chunk-done-error 封装 / SessionEvent 映射，且实现已漂移（`toChunkData` 少处理 `session_info_update`）。
- **生命周期治理缺失**：三处 module-level `Map` 记录活跃会话（`activeSessions` / `activeApplySessions` / `activeArchiveSessions`），键空间互不兼容；`acp-process-pool` 对子进程退出无上限地无条件重启；`app.on("before-quit")` 没有监听；子进程 `stderr: "inherit"` 导致 prod 环境诊断信息丢失。
- **路径 / ID / 默认值散落**：`resolveProjectPath` / `resolveChangeDir` 各有多份；`"claude-acp"` 默认 agentId、`"run-${Date.now()}"` / `"session-${Date.now()}"` ID 生成、`join + encodeProjectPath` 路径拼装遍布 service 与 handler 层，无单点。
- **僵尸代码**：`electron/main/cli/claude/`（302 行）已被 ACP 方案取代，仅被自身引用。
- **测试真空**：主进程 0 单元测试，handler 直接依赖 `ipcMain` / `fs` / `spawn` / `app`，无依赖注入，无从测试。

本次重构建立"入口 → IPC 适配器 → 应用服务 → 领域模块 → 基础设施"四层架构与配套横切规范，把当前散乱的代码归位到明确的分层中，并以"规范 + kit + 注册中心"三位一体的方式消除重复。这是一次**不改变任何用户可见行为**的内部重构，但会重写几乎所有主进程模块的物理位置与边界。

## What Changes

### 分层与目录重组（行为不变）

- 新建 `electron/main/bootstrap/`：承接 `index.ts` 的窗口创建与应用生命周期；引入 `lifecycle.ts` 统一管理 disposable 注册与 `before-quit` 顺序释放。
- 新建 `electron/main/domain/`：承接与 Electron / IPC 无关的纯逻辑和领域契约（`chat` 的 message assembler、`acp` 的 detector / registry / installer、`proposal` 的 openspec 读写、`integration/yunxiao` 的 OpenAPI client）。
- 重塑 `electron/main/services/`：成为应用服务层，覆盖 `chat` / `proposal` / `workflow` / `project` / `integration` / `acp-agent` 六个领域，负责跨领域编排、持久化协调、事件广播。
- 新建 `electron/main/infra/`：统一基础设施适配器（`storage`、`process`、`paths`、`logger`、`net`、`ids`）。
- 精简 `electron/main/ipc/`：handler 只做参数校验 → 调 service → 归一化响应三件事，零业务逻辑。
- 删除 `electron/main/cli/claude/`（僵尸代码，已被 ACP 取代）。

### IPC 基础设施标准化（行为不变）

- 新增 `ipc/_kit/wrap-handler.ts`、`ipc/_kit/stream-channel.ts`、`ipc/_kit/errors.ts`、`ipc/_kit/schema.ts`，作为 IPC 层唯一允许使用的基础设施。
- 所有 request / response handler 强制使用 `wrapHandler`；所有流式 handler 强制使用 `makeStreamChannel`，禁止手写 `MessageChannelMain` / `portClosed` / sendChunk-sendDone-sendError 三件套。
- handler 入参强制使用 zod schema 校验，schema 位于 `shared/schemas/ipc/<domain>.ts`。
- 错误码收敛到 `shared/constants/error-codes.ts`，handler 返回的 `code` 受联合类型约束；`YunxiaoApiError` 也在 service 边界归一化成标准错误格式。

### 会话与子进程治理（行为不变）

- 新增 `services/chat/session-registry.ts` 统一收口 `AcpSession` 的注册 / 注销 / 按 owner 批量取消；三处 module-level `Map` 合并为同一个 registry。
- `acp-process-pool` 加入 exponential backoff + 重启上限，超限后广播 `agent-unavailable` 事件；`stderr` 从 `"inherit"` 改为 `"pipe"`，接管后转发到 logger。
- 所有长期运行资源（子进程、session、文件监听、定时器）通过 `bootstrap/lifecycle.ts` 注册 disposable，`before-quit` 按逆序释放。

### 路径 / ID / 默认值 / 日志标签单点化（行为不变）

- `infra/storage/project-paths.ts` 提供 `sessionsDir(projectPath)`、`applyRunsDir(projectPath)`、`workflowsDir(projectPath)` 等，禁止在 service / ipc 层直接 `join + encodeProjectPath`。
- `infra/ids.ts` 提供 `newSessionId()` / `newRunId()`，禁止直接使用 `Date.now()` 生成 ID。
- `shared/constants/agents.ts` 集中默认 agentId。
- logger 新增 `createLogger("chat.session")` tag 工厂，替代手写 `[chat]` / `[acp-pool]` 前缀。

### 不做的事情

- 不引入 DI 容器、不引入 Observable、不迁移到其他测试框架，保持最小依赖面。
- 不改动渲染进程；preload 层除 `console.error` → logger 外不做结构变更。
- 不改动 IPC channel 名称、preload API 形状、`IpcResponse` 结构、持久化文件格式，以保证渲染端和已持久化数据零感知。
- 不合并或拆分现有 IPC 域（`chat` / `project` / `proposal` / `workflow` / `integration` / `acp` / `settings` / `window` / `net`）。

## Capabilities

### New Capabilities

- `main-process-layering`: 定义主进程四层架构（bootstrap / ipc / services / domain / infra）的物理分层、依赖方向、模块职责、生命周期治理、会话注册、子进程池策略、路径 / ID / 默认值 / logger tag 单点化规范。

### Modified Capabilities

- `ipc-protocol`: 错误码从"格式约束"升级为"常量枚举"，集中在 `shared/constants/error-codes.ts`；新增"handler 入参 zod 校验"要求。
- `ipc-request-response`: 新增"handler 必须通过 `wrapHandler` 包装"、"handler 零业务逻辑"两条要求。
- `ipc-streaming`: 新增"流式 handler 必须通过 `makeStreamChannel` 实现"，禁止手写 MessagePort 协议。

## Impact

**代码影响**（几乎全部主进程文件）：

- 移动：`chat-agent/` / `acp/` / `integrations/yunxiao/` / `workflows/` / `services/project-store.ts` / `utils/paths.ts` / `utils/logger.ts` 全部迁移到新分层路径。
- 改写：`ipc/*.ts` 全部 handler（共 ~1880 行）按新 kit 重写，业务逻辑下沉到 `services/*`。
- 删除：`electron/main/cli/claude/` 整个目录（302 行）。
- 新增：`bootstrap/lifecycle.ts`、`services/chat/session-registry.ts`、`ipc/_kit/*`、`infra/storage/project-paths.ts`、`infra/ids.ts`、`shared/constants/{agents,error-codes}.ts`、`shared/schemas/ipc/*.ts`。

**外部契约影响**：

- IPC channel 名称、preload API 形状、`IpcResponse` 结构、流式 chunk 协议保持完全不变，渲染进程不需任何修改。
- 错误码字符串值保持兼容（继续用 `PROJECT_NOT_FOUND` 等已有 code），仅新增类型约束。
- 持久化文件路径与 schema 保持不变（`data/projects/{id}/sessions|apply-runs|workflows/...`、`data/acp/...`、`data/integrations/...`）。

**依赖**：

- 新增 `zod` 作为生产依赖（handler 入参校验）。
- 不新增其他依赖。

**风险**：

- 重构面大，必须分 Phase 推进，每个 Phase 独立可验证。
- ACP 子进程治理改动（重启策略、stderr 接管）属于运行时行为调整，需要人工冒烟验证。
- 活跃会话 Map 合并到 registry 后，`before-quit` 时的取消链路需要观察是否能干净退出。
