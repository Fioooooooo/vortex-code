## ADDED Requirements

### Requirement: Session 内存态保存 agent 可用命令列表

系统 SHALL 在 `shared/types/chat.ts` 的 `Session` 接口上新增可选字段 `availableCommands?: AcpAvailableCommand[]`，用于存储 agent 通过 ACP `available_commands_update` 推送的 slash 命令列表。

该字段 SHALL 满足：

- 属于内存态：不序列化到 `SessionMeta`，不写入磁盘；`session-store` 的读写不涉及该字段。
- 作用域为单个 `Session` 对象：不同 session 各自独立；session 切换时随 `activeSession` 自然切换，无需手工清空。
- `normalizeSession` 在从 IPC 返回结果构建 `Session` 时 SHALL 不写入该字段，保证从磁盘加载的 session 初始值为 `undefined`。
- `undefined` 表示"agent 尚未推送"，`[]` 表示"agent 已推送但无可用命令"，`[...]` 表示"有可用命令"。

`AcpAvailableCommand` 类型定义如下（与 ACP 协议 `AvailableCommand` 对齐的前端本地类型）：

```typescript
interface AcpAvailableCommand {
  name: string;
  description: string;
  hint?: string;
}
```

#### Scenario: 磁盘加载的 session 初始无 availableCommands

- **WHEN** `useSessionStore.loadSessions` 从 IPC 返回结果构建 `sessions`
- **THEN** 每个 `Session` 对象的 `availableCommands` 字段为 `undefined`
- **AND** 磁盘 `<sessionId>.json` 不包含 `availableCommands` 字段

#### Scenario: 切换 session 时数据各自独立

- **WHEN** 用户先在 session A 收到 agent 推送的 commands（`availableCommands = [...]`），然后切换到 session B
- **THEN** `activeSession` 切换为 session B，`activeSession.availableCommands` 为 session B 自身字段（通常为 `undefined` 或 session B 之前收到的命令集）
- **AND** session A 的 `availableCommands` 保留在 session A 对象上，未被清空
- **AND** 再次切回 session A 时，`activeSession.availableCommands` 恢复为 session A 原值

### Requirement: Session store 提供 setSessionAvailableCommands action

系统 SHALL 在 `frontend/src/stores/session.ts` 的 `useSessionStore` 上新增 action `setSessionAvailableCommands(sessionId: string, commands: AcpAvailableCommand[]): void`，用于在收到 ACP `available_commands_update` chunk 后更新对应 session 的内存态字段。

具体行为：

- 在 `sessions` 数组中查找 `session.id === sessionId` 的条目；
- 若找到，将该 session 的 `availableCommands` 字段覆盖为传入的 `commands`（接受空数组）；
- 若未找到（例如 session 已被删除、或 sessionId 对应 draft 态不在 sessions 数组中），静默 no-op，不抛错；
- 该 action 不修改 `activeSessionId`、不触发排序、不调用任何 IPC。

该 action SHALL 被 `frontend/src/stores/chat.ts` 的 `streamSessionMessage.onChunk` 在收到 `available_commands_update` chunk 时调用。

#### Scenario: 更新存在的 session

- **WHEN** renderer 收到 `{ kind: "available_commands_update", commands: [{ name: "review", description: "..." }] }` chunk，`activeSession.id` 为 "s-1"，`sessions` 中存在 id 为 "s-1" 的条目
- **THEN** chat store 调用 `sessionStore.setSessionAvailableCommands("s-1", [{ name: "review", description: "..." }])`
- **AND** 该 session 的 `availableCommands` 字段更新为传入数组
- **AND** 其他 session 的 `availableCommands` 不变

#### Scenario: 更新不存在的 session 静默忽略

- **WHEN** 调用 `setSessionAvailableCommands("not-exist", [...])`，`sessions` 中不存在该 id
- **THEN** action 不抛出异常，不修改任何状态

#### Scenario: 空数组覆盖

- **WHEN** 调用 `setSessionAvailableCommands(sessionId, [])`
- **THEN** 对应 session 的 `availableCommands` 被覆盖为 `[]`
- **AND** 不会被当作 `undefined` 处理

### Requirement: Chat store 将 available_commands_update chunk 分派到 session store

