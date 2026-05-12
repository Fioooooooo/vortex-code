## 1. 共享类型（shared/）

- [x] 1.1 在 `shared/types/chat.ts` 新增 `AcpAvailableCommand` 接口（`name: string`、`description: string`、`hint?: string`），并导出
- [x] 1.2 在 `shared/types/chat.ts` 的 `Session` 接口新增可选字段 `availableCommands?: AcpAvailableCommand[]`（内存态，不序列化）
- [x] 1.3 在 `shared/types/ipc.ts` 的 `MessageChunkData` 联合类型新增两个分支：
  - `{ kind: "reasoning_delta"; text: string }`
  - `{ kind: "available_commands_update"; commands: AcpAvailableCommand[] }`
- [x] 1.4 确认 `shared/types/chat.ts` 的 `SessionMeta`（磁盘结构）**不添加** `availableCommands` 字段；`session-store` 的 `loadSessionMeta` / `saveSessionMeta` / `listSessionMetas` 不改

## 2. Main 领域事件与 mapper

- [x] 2.1 在 `electron/main/domain/chat/session-events.ts` 的 `SessionEvent` 联合类型新增两个成员：
  - `{ type: "reasoning_delta"; text: string }`
  - `{ type: "available_commands_update"; commands: AcpAvailableCommand[] }`（从 `@shared/types/chat` 导入 `AcpAvailableCommand`）
- [x] 2.2 在 `electron/main/services/chat/acp-mapper.ts` 新增 `case "agent_thought_chunk"`：仅在 `update.content.type === "text"` 时返回 `{ type: "reasoning_delta", text: update.content.text }`，其他 content.type 返回 `null`
- [x] 2.3 在 `acp-mapper.ts` 新增 `case "available_commands_update"`：遍历 `update.availableCommands`，每条命令仅取 `name`（string）、`description`（string）与 `input.hint`（当 `input != null && input.type === "unstructured"` 且 `typeof input.hint === "string"` 时取该值，否则 `hint: undefined`）；丢弃 `_meta` 与其他未识别字段；产出 `{ type: "available_commands_update", commands }`；空数组仍产出事件
- [x] 2.4 保留 `acp-mapper.ts` 的 default 分支（debug 日志 + 返回 null）不变
- [x] 2.5 更新 `acp-mapper.ts` 的 debug 日志 tag 约定（保持 `[acp-mapper] →` 前缀一致）

## 3. Main MessageAssembler 引入 reasoning 轨道

- [x] 3.1 在 `electron/main/domain/chat/message-assembler.ts` 的 `MessageAssembler` 类中新增私有字段 `private activeReasoningPartIdx = -1`
- [x] 3.2 修改 `ensureMessage()`：创建新 assistant message 后将 `activeReasoningPartIdx` 重置为 -1
- [x] 3.3 修改 `apply(ev)` 中既有 `ev.type === "text_delta"` 分支：在新建 text part 与 append 到 text part 两条路径末尾都重置 `this.activeReasoningPartIdx = -1`
- [x] 3.4 修改 `apply(ev)` 中既有 `ev.type === "tool_call_start"` 分支：在 push dynamic-tool part 后同时重置 `this.activeTextPartIdx = -1` 与 `this.activeReasoningPartIdx = -1`
- [x] 3.5 在 `apply(ev)` 新增 `ev.type === "reasoning_delta"` 分支：
  - 调用 `this.ensureMessage()` 获取 message
  - 若 `activeReasoningPartIdx >= 0` 且 `message.parts[activeReasoningPartIdx]?.type === "reasoning"`，append `ev.text` 到该 part 的 `.text`
  - 否则 `message.parts.push({ type: "reasoning", text: ev.text })` 并更新 `activeReasoningPartIdx`
  - 最后 `this.activeTextPartIdx = -1`
- [x] 3.6 修改 `flush()`：返回消息前重置 `activeReasoningPartIdx = -1`
- [x] 3.7 `apply` 方法签名 `apply(ev: SessionEvent): void` 不变；方法体内仅分派 `text_delta` / `reasoning_delta` / `tool_call_start` / `tool_call_update` 四个分支；其余 `SessionEvent` 成员（`available_commands_update` / `usage_update` / `session_info_update` / `done` / `error` / `session_id_resolved`）经过时不做任何处理

