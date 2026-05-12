## Why

目前 ACP 侧的 `acp-mapper.ts` 只识别 `agent_message_chunk`、`tool_call`、`tool_call_update`、`usage_update`、`session_info_update` 五类 sessionUpdate，其余类型在 default 分支被静默丢弃。实际对接 Claude Code / Codex 等 ACP agent 时，agent 常态性推送以下两类事件，但前端完全看不到：

- `agent_thought_chunk`：agent 的思考片段流，结构与 `agent_message_chunk` 同为 `ContentChunk`（`{ content: { type: "text", text }, sessionUpdate }`）。用户期望像 reasoning 一样折叠展示并在流式期间实时更新。
- `available_commands_update`：agent 在 `newSession` / `resumeSession` 后推送的可用 slash 命令列表（含 `name` / `description` / 可选 `input.hint`）。用户期望在聊天输入框输入 `/` 触发的命令菜单里展示，并用 hint 作为二次输入提示。

两类事件语义独立：thought 属于"消息流的组成部分"，应进入 `UIMessage.parts` 并随磁盘持久化；commands 属于"session 级能力声明"，只作为内存态挂在 session 上，不落盘，切换 session 时必须清空（不同 agent 会声明不同命令集）。

## What Changes

### 新增 agent thought 链路（ACP 协议的 `agent_thought_chunk` → UI `reasoning` part）

- `acp-mapper.ts` 新增 `case "agent_thought_chunk"` 分支，仅在 `update.content.type === "text"` 时产出新事件 `{ type: "reasoning_delta", text }`，与 `agent_message_chunk` 的处理方式对称。
- `domain/chat/session-events.ts` 的 `SessionEvent` 联合新增 `{ type: "reasoning_delta"; text: string }`。
- `shared/types/ipc.ts` 的 `MessageChunkData` 联合新增 `{ kind: "reasoning_delta"; text: string }`。
- `services/chat/session-event-mapper.ts` 新增 `reasoning_delta` 透传分支。
- Main 进程 `MessageAssembler` 引入独立的 `activeReasoningPartIdx` 轨道，规则与 text 轨道对称：连续 delta 合并到同一 `{ type: "reasoning", text }` part（**不写入 `state` 字段**，流式视觉由外层 `UChatMessages :status` 与 `isPartStreaming(part)` 兜底）；任意其它事件（`text_delta` / `tool_call_start` / `tool_call_update`）重置 `activeReasoningPartIdx`；`text_delta` 路径同步重置 `activeReasoningPartIdx`，`tool_call_start` 路径同时重置 text / reasoning 两个轨道。
- Renderer `useUIMessageAssembler` 按同一规则追加 reasoning 分支，确保流式期间的实时渲染与 main 的落盘结构完全一致。
- `proposal:stageStream` / `proposal:archive` 两个 IPC handler 的事件白名单 SHALL 将 `reasoning_delta` 纳入"调用 assembler + 透传 chunk"分支，使 apply / archive 流也自动得到 reasoning 展示与持久化。
- `chat:stream:message` IPC handler 的事件 switch SHALL 新增对 `reasoning_delta` 的处理，逻辑与 `text_delta` 对称。
- `UIMessageList.vue` 已经有 `isReasoningUIPart` 分支（走 `UChatReasoning` + `ChatComark`），本变更**不改渲染组件**。
- 历史消息加载（`loadMessages` / `loadApplyRunMessages` / `loadArchiveMessages`）自然带 reasoning part，重启后可复现。

### 新增 available commands 链路（session 级能力声明）

- `acp-mapper.ts` 新增 `case "available_commands_update"` 分支，输出新事件 `{ type: "available_commands_update", commands: AcpAvailableCommand[] }`。只透传 `name` / `description` / `input.hint`（当 `input.type === "unstructured"` 时取其 hint，其余情况不带 hint），**丢弃 `_meta` 等潜在私有字段**以避免 IPC 跨进程序列化意外。
- `shared/types/chat.ts` 新增类型 `AcpAvailableCommand`（与 ACP 协议对齐的前端本地类型，独立于 ACP SDK 类型，便于 renderer 消费而不引入 SDK 依赖）：
  ```ts
  export interface AcpAvailableCommand {
    name: string;
    description: string;
    hint?: string;
  }
  ```