系统 SHALL 在 `frontend/src/stores/chat.ts` 的 `streamSessionMessage` 的 `onChunk` 回调中，新增对 `kind === "available_commands_update"` 的分支：

- 不经过 `useUIMessageAssembler`（不调用 `assembler.applyChunk`）；
- 不修改 `activeSession.messages` / `turnCount` / `tokenUsage` / `title` 等任何消息相关字段；
- 调用 `useSessionStore().setSessionAvailableCommands(activeSession.id, data.commands)`。

chat store SHALL NOT 自身维护 commands 状态（职责严格限定在"一次消息往返"）。

#### Scenario: 收到 available_commands_update 时分派

- **WHEN** chat store 的 `streamSessionMessage` onChunk 收到 `{ kind: "available_commands_update", commands }`
- **THEN** chat store 调用 `sessionStore.setSessionAvailableCommands(activeSession.id, commands)`
- **AND** 不调用 `assembler.applyChunk`
- **AND** 不修改 `activeSession.messages`

### Requirement: useUIMessageAssembler 支持 reasoning 轨道

系统 SHALL 在 `frontend/src/composables/useUIMessageAssembler.ts` 中扩展 `applyChunk` 逻辑，使其支持 `reasoning_delta` chunk，并对 `available_commands_update` 显式 no-op。

具体规则：

- 新增内部 let 变量 `activeReasoningPartIdx: number`，与 `activeTextPartIdx` 对等维护；`resetActive()` / `setMessages()` 同时重置两者为 -1。
- `applyChunk({ kind: "reasoning_delta", text })` 分支：
  1. 调用 `ensureAssistantMessage()` 获取当前 assistant message；
  2. 若 `activeReasoningPartIdx >= 0` 且该索引处的 part 类型为 `"reasoning"`，将 `text` 追加到该 part 的 `.text`；
  3. 否则 `message.parts.push({ type: "reasoning", text })`，`activeReasoningPartIdx = message.parts.length - 1`；
  4. 重置 `activeTextPartIdx = -1`。
- `applyChunk({ kind: "text_delta", ... })` 既有逻辑在新建 / append text part 的两种路径结束前 SHALL 重置 `activeReasoningPartIdx = -1`。
- `applyChunk({ kind: "tool_call_start", ... })` 既有逻辑 SHALL 在 push dynamic-tool part 后同时重置 `activeTextPartIdx = -1` 与 `activeReasoningPartIdx = -1`。
- `applyChunk({ kind: "available_commands_update", ... })` 分支 SHALL 直接 return，不触碰消息容器、不创建 assistant message、不影响两个 active idx。
- `applyChunk` 对 `usage_update` / `session_info_update` / `status` 保持现有 no-op 行为。

#### Scenario: 纯 reasoning 流

- **WHEN** `applyChunk` 依次收到 `{ kind: "reasoning_delta", text: "a" }`、`{ kind: "reasoning_delta", text: "b" }`
- **THEN** `messages.value` 新增一条 assistant `UIMessage`
- **AND** 该消息的 `parts` 为 `[{ type: "reasoning", text: "ab" }]`

#### Scenario: reasoning → text 切换重置 activeReasoningPartIdx

- **WHEN** `applyChunk` 依次收到 `reasoning_delta("r1")`、`text_delta("t1")`、`reasoning_delta("r2")`
- **THEN** 唯一 assistant message 的 `parts` 为 `[reasoning("r1"), text("t1"), reasoning("r2")]`
- **AND** "r2" 进入新的 reasoning part（不与 "r1" 合并）

#### Scenario: available_commands_update 不触碰消息容器

- **WHEN** 当前 `messages.value.length === 0`，`applyChunk` 收到 `{ kind: "available_commands_update", commands: [...] }`
- **THEN** `messages.value.length` 仍为 0
- **AND** 不创建任何 assistant message
- **AND** `activeAssistantId` / `activeTextPartIdx` / `activeReasoningPartIdx` 保持不变

### Requirement: ChatContainer 集成 slash 命令菜单

系统 SHALL 在 `frontend/src/components/chat/ChatContainer.vue` 的 `UChatPrompt` 组件内集成 slash 命令菜单，并在 footer 左侧渲染一个 slash 触发按钮，用于发现与使用当前 agent 声明的可用命令。