## 4. Session event mapper 透传

- [x] 4.1 在 `electron/main/services/chat/session-event-mapper.ts#toMessageChunk` 新增 `case "reasoning_delta":` 返回 `{ kind: "reasoning_delta", text: ev.text }`
- [x] 4.2 新增 `case "available_commands_update":` 返回 `{ kind: "available_commands_update", commands: ev.commands }`（commands 直接透传，无需深拷贝）
- [x] 4.3 保留 switch 无 default；验证 TS 穷尽检查：暂时注释掉任一新增 case，确认 `pnpm typecheck` 报错；恢复后再次 typecheck

## 5. chat:stream:message IPC handler

- [x] 5.1 在 `electron/main/ipc/chat.ts` 定位 `chat:stream:message` 的事件分派处（`AcpSession` emit 的 `SessionEvent`）。若当前是 if 链，改为 `switch (ev.type)` + 无 default
- [x] 5.2 新增 `case "reasoning_delta":` 分支：调用 `assembler.apply(ev)`，再通过 `sink.sendChunk(toMessageChunk(ev))`（与 `text_delta` 对称）
- [x] 5.3 新增 `case "available_commands_update":` 分支：**不**调用 `assembler.apply`；**不**修改 `SessionMeta` / 不调用 `saveSessionMeta`；仅通过 `sink.sendChunk(toMessageChunk(ev))` 透传给 renderer
- [x] 5.4 确保其他分支（`text_delta` / `tool_call_start` / `tool_call_update` / `usage_update` / `session_info_update` / `done` / `error` / `session_id_resolved`）行为不变
- [x] 5.5 在 switch 末尾加 `default: { const _x: never = ev; throw new Error(\`unhandled session event: \${(\_x as SessionEvent).type}\`); }` 或保持无 default 让 TS 联合返回类型触发穷尽检查；手工注释任一 case 确认编译报错

## 6. proposal-apply.ts IPC handler

- [x] 6.1 在 `electron/main/ipc/proposal-apply.ts` 的 stage stream handler（`ProposalChannels.stageStream`）事件 switch 中，将 `case "reasoning_delta":` 合并到既有 `case "text_delta": case "tool_call_start": case "tool_call_update":` 分支组（调用 `assembler.apply(ev)` + `toMessageChunk(ev)` + `sink.sendChunk`）
- [x] 6.2 在 stage stream handler 新增 `case "available_commands_update":` 分支：直接 `break`（不调用 assembler、不 sendChunk、不写磁盘、不修改 runMeta）
- [x] 6.3 将 archive stream handler（`ProposalChannels.archive`）现有的 if 链改为 `switch (ev.type)` + 无 default（或在末尾加 `const _x: never = ev` 断言），并把 `reasoning_delta` 合并进 "assembler + sendChunk" 分支组
- [x] 6.4 在 archive stream handler 新增 `case "available_commands_update":` 分支：直接 `break`（不调用 assembler、不 sendChunk、不写磁盘、不修改 archiveMeta）
- [x] 6.5 手工注释任一新增 case 确认编译报错；恢复后再次 typecheck；确认两个 handler 对所有 `SessionEvent` 成员有明确归属（reasoning 进白名单；commands 显式 break；其余保持原状）

## 7. Renderer composable

- [x] 7.1 在 `frontend/src/composables/useUIMessageAssembler.ts` 新增 `let activeReasoningPartIdx = -1;`
- [x] 7.2 修改 `resetActive()`：同时重置 `activeReasoningPartIdx = -1`
- [x] 7.3 修改 `setMessages()`：`resetActive()` 调用已覆盖两者，无需额外改动（验证）
- [x] 7.4 修改 `ensureAssistantMessage()`：创建新 assistant message 的路径中将 `activeReasoningPartIdx = -1`
- [x] 7.5 修改 `applyChunk`：
  - 在 `kind === "text_delta"` 分支新建 text part 与 append 到 text part 两条路径末尾都重置 `activeReasoningPartIdx = -1`
  - 在 `kind === "tool_call_start"` 分支 push dynamic-tool part 后同时重置 `activeTextPartIdx = -1` 与 `activeReasoningPartIdx = -1`
  - 新增 `kind === "reasoning_delta"` 分支：参照 text 轨道对称实现（合并到同一 reasoning part / 新建 part / 重置 `activeTextPartIdx`）
  - 新增 `kind === "available_commands_update"` 分支：直接 `return`（不触碰消息容器、不创建 assistant message、不影响两个 active idx）
  - 为 `usage_update` / `session_info_update` / `status` 保持现有 no-op 行为，新增显式 `return`
