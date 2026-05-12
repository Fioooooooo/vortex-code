## Context

### 现状链路

ACP sessionUpdate 进入 FylloCode 的链路如下（已稳定，本次不重写）：

```
ACP connection
  → SessionNotification{ sessionId, update: SessionUpdate }
  → acp-process-pool 分发到 sessionHandlers[acpSessionId]
  → AcpSession.on("event") 监听下游
  → acp-mapper.mapSessionUpdate(update) → SessionEvent | null
  → IPC handler（chat.ts / proposal-apply.ts 两个消费者）
      ├─ Main MessageAssembler.apply(ev)  —— 负责最终持久化组装
      └─ session-event-mapper.toMessageChunk(ev) → MessageChunkData
         → sink.sendChunk(chunk)
         → preload callbacks.onChunk(data)
         → Renderer useUIMessageAssembler.applyChunk(chunk) —— 负责流式期间 UI 容器
         → UIMessageList（按 part.type 渲染）
```

`MessageChunkData` 联合类型（当前）：`text_delta` / `tool_call_start` / `tool_call_update` / `usage_update` / `session_info_update` / `user_message` / `status`。
`SessionEvent` 联合类型（当前）：`text_delta` / `tool_call_start` / `tool_call_update` / `usage_update` / `session_info_update` / `done` / `error` / `session_id_resolved`。

`acp-mapper.ts` 目前的 `switch(update.sessionUpdate)` 只实现了五个 case，`default` 分支打 debug 日志后返回 null。ACP agent 在实际对话中会持续推送 `agent_thought_chunk`（ContentChunk 结构，内容为 thinking 片段文本）和 `available_commands_update`（session 级 slash 命令列表），目前被全部静默丢弃。

### 已有约束

- Main 进程 `MessageAssembler` 与 renderer 端 `useUIMessageAssembler` 是两份独立实现，各自负责自己侧的 `UIMessage.parts` 构造。落盘的 UIMessage 来自 main（`flush()`），流式期间的 UI 来自 renderer 直接 push 到 `activeSession.messages`。两者结构**必须一致**，否则 resume 后 UI 会与流式期间表现不同。
- `UIMessageList.vue` 已经用 `ai` 包的 `isReasoningUIPart` / `isTextUIPart` / `isToolUIPart` 做 part 分派，`UChatReasoning` + `ChatComark` 已负责折叠展示与流式样式；reasoning part 渲染通路已完备。
- `proposal-apply.ts` 的 stage 与 archive 两个 stream handler 各自维护事件白名单（显式 switch / if 过滤 `text_delta` / `tool_call_start` / `tool_call_update`），未列入白名单的事件会被整体丢弃。这是已有设计（避免 proposal 场景泄漏 chat 专用事件），本变更需要在白名单里显式加入 `reasoning_delta`。
- `Session` 接口的字段会被 session store 的 `normalizeSession` 从 IPC 返回结果映射到内存；`SessionMeta`（磁盘结构）与 `Session`（内存结构）同名但字段集合并不完全相同，内存态字段不会被 `saveSessionMeta` 序列化回磁盘。

### 目标读者

实现该 change 的 coding agent，需要依赖本设计做出稳定一致的实现决策，避免反复询问。

## Goals / Non-Goals

**Goals:**

- 让 `agent_thought_chunk` 在流式期间与历史 resume 后都以折叠式 reasoning 区块展示，交互与现有 reasoning part 一致（`UChatReasoning` 组件），并在 stage / archive / chat 三种流中统一生效。
- 让 `available_commands_update` 的数据挂在会话级 session 对象上，通过 `ChatContainer.vue` 的 slash 按钮（仅在有命令时显示）与 `/` 键唤起菜单，菜单项选中后将 `/<name> ` 插入输入框，`input.hint` 作为 placeholder 提示。
- 切换 session 时 slash 按钮与菜单根据目标 session 自身字段显示（因 agent 不同而不同），不需要手工"清空"动作；未与 agent 交互过的 session 不显示按钮。
- 保持 main / renderer 两侧 assembler 输出完全同构，使 resume 渲染与流式渲染视觉一致。
- 保持 `SessionMeta` 磁盘结构不变；commands 不落盘，应用重启后依赖下一次 agent 推送恢复。

