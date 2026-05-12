## 1. 主进程：system-reminder 模块骨架

- [x] 1.1 新建目录 `electron/main/services/chat/system-reminder/` 并创建 `types.ts`，导出 `SystemReminderContext` 接口（`owner` 复用 `@main/services/chat/session-registry#SessionOwner`；若 `SessionOwner` 当前未 export，需改为 `export`；包含 `projectPath / cwd / fylloSessionId / agentId`，可选 `changeId / stageIndex / runId`）
- [x] 1.2 新建 `system-reminder/wrap.ts`，导出 `wrapAsSystemReminder(body: string): string`（以 `<system-reminder>\n{body}\n</system-reminder>` 包裹）。若 `body` 字面量已含 `<system-reminder>` 或 `</system-reminder>` 子串，SHALL 抛 `Error`。该 util 不被 providers 之外的模块导入
- [x] 1.3 新建 `system-reminder/agents.ts`（或等价位置），导出 `CLAUDE_CODE_AGENT_IDS: readonly string[]`，初始值锁定为 `[DEFAULT_ACP_AGENT_ID]`；文件头部注释需写明"未来新增兼容 agent 时需主动加入此列表"
- [x] 1.4 新建 `system-reminder/index.ts`，导出 `resolveSystemReminder(ctx: SystemReminderContext): Promise<TextUIPart | null>`（`TextUIPart` 从 `ai` 包 `import type`）。行为：若 `ctx.agentId` 不在 `CLAUDE_CODE_AGENT_IDS` 内以严格相等判定则返回 `null`；未知 `owner` 返回 `null`；否则委托给对应 provider，provider 返回 `null` 时本函数也返回 `null`，否则把 provider 返回的正文用 `wrapAsSystemReminder` 包裹，构造 `{ type: "text", text }` 返回
- [x] 1.5 新建 `system-reminder/providers/chat.ts`、`apply.ts`、`archive.ts`，实现"读对应模板 → 白名单变量插值（`{{changeId}}` / `{{stageIndex}}` / `{{runId}}` / `{{projectPath}}`，其他 `{{...}}` 保持字面量）→ 若任一白名单变量值含 `<` 或 `>` 则返回 `null` 并 `logger.warn`（至少含 owner、被拒字段名、`fylloSessionId`）→ 返回插值后的正文字符串（不 wrap，由 `index.ts` 统一包裹）"
- [x] 1.6 新建 `system-reminder/templates/chat.md`、`apply.md`、`archive.md` 模板文件。**v1 仅写占位骨架**（正文用户边测边定稿）：每个模板以 `<!-- TODO: v1 reminder body. Edit while testing. -->` 开头，再放一两段占位文案（可引用 `{{changeId}}` 等变量用于 apply/archive）。不要填入最终生产文案
- [x] 1.7 新增单测 `system-reminder/__tests__/resolve.spec.ts`：覆盖未知 owner → null、未知 agentId → null、`DEFAULT_ACP_AGENT_ID` 正常返回 `TextUIPart`、变量含尖括号 → null + warn、白名单变量被替换、非白名单占位符保留字面量、返回 text 首尾为 `<system-reminder>` / `</system-reminder>`
- [x] 1.8 新增 `wrap.ts` 单测：正常 body 包裹格式正确；body 含 `<system-reminder>` 或 `</system-reminder>` 时抛 `Error`

## 2. 主进程：user message 持久化原语

- [x] 2.1 在 `electron/main/infra/storage/` 新增 `prependReminderToLastUserMessage(filePath: string, reminderPart: TextUIPart): Promise<void>`（`TextUIPart` 从 `ai` 包 `import type`）：全量读 jsonl → 定位**最后一条** `role === "user"` 的 `UIMessage` → 在其 `parts` 数组位置 0 插入 `reminderPart` → 全量覆盖写回。文件不存在或无 user 消息时 SHALL 抛 `Error`（由调用方捕获，具体失败策略见 3.2）
- [x] 2.2 为该原语新增单测：空文件抛错、无 user 消息抛错、最后一条 user 的 `parts[0]` 正确插入、jsonl 中前序行（含 assistant、更早的 user）不受影响、与后续 append 顺序兼容、`parts` 顺序为 `[reminder, ...原 parts]`

## 3. 主进程：AcpSession 接入注入点

- [x] 3.1 在 `AcpSessionOpts` 增加字段：`owner: SessionOwner`（必填）、可选 `reminderContext: { changeId?: string; stageIndex?: number; runId?: string }`、可选 `onReminderInjected: (reminderPart: TextUIPart) => Promise<void>`（`TextUIPart` 从 `ai` 包 `import type`）
- [x] 3.2 在 `AcpSession.start` 内的 `if (!acpSessionId) { const res = await connection.newSession(...) }` 分支之后、`connection.prompt` 调用之前，加入注入逻辑：
  - 调用 `const reminderPart = await resolveSystemReminder({ owner: opts.owner, projectPath, cwd, fylloSessionId, agentId, ...(opts.reminderContext ?? {}) })`
  - 若 `reminderPart !== null` 且 `opts.onReminderInjected` 存在，用 `try { await opts.onReminderInjected(reminderPart); } catch (err) { logger.error("[acp-session] onReminderInjected failed", err); }`（不再上抛）
  - 把 `reminderPart` push 到 `connection.prompt` 的 `prompt` 数组首位；`resumeSession` 成功分支保持现状（不注入，prompt 为单一 user block）