- `shared/types/chat.ts` 的 `Session` 接口新增可选字段 `availableCommands?: AcpAvailableCommand[]`（**内存态**，不序列化到磁盘 `SessionMeta`）。
- `domain/chat/session-events.ts` 的 `SessionEvent` 联合新增 `{ type: "available_commands_update"; commands: AcpAvailableCommand[] }`。
- `shared/types/ipc.ts` 的 `MessageChunkData` 联合新增 `{ kind: "available_commands_update"; commands: AcpAvailableCommand[] }`。
- `services/chat/session-event-mapper.ts` 新增 `available_commands_update` 透传分支。
- `chat:stream:message` IPC handler 的事件 switch SHALL 新增对 `available_commands_update` 的处理：**绕过 `MessageAssembler`**，直接通过 sink 推送 `available_commands_update` chunk；不修改 `SessionMeta`，不写磁盘。
- `proposal:stageStream` / `proposal:archive` 的事件 switch SHALL 对 `available_commands_update` 事件显式忽略（不透传、不写磁盘、不进 assembler），避免 proposal 场景误展示 slash 菜单。
- Main 进程 `MessageAssembler.apply` SHALL **不处理** `reasoning_delta` 以外的 thought / commands 以外分支混淆：即 assembler 对 `available_commands_update` 事件不做任何处理（与 `usage_update` / `session_info_update` 同级外部事件）。
- Renderer `useUIMessageAssembler.applyChunk` SHALL 对 `available_commands_update` 显式 no-op（与 `usage_update` / `session_info_update` 同级，在分派头部提前 return），不污染消息容器。
- Renderer `stores/session.ts` 新增 action `setSessionAvailableCommands(sessionId, commands)`：
  - 找到对应 session，将 `availableCommands` 覆盖为传入列表（接受 `[]` 表示 agent 确认无可用命令）；
  - session 不存在时静默忽略（例如 draft 态）。
- Renderer `stores/session.ts` 的 `selectSession` / `beginDraftSession` / `deleteSession` / `clearSessions` 不主动写 `availableCommands`；session 之间切换时 `activeSession.availableCommands` 自然跟随 `activeSessionId` 切换到目标 session 自己的字段，**不需要手工清空**（因为该字段只挂在每条 session 上）。
- Renderer `stores/session.ts` 的 `loadSessions` / `normalizeSession` 保证从磁盘加载的 session 其 `availableCommands` 始终为 `undefined`（内存态字段不会出现在落盘数据）。
- Renderer `stores/chat.ts` 的 `streamSessionMessage` 在 `onChunk` 中新增 `available_commands_update` 分支，调用 `sessionStore.setSessionAvailableCommands(activeSession.id, data.commands)`，**不**在 chat store 内维护 commands 状态。
- `ChatContainer.vue` 的 `UChatPrompt` 组件集成 slash 命令菜单：
  - 在 `footer` 左侧（与 `ContextUsageRing` 同区域）渲染一个 slash 触发按钮（图标 `i-lucide-slash-square`），`v-if="(activeSession?.availableCommands?.length ?? 0) > 0"`，`undefined` 或 `[]` 时**不渲染**（对应 agent 未推送或推送空集两种情况）。
  - 按钮点击打开命令菜单（使用 `UPopover` + `UCommandPalette`，与项目已有的 command palette 风格一致；若项目无现成组件则使用 `UPopover` + 列表）。
  - 在输入框中按 `/` 键同样打开菜单，菜单关闭后焦点回到输入框。
  - 菜单项展示 `name`（主文本，带 `/` 前缀）与 `description`（副文本）。
  - 选中命令后：将 `/<name> ` 追加到输入框当前内容的末尾（或替换光标位置的起始 `/`，如果是 `/` 键触发）；`input.hint` 作为临时 placeholder 覆盖提示（下一次输入变动后清除）。

### 不变的边界

- `UIMessageList.vue` 不改：reasoning 由 `isReasoningUIPart` 分支接住，`UChatReasoning` + `ChatComark` 已满足需求；commands 不进消息流。
- `MessageAssembler.flush()` / `appendMessage` / `appendApplyRunMessage` / `appendArchiveMessage` 不改：reasoning part 随 `parts` 数组自然落盘；commands 不经过 flush。
- `SessionMeta` / `sessions/<sessionId>.json` 磁盘结构不变：`availableCommands` 不落盘。
- `chat:persistMessage` / `chat:loadMessages` 签名不变：加载回来的历史消息 `parts` 中可能包含 reasoning part，渲染端按既有通路处理。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `acp-chat-backend`：新增两个 sessionUpdate → SessionEvent 映射分支；新增对应 `SessionEvent` 联合成员；`MessageAssembler` 新增 reasoning 轨道；`chat:stream:message` handler 新增 `reasoning_delta` / `available_commands_update` 事件处理（前者进 assembler + 透传 chunk，后者绕过 assembler 仅透传 chunk）。
- `ipc-streaming`：`MessageChunkData` 联合新增 `reasoning_delta` 与 `available_commands_update` 两个分支；对应接收 chunk 场景扩展。
- `chat-interface`：`Session` 接口新增内存态 `availableCommands?`；session store 新增 `setSessionAvailableCommands` action；chat store 在流式 `onChunk` 中分派 commands 更新；`ChatContainer.vue` 的 `UChatPrompt` 集成 slash 命令菜单与触发按钮（在 `availableCommands` 非空时显示）。
- `proposal-apply-run`：`proposal:stageStream` 与 `proposal:archive` handler 的事件白名单扩展，将 `reasoning_delta` 纳入 assembler + 透传分支，使 apply 与 archive 流自动获得 reasoning 展示与落盘；对 `available_commands_update` 事件显式忽略（不透传、不落盘）。