**Non-Goals:**

- 不为 slash 菜单支持"结构化参数输入"（协议里 `AvailableCommandInput` 目前仅 `UnstructuredCommandInput` 一种，带 `hint` 字符串；不扩展到多字段表单）。
- 不为 reasoning part 加自定义样式；沿用 `UChatReasoning` 的折叠默认行为。
- 不实现 commands 的本地持久化或跨 session 共享；每次 agent 重新推送即为权威数据。
- 不改动 `UIMessageList.vue` 的渲染分派；reasoning 已有组件处理。
- 不改动 ACP SDK 依赖版本；本次只消费 SDK 已导出的 `SessionUpdate` 联合类型。

## Decisions

### D1. 使用既有 `type: "reasoning"` part 承载 thought，而非新增自定义 part

**选择**：`agent_thought_chunk` → `SessionEvent.reasoning_delta` → `MessageChunkData.reasoning_delta` → main/renderer assembler 分别 append 到 `{ type: "reasoning", text }` part。

**理由**：

- `ai` 包的 `ReasoningUIPart` 本就是 thinking / reasoning 通用载体，`UIMessageList.vue` 已绑定 `isReasoningUIPart` + `UChatReasoning`；复用即得到折叠展示与流式动画。
- `agent_thought_chunk` 的语义与 ACP `agent_message_chunk` 对称（同为 ContentChunk），区别仅在"用户可见"与"思考过程"。用 reasoning part 将两者分离展示，是符合 UI SDK 设计的自然做法。
- 如果新增自定义 part 类型，需要在 `UIMessageList.vue` 加分支、在 `@nuxt/ui` 范围外自造折叠组件、为历史数据设计兼容策略。成本与收益不成正比。

**备选**：将 thought 作为特殊标记的 text part 前后追加（`<think></think>` 之类）—— 被否决，破坏 Markdown 渲染，与既有 reasoning 通路冲突。

### D2. Reasoning 轨道与 text 轨道对等独立

**选择**：在 main `MessageAssembler` 与 renderer `useUIMessageAssembler` 中各自新增一个 `activeReasoningPartIdx` 字段，规则如下：

- `reasoning_delta`：若 `activeReasoningPartIdx >= 0` 且该 part 仍是 reasoning，append 到 `part.text`；否则新建 `{ type: "reasoning", text }` part 并记录 idx；**重置 `activeTextPartIdx = -1`**。
- `text_delta`：按既有规则处理；**重置 `activeReasoningPartIdx = -1`**。
- `tool_call_start`：同时重置 `activeTextPartIdx = -1` 与 `activeReasoningPartIdx = -1`（与当前 text 轨道处理对称）。
- `tool_call_update`：不触碰两个 idx（与现状一致）。
- `flush()` / 新 assistant message 创建时：两个 idx 都重置为 -1。

**理由**：

- 保证 reasoning 与 text 交替到达时，各自的"活跃段"独立延续，不会被对方中断合并。
- 互相重置保证顺序可观察（reasoning 结束后新到的 text 不会被错误 append 到 reasoning 段末尾，反之亦然）。
- 与现有 text 轨道的实现风格完全对称，便于未来引入新的 chunk 类型（比如 sidenote）时继续扩展。

**备选方案**：只用一个 `activeChunkPartIdx` 字段，每次根据 part.type 判断是否 append。被否决：代码读起来不如双轨道清晰，且在 text ↔ reasoning 边界判断上需要额外 branch，没有实质简化。

### D3. 两份 assembler 保持同构但不提取共享库

**选择**：main `MessageAssembler` 与 renderer `useUIMessageAssembler` 各自独立加 reasoning 轨道，规则文字对齐但不抽出共享模块。

**理由**：