具体要求：

- **按钮可见性**：在 `UChatPrompt` 的 footer 左侧（与 `ContextUsageRing` 同区域，位于 `ContextUsageRing` 右侧、`ChatAgentSelect` 左侧）渲染一个 slash 按钮，图标为 `i-lucide-slash-square`，`v-if="(activeSession?.availableCommands?.length ?? 0) > 0"`。`availableCommands` 为 `undefined` 或空数组时按钮不渲染。

- **按钮组件**：统一使用 `UButton variant="ghost" size="sm"` 包裹 `UIcon name="i-lucide-slash-square"`；不使用 `USlot` / `UChip` 等其他组件。

- **菜单组件**：点击按钮打开命令菜单。首选 `@nuxt/ui` 的 `UCommandPalette`（支持搜索、键盘导航、回车选中、ESC 关闭）；若其与 `UChatPrompt` 内嵌布局冲突（例如定位溢出或焦点陷阱失效），降级为 `UPopover` + `UListbox` + `UInput` 的组合，保持键盘导航 / 回车选中 / ESC 关闭 / 鼠标点击选中四项能力。菜单项展示两行：
  - 主文本：`/<command.name>`
  - 副文本：`<command.description>`

- **菜单交互**：SHALL 支持键盘上下方向键导航、回车选中、ESC 关闭；支持鼠标点击选中。菜单打开时焦点落在菜单搜索输入或首个选项；菜单关闭后焦点回到输入框当前位置。

- **`/` 键触发条件**：当用户在输入框按下 `/` 键、输入框聚焦、且光标处于"行首"（定义见下）、且 `activeSession?.availableCommands?.length > 0` 时，菜单 SHALL 在下一个 tick 打开。

  **"行首"定义**：设 `text = textarea.value`、`cursor = textarea.selectionStart`，令 `prefix = text.slice(0, cursor)`；若 `prefix` 不包含 `\n`，则其中仅有空白字符（空格或 tab）或为空串时视为行首；若 `prefix` 包含 `\n`，则取最后一个 `\n` 之后到 cursor 之间的子串，该子串仅有空白字符或为空串时视为行首。此定义支持多行输入的第二行起继续唤起菜单。

- **`/` 键不阻止默认**：keydown handler SHALL NOT 调用 `event.preventDefault()`。浏览器会把 `/` 写入 textarea，菜单在 input/keyup 后打开；当用户随后选中命令时，组件负责替换该 `/`（见插入规则）。当用户按 ESC 或点外侧关闭菜单且未选择命令时，已写入的 `/` 保留在输入框中（由用户决定是否删除）。

- **插入规则**：选中命令后：
  - 若菜单由 `/` 键触发（由组件内部状态标记），组件需找到当前光标位置向左的第一个 `/` 字符（保证它就是触发菜单那一个），将其替换为 `/<name> `（末尾含一个 ASCII 空格）。若因用户在菜单打开后继续输入删除了该 `/`，则降级为"在当前光标位置插入 `/<name> `"。
  - 若菜单由按钮点击触发，直接在当前光标位置插入 `/<name> `；若光标位置左侧最末非空白字符恰为非空格（例如 `hello`），插入前 SHALL 自动补一个空格，即实际插入 `/<name>`；否则直接插入 `/<name> `。
  - 插入完成后光标置于新末尾，焦点回到输入框，菜单关闭。

- **Hint placeholder 行为**：选中命令后若 `command.hint` 为非空字符串，组件 SHALL：
  1. 记录基准值 `baseline = textarea.value`（即命令插入完成后的值）；
  2. 将 `UChatPrompt` 的 `placeholder` prop 临时覆盖为 `command.hint`；
  3. 监听 textarea 的 `input` 事件：当 `textarea.value !== baseline` 时恢复默认 `placeholder`，取消监听；
  4. 监听 textarea 的 `blur` 事件：一旦触发恢复默认 `placeholder`，取消监听；
  5. 若再次选中另一个带 hint 的命令，新 hint 覆盖旧 hint，基准值更新。
     若 `command.hint` 为 `undefined` 或空串，不修改 placeholder，也不监听 input / blur。

- **菜单关闭状态管理**：菜单关闭不清空输入框当前内容；菜单重开时重置搜索词为空、焦点回到第一项。