- [x] 7.6 在函数末尾加显式穷尽断言 `const _exhaustive: never = chunk;`（或把整个 if 链改为 `switch (chunk.kind)` + `default: { const _x: never = chunk; throw ... }`），手工注释任一新增分支确认 typecheck 报错

## 8. Renderer session store

- [x] 8.1 在 `frontend/src/stores/session.ts` 的 `useSessionStore` 内新增 action `setSessionAvailableCommands(sessionId: string, commands: AcpAvailableCommand[]): void`：
  - 从 `sessions.value` 查找 id 匹配的 session；找不到静默 no-op
  - 找到则 `session.availableCommands = commands`（接受 `[]`）
  - 不触发排序、不调用 IPC、不修改其他字段
- [x] 8.2 将 `setSessionAvailableCommands` 加入 store 的 `return` 暴露清单
- [x] 8.3 确认 `normalizeSession` 不写入 `availableCommands` 字段（从磁盘加载的 session 初始为 `undefined`）
- [x] 8.4 确认 `mergeSessionMeta` 不修改 `availableCommands`（commands 只通过新 action 流入）

## 9. Renderer chat store

- [x] 9.1 在 `frontend/src/stores/chat.ts#streamSessionMessage` 的 `onChunk` 回调中：
  - 在 `data.kind === "session_info_update"` / `data.kind === "usage_update"` 的 if 链上新增 `data.kind === "available_commands_update"` 分支：调用 `sessionStore.setSessionAvailableCommands(activeSession.id, data.commands)`，然后 `return`
  - 新增 `data.kind === "user_message"` / `data.kind === "status"` 的显式 return 分支（原本可能被默认路径 assembler 处理）
  - 其余（`text_delta` / `reasoning_delta` / `tool_call_start` / `tool_call_update`）走默认路径 `assembler.applyChunk(data)`
- [x] 9.2 确保 chat store 内不保存 `commands` 相关 ref / state
- [x] 9.3 在 `onChunk` 函数尾部加显式穷尽断言 `const _exhaustive: never = data;`（或把整个分派改为 `switch (data.kind)` + `default: { const _x: never = data; throw ... }`）；手工注释任一分支确认 typecheck 报错

## 10. Renderer proposal-run store

- [x] 10.1 `proposal-run` store 本 change 无需修改：`streamCurrentStage.onChunk` 与 `startArchive.onChunk` 已全量透传给 `assembler.applyChunk(data)`，新增的 `reasoning_delta` 会被组装为 reasoning part、`available_commands_update` 会命中 assembler 的 no-op 分支
- [x] 10.2 为 `proposal-run` store 增补单测：在 `frontend/src/__tests__/stores/proposal-run.spec.ts`（或新建文件）断言 `reasoning_delta` chunk 经 `applyChunk` 合并进 `messages`；断言 `available_commands_update` chunk 不改变 `messages.value`

## 11. UI 层：ChatContainer slash 菜单

- [x] 11.1 在 `frontend/src/components/chat/ChatContainer.vue` 增加对 `activeSession.availableCommands` 的响应式引用（经 `storeToRefs` 或 computed）
- [x] 11.2 在 `UChatPrompt` 的 `#footer` 中添加 slash 触发按钮：
  - 位置：`ContextUsageRing` 右侧、`ChatAgentSelect` 左侧，属于同一 `inline-flex` 容器
  - 组件：**统一使用** `UButton variant="ghost" size="sm"`（禁止使用 `USlot` / `UChip`）包裹 `UIcon name="i-lucide-slash-square"`
  - `v-if="(activeSession?.availableCommands?.length ?? 0) > 0"`