- 两份实现的宿主差异明显：main 侧是类 + `emit` 风格；renderer 侧是组合式函数 + Ref 容器；共用 session id 生成策略也不同。历史上本次之前的 reasoning-less 阶段两侧就是分别维护。
- 抽共享会牵涉 `shared/` 目录下的"纯领域逻辑"重构，超出本变更范围（会破坏"只做 thought / commands 两件事"的边界）。
- 代码复制量很小（一个字段 + 两个分支 + 两处重置），用测试双向约束即可。

**备选**：提取 `shared/chat/message-assembler-core.ts`。记录为后续独立重构议题，不在本 change 中做。

### D4. Commands 放 session store、不进 chat store

**选择**：`Session.availableCommands?: AcpAvailableCommand[]` 字段 + `useSessionStore.setSessionAvailableCommands(sessionId, commands)` action；chat store 的 `streamSessionMessage.onChunk` 只做分派调用。

**理由**：

- 职责分离：chat store 负责"一次消息往返"（prompt、chunk 聚合、取消），session store 负责"session 全量状态"（title、tokenUsage、agentId 等已就位）。commands 同属会话级能力声明，归属明确。
- session 切换天然隔离：`activeSession` 是 computed，`availableCommands` 随 session 对象切换，不需要额外"切换时清空"逻辑；实现简单，错误面小。
- 消费方就近：`ChatContainer.vue` 已经 `storeToRefs(useSessionStore())` 获取 `activeSession`，直接 `activeSession.availableCommands` 即可；不需要再注入 chat store。

**备选**：放 chat store 的独立 ref。被否决，职责混杂、session 切换时需手工清理，易错。

### D5. Commands 内存态、不落盘

**选择**：`Session.availableCommands` 仅存在内存；`SessionMeta` 磁盘结构与 `session-store` 的序列化逻辑**不改**；`normalizeSession` 不写入该字段（默认 `undefined`）。

**理由**：

- 不同 agent 声明不同命令集，若落盘则切 agent 后需要额外校验与清理；依赖 agent 每次会话期起始推送即为权威，策略最简单。
- 应用重启后该字段自然为 `undefined`，直到下一次 `newSession` / `resumeSession` 完成并 agent 推送 `available_commands_update` 后显示；与用户心智一致（重启后 agent 进程重新初始化，commands 本就应当重新建立）。
- 磁盘结构不变保证与已有 `SessionMeta` / `listSessionMetas` / `loadSessionMeta` / `saveSessionMeta` 链路零耦合，降低回滚成本。

**备选**：落盘以缓存上次的 commands。被否决，理由同上。

### D6. slash 按钮的三态可见性只通过 `availableCommands?.length > 0` 编码

**选择**：不引入额外 `commandsStatus` 字段。`ChatContainer.vue` 使用 `v-if="(activeSession?.availableCommands?.length ?? 0) > 0"`。

**理由**：

- `availableCommands` 本身三态足以表达：`undefined`（未推送过）、`[]`（agent 确认无）、`[...]`（有）。`.length > 0` 在前两种情况下都为 false，UI 对二者的表现需求一致（不显示按钮）。
- 再引入显式 `"pending" | "ready" | "empty"` 字段会在两处维护同义信息，易产生状态不一致。
- 与 D5 的"重启后默认 undefined"天然契合。

### D7. Slash 菜单的触发与插入行为

**选择**：

- 触发路径 1：用户在输入框按 `/` 键（且非 autocomplete / 编辑中），menu 打开；菜单关闭后焦点回到输入框当前位置。
- 触发路径 2：用户点击输入框 footer 左侧的 slash 按钮（统一使用 `UButton variant="ghost" size="sm"` 包裹 `UIcon name="i-lucide-slash-square"`；不使用 `USlot` / `UChip` 等），点击打开菜单；按钮的 `v-if` 绑定 D6 的条件。
- 菜单组件：优先使用 `@nuxt/ui` 的 `UCommandPalette`（带搜索、键盘导航）；若与 `UChatPrompt` 内的定位冲突，退化为 `UPopover` + `UListbox` + 项目自有的 `UInput` 搜索框。实现者自行权衡，效果需覆盖"键盘上下导航 + 回车选中 + ESC 关闭"。
- 插入规则：
  - 若菜单由 `/` 键触发且当前光标前就是用户输入的 `/`，将 `/` 替换为 `/<name> `；
  - 否则直接在光标当前位置插入 `/<name> `；
  - 插入后焦点回到输入框，光标置于插入文本尾部。