## Impact

### 代码

- `electron/main/services/chat/acp-mapper.ts`：新增两个 case 分支。
- `electron/main/domain/chat/session-events.ts`：`SessionEvent` 联合类型扩展两个成员。
- `electron/main/domain/chat/message-assembler.ts`：新增 `activeReasoningPartIdx` 字段与 reasoning 轨道处理。
- `electron/main/services/chat/session-event-mapper.ts`：新增两个透传分支。
- `electron/main/ipc/chat.ts`：事件 switch / 白名单新增两个分支（reasoning 进 assembler + 透传 chunk；commands 绕过 assembler，只透传 chunk）。
- `electron/main/ipc/proposal-apply.ts`：stage 与 archive handler 的事件白名单新增 `reasoning_delta`；对 `available_commands_update` 显式忽略。
- `shared/types/ipc.ts`：`MessageChunkData` 联合扩展两个分支。
- `shared/types/chat.ts`：新增 `AcpAvailableCommand` 类型；`Session` 接口新增可选字段 `availableCommands`。
- `frontend/src/composables/useUIMessageAssembler.ts`：新增 reasoning 分支处理；新增 commands no-op 分支。
- `frontend/src/stores/session.ts`：新增 `setSessionAvailableCommands` action；导出该 action。
- `frontend/src/stores/chat.ts`：`streamSessionMessage.onChunk` 新增 commands 分派分支；（保持 chat store 不维护 commands 状态）。
- `frontend/src/components/chat/ChatContainer.vue`：集成 slash 命令菜单与触发按钮，输入 `/` 键触发菜单与命令插入逻辑。

### 依赖

无新依赖；`UPopover` / `UCommandPalette`（或同等）均来自已集成的 `@nuxt/ui`。

### 测试

- Mapper 单测：新增 `agent_thought_chunk`（text / 非 text）与 `available_commands_update`（含 `input.hint` / 无 hint / 空数组）两个分组。
- MessageAssembler 单测：reasoning 轨道单独测试，包含「纯 reasoning 流」「reasoning → text 切换」「reasoning → tool 切换」「reasoning 与 text 多轮交替」四个场景。
- `session-event-mapper` 单测：新增两种透传。
- `useUIMessageAssembler` 单测：reasoning 流与 `available_commands_update` no-op 两组。
- Session store 单测：`setSessionAvailableCommands` 行为（存在 session / 不存在 session / `[]` 覆盖）。
- Chat store 单测：`available_commands_update` chunk 触发 session store action。
- Proposal-apply IPC 单测：stage / archive 的事件白名单包含 `reasoning_delta`；`available_commands_update` 被忽略不写磁盘。

### 用户可见行为

- ACP agent 流式思考片段从"隐形"变为"折叠展示可展开"的 reasoning 区域，交互与现有 reasoning 行为一致。
- 活跃 session 在 agent 推送 commands 后，聊天输入框 footer 左侧出现 slash 按钮；输入 `/` 唤起菜单；选择后命令插入输入框、hint 作为 placeholder；切换 session 时按钮与菜单按新 session 的字段显示（因 agent 不同而不同）；从未与 agent 交互的 draft session / 刚加载但尚未发起 prompt 的 session 不显示按钮。

### 风险与回滚

- 风险：若某 ACP agent 推送大量 `agent_thought_chunk`，`UIMessage.parts` 体积膨胀会影响落盘 jsonl 大小与 resume 渲染性能。缓解：reasoning 轨道合并连续 delta 到同一 part，避免 part 数量线性膨胀；不新增额外持久化通道。
- 风险：commands 列表在非活跃状态下随 session 对象常驻内存。缓解：字段可选、默认不挂；`deleteSession` 会整体移除 session，不产生泄漏。
- 回滚：移除两个新增 case 分支、两个 `SessionEvent` / `MessageChunkData` 成员、`Session.availableCommands` 字段与相关 UI 即可完全回退；历史磁盘中的 reasoning part 若存在，不影响旧逻辑加载（被当作未知 part 忽略在现有联合类型兼容性下）。