- [x] 11.3 实现菜单组件：
  - 首选 `UCommandPalette`（支持搜索、键盘导航、回车选中、ESC 关闭）
  - 菜单项展示：主文本 `/<name>`，副文本 `<description>`
  - 若 `UCommandPalette` 与 `UChatPrompt` 内嵌布局冲突（定位溢出或焦点陷阱失效），降级为 `UPopover` + `UListbox` + `UInput`；保持键盘导航 / 回车选中 / ESC 关闭 / 鼠标点击选中四项能力
- [x] 11.4 实现两条触发路径：
  - 按钮 click：打开菜单
  - 输入框 `/` 键 keydown handler：**不** `preventDefault`；仅在满足"`/` 键触发条件"（chat-interface spec 中"行首"定义）时，在下一个 tick 打开菜单；否则不打开，`/` 按普通字符由浏览器写入
- [x] 11.5 实现插入逻辑：
  - `/` 键触发且刚输入的 `/` 在光标前：将光标向左最近的 `/` 替换为 `/<name> `；若该 `/` 已被用户删除，降级为在光标位置插入 `/<name> `
  - 按钮触发：在光标位置插入；若光标左侧最末非空白字符非空格（如 `hello`），先补一个空格再插入 `/<name> `；否则直接插入 `/<name> `
  - 插入后光标置于末尾，焦点回到输入框，菜单关闭
- [x] 11.6 实现 hint placeholder：
  - 选中命令后若 `hint` 非空，记录 `baseline = textarea.value`（插入完成后的值）
  - 将 `UChatPrompt` 的 `placeholder` prop 临时覆盖为 `hint`
  - 监听 textarea `input` 事件：`textarea.value !== baseline` 时恢复默认 placeholder，取消监听
  - 监听 textarea `blur` 事件：触发即恢复默认 placeholder，取消监听
  - 若再次选中带 hint 的命令，新 hint 覆盖旧 hint，baseline 更新
  - 使用组件内 ref 控制 placeholder，不污染 session store
- [x] 11.7 组件 spec 测试：mount `ChatContainer` 并 stub `activeSession = null`，断言 DOM 中无 slash 按钮；stub 为 `{ availableCommands: [] }` 同样断言无按钮；stub 为非空数组断言按钮渲染
- [x] 11.8 组件 spec 测试：切换 `activeSession` 从"有命令"到"无命令"再切回，断言按钮显示 / 隐藏 / 显示；每次菜单打开后选项内容来自当前 session 的 `availableCommands`
- [x] 11.9 组件 spec 测试：模拟 `/` 键 keydown 在"空串光标 0"、"hello 光标 5"、"hello\n 光标 6"、"hello 光标 0"四种情形下的行为（行首 / 非行首），断言菜单开关状态与 preventDefault 未被调用

## 12. 单元测试 · main

- [x] 12.1 在 `electron/main/__tests__/services/chat/acp-mapper.spec.ts` 新增 `describe("agent_thought_chunk", ...)`：
  - 文本 content → 产出 `reasoning_delta` 事件
  - 非文本 content（例：`{ type: "image" }`）→ 返回 null
- [x] 12.2 在 `acp-mapper.spec.ts` 新增 `describe("available_commands_update", ...)`：
  - 含 `input: { type: "unstructured", hint: "xxx" }` 的命令 → `hint: "xxx"`
  - 含 `input: null` 的命令 → `hint: undefined`
  - 无 `input` 字段的命令 → `hint: undefined`
  - 含 `_meta` 字段 → `_meta` 被丢弃
  - 空数组 → 产出 `{ type: "available_commands_update", commands: [] }`
- [x] 12.3 在 `electron/main/__tests__/domain/chat/message-assembler.spec.ts` 新增 reasoning 轨道测试：
  - 纯 reasoning 流：3 个 `reasoning_delta` → `parts` 长度 1，text 合并
  - reasoning → text 切换：`parts` 为 `[reasoning, text]`，互不合并
  - reasoning → tool → reasoning：`parts` 为 `[reasoning, dynamic-tool, reasoning]`，两个 reasoning 各自独立
  - reasoning 作为首 part：`ensureMessage` 创建 assistant message，首 part 为 reasoning
  - `flush()` 后 `activeReasoningPartIdx` 重置为 -1
- [x] 12.4 在 `electron/main/__tests__/services/chat/session-event-mapper.spec.ts` 新增 `reasoning_delta` 与 `available_commands_update` 的透传测试

## 13. 单元测试 · IPC handler