- Hint 展示：选中命令后，若 `hint` 非空，将其作为 placeholder 临时覆盖（`UChatPrompt` 的 `placeholder` prop 由组件内部 ref 控制），直到用户下一次 input 事件触发后清除。

**理由**：

- 两种触发路径对应两种用户心智（"键盘党"与"鼠标党"），`@nuxt/ui` 的 `UCommandPalette` 对两者都有良好支持。
- 选中后只做"文本插入 + placeholder 提示"，不强制提交，给用户留下补充 hint 所暗示内容的机会，符合 Claude Code / Codex CLI 的交互习惯。

**备选**：选中后自动发送。被否决，用户很可能需要补充 hint 所指示的输入。

### D8. Proposal 场景显式忽略 commands，但接收 reasoning

**选择**：

- `proposal:stageStream` / `proposal:archive` handler 的事件白名单把 `reasoning_delta` 加入"assembler.apply + toMessageChunk + sink.sendChunk"分支；
- 对 `available_commands_update` 显式忽略（不进 assembler、不透传、不写磁盘）。

**理由**：

- proposal-apply 场景也是 ACP agent 的完整会话，thought 展示对"看懂 agent 正在做什么"同样有价值，reasoning 的展示通路在 `UIMessageList.vue` 中无差别复用（proposal SidePanel 已经用同一组件）。
- proposal 场景没有 slash 菜单入口（`ProposalApplySidePanel.vue` 没有 `UChatPrompt`），commands 透传到 renderer 后也无消费方；保持"不透传"最简。

### D9. IPC 契约：显式 `_exhaustive: never` 兜底，替代隐式 TS 穷尽检查

**选择**：`shared/types/ipc.ts` 扩展两个分支后，实现者 SHALL 在所有消费 `MessageChunkData` 与 `SessionEvent` 的位点加上显式 `const _exhaustive: never = chunk` 断言（或把 if-return 链改为 `switch` + `default: const _x: never = chunk; throw ...`）。

**位点清单**（本次 change 必须逐个核对、新增或保留穷尽断言）：

消费 `MessageChunkData`：

1. `frontend/src/composables/useUIMessageAssembler.ts#applyChunk` — 当前是 if-return 链，**必须补**显式 exhaustive 断言或改为 switch。
2. `frontend/src/stores/chat.ts#streamSessionMessage.onChunk` — 当前是 if-return 链，**必须补**显式 exhaustive 断言。
3. `frontend/src/stores/proposal-run.ts#streamCurrentStage.onChunk` 与 `startArchive.onChunk` — 目前"全量透传给 assembler"，无需自行分派 kind，但应在 assembler 内部的 `applyChunk` 已有穷尽断言足以覆盖；如果 proposal-run 未来自己也 switch kind，应同样加断言。
4. `electron/preload/api/chat.ts` / `proposal.ts`（如有基于 kind 的转发）。

消费 `SessionEvent`：

5. `electron/main/services/chat/session-event-mapper.ts#toMessageChunk` — 当前 switch 已有 `case` 列举所有 event.type 且无 default，**必须**在所有新增 case 后保留 switch 无 default，让 TS 对 `switch(ev.type)` 做穷尽检查（`@typescript-eslint/switch-exhaustiveness-check` 或函数返回值类型联合引导 TS 报错）。
6. `electron/main/ipc/chat.ts` 的 SessionEvent 分派 — 当前可能是 switch 或 if 链；**必须**改为 switch（或在 if 链尾加 `const _x: never = ev`）。
7. `electron/main/ipc/proposal-apply.ts` 的 stage handler（`case` 式 switch）与 archive handler（if 链）— stage 保持 switch + 无 default；archive 将 if 链改为 switch 或在尾部加 exhaustive 断言。

**理由**：