- [x] 3.3 在 `AcpSession.start` 的 `catch { acpSessionId = undefined }` 分支旁补 TODO 注释（`// TODO(fallback-treatment): ...`），说明"resumeSession 失败降级的专项治理（历史消息回放、sessionId 迁移等）为独立后续工作"，并引用本 change 名与 tasks.md 的 8.1 条目
- [x] 3.4 `AcpSession` 新增/更新单测：真·首次 newSession 触发注入并调用钩子；resume 成功不调用 `resolveSystemReminder` 与钩子；resume 失败降级到 newSession 也触发注入；`onReminderInjected` 抛错后 `logger.error` 被调用、`connection.prompt` 参数仍含 reminder part 作首位；`resolveSystemReminder` 返回 null 时 `connection.prompt` 参数为单一 user block

## 4. 主进程：IPC handler 接入

- [x] 4.1 `electron/main/ipc/chat.ts` 在 `chat:stream:message` handler 内构造 `AcpSession` 时传入 `owner: "chat"` 与 `onReminderInjected`，钩子实现构造 `<sessionId>.messages.jsonl` 绝对路径（复用现有 `session-store` 中的路径解析 util 或直接构造）并调用 `prependReminderToLastUserMessage(path, reminderPart)`
- [x] 4.2 `electron/main/ipc/proposal-apply.ts` 的 `proposal:stageStream` handler 构造 `AcpSession` 时传入 `owner: "apply"`、`reminderContext: { changeId: form.changeId, stageIndex: form.stageIndex, runId: form.runId }`，以及指向 `apply-runs/<changeId>/stage-{stageIndex}.messages.jsonl` 的钩子（复用现有 apply-run 路径解析 util）
- [x] 4.3 `electron/main/ipc/proposal-apply.ts` 的 `proposal:archive` handler 构造 `AcpSession` 时传入 `owner: "archive"`、`reminderContext: { changeId, runId }`（若 handler 没有 runId 则传 `undefined`，provider 按缺省处理），以及指向 `apply-runs/<changeId>/archive.messages.jsonl` 的钩子
- [x] 4.4 验证所有钩子 **不通过 sink 推送** `user_message` chunk（即钩子只做磁盘写，不触碰 sink）

## 5. 主进程：集成验证

- [x] 5.1 新增/扩展 chat IPC 集成测试：首次 `chat:stream:message` 磁盘 user 消息 `parts[0]` 为 reminder part；renderer 收到的 `user_message`（此场景下由 renderer 自行 persist）与磁盘不一致不影响功能
- [x] 5.2 新增/扩展 proposal-apply 集成测试：首次 stage stream 后 `stage-{N}.messages.jsonl` 中 user 消息 `parts[0]` 为 reminder；resume 跑同 stage（模拟）时磁盘不再新增 reminder part
- [x] 5.3 新增/扩展 proposal-archive 集成测试：`archive.messages.jsonl` 中 user 消息 `parts[0]` 为 reminder；`archive.json` 的 status 流转正常
- [x] 5.4 手工验证：清空一个新项目的 sessions 目录，开启 chat 发第一条消息；在 agent 日志或 mock 里确认 `connection.prompt` 的 `prompt` 为 `[reminder, user]` 两元素数组

## 6. 前端：UI 过滤 system-reminder part

- [x] 6.1 新建 `frontend/src/utils/system-reminder.ts`，导出 `isSystemReminderPart(part: unknown): boolean`。规则：`typeof part === "object" && part !== null && (part as any).type === "text" && typeof (part as any).text === "string" && 其 text 经 trim 后以 "<system-reminder>" 开头 && 以 "</system-reminder>" 结尾`
- [x] 6.2 在 `frontend/src/components/shared/UIMessageList.vue` 第 86-95 行的 `isTextUIPart(part)` 分支内、`message.role === 'user'` 的 `<p>` 渲染前，加入 `v-if="!isSystemReminderPart(part)"` 判断跳过渲染；`message.role === 'assistant'` 分支不改
- [x] 6.3 新增/扩展 `UIMessageList.vue` 单测：user 消息 `parts[0]` 为 reminder + `parts[1]` 为普通 text 时，仅 `parts[1]` 文本出现在渲染结果；user 消息 `parts` 仅含单个 reminder 时气泡不输出文本且不崩溃；assistant 消息含相似首尾字面的 text 时不被误过滤（`isSystemReminderPart` 仅在 user 分支内调用）
- [x] 6.4 手工验证：刷新 chat 页面 + proposal SidePanel，reminder 不出现在 UI；历史消息从磁盘 resume 后同样不出现

## 7. 类型与边界守护

- [x] 7.1 `pnpm typecheck` 通过
- [x] 7.2 `grep` 验证 `frontend/` 与 `electron/preload/` 源码中未出现对 `electron/main/services/chat/system-reminder/` 任何子路径的 import
- [x] 7.3 `grep` 验证未新增 IPC 通道（`shared/types/channels.ts` 等 channels 常量文件无新增 reminder 相关条目）、未扩展 preload `contextBridge`、未修改 `shared/types/` 下与 reminder 相关的对外类型

## 8. 遗留项（Out of scope，本 change 不实现）

- [ ] 8.1 **fallback 专项治理**：`resumeSession` 失败降级到 `newSession` 时的完整处理——把 FylloCode 持久化的历史消息回放到新 ACP session、将 `SessionMeta.acpSessionId` 更新为新 id、reminder 注入策略是否需要区分"真·首次" vs "fallback"的二次评估、其他待识别的副作用（记为独立 change 立项）
- [ ] 8.2 **非 Claude Code agent 的 reminder wrapper 分发**：为不同 agentId 按其约定输出不同 wrapper（记为后续 change）
- [ ] 8.3 **reminder 模板文案定稿**：v1 骨架之上与用户 review 后迭代到生产形态（跟踪项，不作为阻塞）