- [x] 13.1 在 `electron/main/__tests__/ipc/chat.spec.ts` 新增：
  - `reasoning_delta` 事件 → `assembler.apply` 被调用 + sink 收到 `reasoning_delta` chunk
  - `available_commands_update` 事件 → `assembler.apply` **未**被调用 + `saveSessionMeta` **未**被调用 + sink 收到 `available_commands_update` chunk
- [x] 13.2 在 `electron/main/__tests__/ipc/proposal-apply.spec.ts` 新增：
  - stage stream: `reasoning_delta` → `assembler.apply` + sink chunk
  - stage stream: `available_commands_update` → 全部不触发（assembler / sink / appendApplyRunMessage / updateRunMetaIfCurrent 均未被调用）
  - archive stream: 同上两组

## 14. 单元测试 · renderer

- [x] 14.1 在 `frontend/src/__tests__/composables/use-ui-message-assembler.spec.ts` 新增：
  - 纯 reasoning 流合并
  - reasoning ↔ text 互相重置
  - `tool_call_start` 同时重置 text 与 reasoning idx
  - `available_commands_update` 不修改 `messages.value`（容器长度保持 0）
- [x] 14.2 在 `frontend/src/__tests__/stores` 新增 `session.spec.ts`（或增补现有文件）测试 `setSessionAvailableCommands`：
  - 存在 session → 字段被覆盖
  - 不存在 session → no-op
  - 空数组覆盖 → `availableCommands` 为 `[]` 而非 `undefined`
- [x] 14.3 在 `frontend/src/__tests__/stores/chat.spec.ts` 新增：
  - 收到 `available_commands_update` chunk → `sessionStore.setSessionAvailableCommands(activeSessionId, commands)` 被调用，`assembler.applyChunk` **未**被调用
  - 收到 `reasoning_delta` chunk → 默认路径 `assembler.applyChunk` 被调用

## 15. 类型与构建验证

- [x] 15.1 运行 `pnpm typecheck`：验证 `MessageChunkData` / `SessionEvent` 新增分支在所有消费位点均被 TS 穷尽检查接住
- [x] 15.2 运行 `pnpm lint`：ESLint 通过
- [ ] 15.3 运行 `pnpm test`：全部单测通过
- [x] 15.4 运行 `pnpm build`：electron-vite 与前端均构建成功

## 16. 手动冒烟

- [x] 16.1 启动 `pnpm dev`，在 chat 场景选择 Claude ACP agent，发送"请先思考再回答：xxx"类型提示：
  - 观察流式期间 `UChatReasoning` 折叠区出现并持续更新；agent 最终文本与 reasoning 分离展示
  - 打开开发者工具确认 `messages.jsonl` 的最新消息 `parts` 数组内包含 `{ type: "reasoning", text: ... }`
- [x] 16.2 待 agent 推送命令后：
  - footer 左侧出现 slash 按钮；点击菜单展示命令列表
  - 输入框按 `/` 键：空输入下菜单打开；输入 "hello" 后再按 `/` 不打开菜单
  - 选中命令后输入框显示 `/<name> ` 且 placeholder 为 hint（下一次输入变化后恢复默认）
- [x] 16.3 切换到不同 agent 的另一 session：
  - slash 按钮立即跟随新 session 状态（通常隐藏直至新 agent 推送）
  - 切回原 session，按钮与命令集恢复
- [x] 16.4 在 proposal-apply 流程中触发一次 stage：
  - 若 agent 有 thinking，`UIMessageList` 展示 reasoning 折叠区
  - 确认 SidePanel 无 slash 按钮（proposal 无 `UChatPrompt`）
  - 重开页面 `resumeRun` → 历史消息含 reasoning part 并正常渲染

## 17. 文档与归档准备

- [x] 17.1 检查 `docs/MainProcess.md` 中关于 `MessageAssembler` 的描述，若含"轨道"或"active idx"相关说明则更新为双轨道；若无则跳过
- [x] 17.2 检查 `docs/RendererProcess.md` 中关于 chat / session store 的描述，补充 `availableCommands` 字段说明（若该文件包含 store 级说明）
- [ ] 17.3 归档前：确认本 change 所有 tasks 完成、所有测试通过；由维护者按 `fyllo-archive-change` skill 流程归档