- 历史认知误区：TS 对 if-return 链不进行穷尽检查（只对 switch + 联合类型做），仅靠 `pnpm typecheck` 无法保证漏分支被发现。
- 显式 `_exhaustive: never` 断言使漏分支立刻编译失败，成本极低（一行）。
- switch + 无 default + 函数返回值类型为明确联合时，TS 会强制所有分支被覆盖；这是项目已有模式（见 `session-event-mapper.ts`），本变更一律沿用。

**备选**：运行时 type guard。被否决，引入类型声明与 guard 的双写同步负担。

**实现者验收要点**（tasks 15.1 对应）：在运行 `pnpm typecheck` 前，手工注释掉任一新增 case，确认编译报错；恢复后再跑 typecheck。

## Risks / Trade-offs

- **[风险] reasoning 推送量大导致 jsonl 膨胀** → **Mitigation**：reasoning 轨道合并连续 delta 到单一 `parts[i]`，不会每个 chunk 新增一个 part；`appendMessage` 写入的是"一整条 UIMessage"，part 合并后字节体积与文本长度线性相关，可接受。
- **[风险] reasoning 与 text 轨道互相重置逻辑遗漏** → **Mitigation**：两侧 assembler 测试用"reasoning → text → reasoning → tool → reasoning"四轮交替用例覆盖边界；两侧实现用同一组测试矩阵（参数化）保证同构。
- **[风险] slash 按钮展示位置与 `ContextUsageRing` 冲突挤压布局** → **Mitigation**：布局上按钮放在 `ContextUsageRing` 右侧、`ChatAgentSelect` 左侧，图标 size="sm"，实测空间充足；若命令 description 过长，菜单宽度由 `UCommandPalette` 自身处理。
- **[风险] `/` 键触发菜单与 Markdown `/`（如代码片段、URL）起冲突** → **Mitigation**：仅当输入框当前聚焦且光标所在行之前无非空字符（或光标位置紧邻行首 / 空格后）时触发；具体判定沿用 `@nuxt/ui` 的 `UCommandPalette` 在 `trigger` 模式下的行为；若 UI 库未提供，用 `onKeyDown` 自实现 `hasLeadingWhitespaceOrLineStart` 判定。实现者在 tasks 中有明确验收点。
- **[风险] 旧 session 磁盘数据无 `availableCommands` 字段** → **Mitigation**：字段为可选，`normalizeSession` 不写入，`undefined` 视为"未推送"。无需迁移。
- **[风险] 旧 `.messages.jsonl` 无 reasoning part** → 无影响：`UIMessageList` 按 part.type 分派，无 reasoning part 自然不渲染 reasoning 区块。
- **[风险] ACP agent 推送 `available_commands_update` 时 session 尚未在 renderer 中存在**（竞态）→ **Mitigation**：`setSessionAvailableCommands` 在找不到 session 时静默 no-op。实际 ACP 流程中 commands 只会在 `newSession` / `resumeSession` 成功建立后推送，此时 renderer 必已持有该 session。

## Migration Plan

无数据迁移。发布即生效，回滚即移除。

1. 实现阶段按 tasks 顺序（先 types → mapper → assembler → IPC handler → renderer store → UI）。
2. 每一层完成后跑对应单测。
3. 全量跑 `pnpm typecheck && pnpm test && pnpm lint`，确认穷尽检查无遗漏。
4. 手动冒烟：
   - chat 场景：选择 Claude ACP agent → 发送"让你思考一下"类消息 → 验证 reasoning 折叠区出现，流式期间内容滚动，结束后仍可展开。
   - chat 场景：等待 agent 首次推送 commands 后检查 footer 出现 slash 按钮，按 `/` 弹菜单，选择命令，文本插入 + hint placeholder。
   - chat 场景：切到另一个不同 agent 的 session，验证 slash 按钮消失或显示不同命令集；切回原 session 验证命令集恢复。
   - proposal-apply 场景：跑一次 stage，若 agent 有 thinking，验证 reasoning 区块出现；验证 footer 没有 slash 按钮。
5. 回滚：reverse change，`SessionEvent` 与 `MessageChunkData` 联合缩回；磁盘 reasoning part 对旧代码无害（未知 part.type 在 `UIMessageList` 的 `v-else` 分支被忽略）。