- **空态隐藏**：当 `activeSession` 为 `null`、`availableCommands` 为 `undefined` 或为 `[]` 时，按钮不渲染；`/` 键 keydown handler SHALL 读取最新 `availableCommands?.length`，发现不满足条件时直接返回（不打开菜单），让 `/` 按普通字符输入；不需要 preventDefault。

#### Scenario: agent 推送命令后按钮出现

- **WHEN** 用户处于某 session，`activeSession.availableCommands` 从 `undefined` 变为 `[{ name: "review", ... }]`
- **THEN** `UChatPrompt` footer 左侧出现 slash 触发按钮
- **AND** 按钮点击可打开菜单，展示 "/review" 与其 description

#### Scenario: 按 `/` 键在空输入框触发菜单

- **WHEN** 输入框聚焦、内容为空、`activeSession.availableCommands.length > 0`，用户按下 `/`
- **THEN** keydown handler 不调用 `preventDefault`，浏览器正常写入 `/`
- **AND** 菜单在随后的 tick 打开，展示当前 agent 声明的所有命令
- **AND** 输入框内容为 "/"

#### Scenario: 按 `/` 键在多行输入第二行行首触发菜单

- **WHEN** 输入框内容为 "hello\n"，光标位于末尾（即第二行行首），用户按下 `/`
- **THEN** 菜单打开，输入框内容变为 "hello\n/"

#### Scenario: 按 `/` 键在句中不触发菜单

- **WHEN** 输入框内容为 "hello" 且光标在末尾（第一行非行首），用户按下 `/`
- **THEN** 菜单不打开，输入框内容变为 "hello/"

#### Scenario: 选中命令替换 `/` 并应用 hint

- **WHEN** `/` 键触发菜单后，用户选中名为 "review-commit"（description "Review the code changes introduced by a commit"，hint "commit sha"）的命令
- **THEN** 输入框内容替换为 "/review-commit "（末尾含一个空格）
- **AND** 光标置于末尾
- **AND** `placeholder` 临时变为 "commit sha"，组件记录 baseline 为 "/review-commit "
- **AND** 菜单关闭，焦点回到输入框

#### Scenario: hint 下一次输入后恢复

- **WHEN** 上一场景完成后，用户继续输入 "abc"，`textarea.value` 变为 "/review-commit abc"
- **THEN** `textarea.value !== baseline` 条件满足，`placeholder` 恢复为默认值
- **AND** 监听器取消，不再响应后续 input 事件

#### Scenario: hint 失焦后恢复

- **WHEN** 选中带 hint 的命令后，用户直接点击输入框外，textarea 触发 `blur`
- **THEN** `placeholder` 恢复为默认值，监听器取消

#### Scenario: 按钮点击插入时自动补空格

- **WHEN** 输入框内容为 "fix this"（末尾无空格），光标在末尾，用户点击 slash 按钮后选中 "review"
- **THEN** 输入框内容变为 "fix this /review "
- **AND** 光标置于新末尾

#### Scenario: 按钮点击插入时不重复补空格

- **WHEN** 输入框内容为 "fix this "（末尾已有空格），光标在末尾，用户点击 slash 按钮后选中 "review"
- **THEN** 输入框内容变为 "fix this /review "（总空格数为 1）
- **AND** 光标置于新末尾

#### Scenario: ESC 关闭菜单保留 `/`

- **WHEN** `/` 键触发菜单后，用户按 ESC 关闭菜单，未选中任何命令
- **THEN** 菜单关闭，输入框内容保持为 "/"（此前用户按 `/` 时写入的字符不被清除）
- **AND** 焦点回到输入框

#### Scenario: agent 未声明命令时按钮隐藏

- **WHEN** `activeSession` 为 `null`，或 `activeSession.availableCommands` 为 `undefined`，或为 `[]`
- **THEN** slash 按钮不渲染
- **AND** 按 `/` 键不打开菜单，`/` 字符按普通文本输入

#### Scenario: 切换 session 按当前 session 数据更新按钮状态

- **WHEN** 用户从 session A（有命令）切换到 session B（无命令）
- **THEN** slash 按钮隐藏
- **AND** 再切回 session A，按钮根据 session A 自身 `availableCommands` 重新出现
