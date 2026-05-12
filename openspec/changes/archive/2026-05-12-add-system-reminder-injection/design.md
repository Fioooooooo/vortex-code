## Context

FylloCode 主进程通过 `AcpSession`（`electron/main/services/chat/acp-session.ts`）统一承载所有 ACP 交互。当前 `start(prompt)` 把外部传入的单段文本作为唯一 content block 调 `connection.prompt()`，prompt 数组结构固定为 `[{ type: "text", text: prompt }]`。

三个 owner 的 user message 落盘时机不同：

- **chat**：renderer 在 `sendMessage` 里通过 `chat:persistMessage` 把 user message 写入 `<sessionId>.messages.jsonl`（发生在 stream 启动之前）
- **apply**：main 进程在 `proposal:stageStream` 的 `onReady` 里构造 user message 并 `appendApplyRunMessage` 写入 `stage-{N}.messages.jsonl`
- **archive**：main 进程在 `proposal:archive` 的 `onReady` 里构造并 `appendArchiveMessage` 写入 `archive.messages.jsonl`

前端消息渲染已统一到 `frontend/src/components/shared/UIMessageList.vue`，user text part 的分支在第 92 行。

关键认知：FylloCode 的 `*.messages.jsonl` 仅作为 UI 展示副本；真正的 ACP 上下文由 agent 端按 `acpSessionId` 维护。`resumeSession` 只是把 id 交回 agent 让其继续，FylloCode 不把 jsonl 内容回放给 agent。因此"磁盘含 reminder part"不会造成 reminder 的重复注入。

## Goals / Non-Goals

**Goals:**

- 主进程全权控制的 session 级 system-reminder 注入机制
- 覆盖 chat / apply / archive 三种 owner
- reminder 作为独立 text block 注入 ACP prompt 数组，同时作为 user message 的首位 part 持久化到 FylloCode 侧 jsonl
- 前端 UI 不展示 reminder
- resumeSession 场景不注入；注入判定严格绑定 "本次调用了 `connection.newSession()`"（包含 resume 失败降级的 fallback）
- 零 IPC 扩展、零 shared 类型扩展、零前端入口，用户无法注入自定义内容

**Non-Goals:**

- 用户自定义 reminder
- 非 Claude Code ACP agent 的 reminder wrapper（v1 只支持 `<system-reminder>` 约定）
- resumeSession 失败降级路径的治理（历史消息回放、sessionId 迁移等）—— 仅以 TODO 与独立后续任务记录
- reminder 文案最终定稿（v1 提供骨架，内容后续迭代）

## Decisions

### D1. 注入触发点：`AcpSession.start` 内 `connection.newSession()` 成功分支

**选择**：在 `acp-session.ts` 的 `if (!acpSessionId)` 分支里、`newSession` 返回之后、`connection.prompt()` 之前执行 reminder 解析与拼装。

**为何不在 IPC handler 预判**：IPC handler 只能看到磁盘上的 `acpSessionId` 是否存在，无法区分"真·首次" vs "resume 失败 fallback"。把判定下沉到 `AcpSession` 内部，可以用"是否执行了 `connection.newSession()` 调用"作为唯一、不靠代理信号的判定依据，自然覆盖 fallback 场景。

**放弃的代理信号**：`sessionMeta.turnCount === 0`、实例变量 `hasInjected`、`wasResumed` 参数。前两者在 fallback 场景会给出错误答案；`wasResumed` 反映的是 ACP 层事件，不是"FylloCode 视角的 session 是否新建"。

### D2. reminder 以独立 text block 形式放入 prompt 数组

**选择**：拼装为

```ts
prompt: [
  { type: "text", text: "<system-reminder>\n<reminder body>\n</system-reminder>" },
  { type: "text", text: userPrompt },
];
```

而非 `<system-reminder>...</system-reminder>\n\n<userPrompt>` 拼串。

**理由**：

- ACP 协议 `prompt` 字段就是 ContentBlock 数组，每个 block 独立
- Claude Code ACP adapter 会按约定识别 `<system-reminder>` 标签
- 不污染 user prompt 原文（对 UI 回显、日志、复制等更友好）

**持久化时 part 的类型**：v1 固定为 `type: "text"` 的 `TextUIPart`（来自 `ai` 包），与其它 text part 类型一致；不新增自定义 `part.type`。识别靠首尾标签字面量匹配（见 D5）。这样不改动 `UIMessage` 的共享类型定义，未来若升级为独立 UIPart 类型仍可平滑迁移。

### D3. owner 概念直接复用 `SessionOwner`，不新建 `SystemReminderKind`

`session-registry.ts` 的 `SessionOwner = "chat" | "apply" | "archive"` 与 reminder 需要的分流维度语义重合。新建独立枚举只会在新增 owner 时产生同步漂移。

`SystemReminderContext` 里的字段直接命名为 `owner: SessionOwner`。

### D4. 持久化路径：`onReminderInjected` 钩子回传给 IPC handler

**问题**：注入判定必须在 `AcpSession` 内部（D1），但 user message 的落盘路径因 owner 不同而不同（chat 走 renderer → persistMessage，apply/archive 走 main 的 append）。

**选择**：`AcpSessionOpts` 新增可选钩子

```ts
onReminderInjected?: (reminderPart: TextUIPart) => Promise<void>;
```

- `AcpSession.start` 在 `newSession` 分支内 resolve 到 reminder 后：先 `await onReminderInjected(part)`，再把 block 拼入 prompt 数组调 `connection.prompt`
- 钩子失败处理：**`AcpSession.start` 在 `try/catch` 中 `await` 钩子；捕获任何异常后调用 `logger.error` 记录，但不再上抛；`connection.prompt()` 照常发起**。语义是"持久化是附加副作用，不阻塞 agent 通信"——磁盘与内存的短暂不一致在 resume 场景下通过磁盘重新加载自愈
- IPC handler 按 owner 各自实现钩子：对目标 jsonl 的**最后一条 `role === "user"` 消息**做"parts 首位 pre-pend reminder part"的更新，全量读取 → 改写最后一条 → 全量写回

**新增的磁盘原语**（置于 `@main/infra/storage/`）：

- `prependReminderToLastUserMessage(path: string, reminderPart: TextUIPart)`：纯函数化的 jsonl 原子更新，三个 owner 复用同一实现，差异仅在路径
- IPC handler 三个薄封装：`chat.ts` 传 `<sessionId>.messages.jsonl`、`proposal-apply.ts` 传 `stage-{N}.messages.jsonl`、同文件 `archive` handler 传 `archive.messages.jsonl`

**为什么不改 user message 构造时机**：chat 的 user message 构造发生在 renderer，改时机会牵动整条 persistMessage 契约。apply/archive 虽然 main 构造，但 `onReady` 早于 `AcpSession.start`，此时还没走完 newSession 分支。钩子是唯一不破坏现有契约的路径。

**磁盘 parts 顺序**：与 prompt 数组顺序一致——reminder 在前、user 原文在后。

**不通过 sink 同步给前端**：前端内存里的 user message 仍是"无 reminder"版本；UI 本就不展示 reminder，视觉一致。下一次 resume / 页面重开走磁盘路径加载时，过滤器负责隐藏。这种"内存 vs 磁盘"短暂不一致是**预期行为**，不是 bug。

### D5. 前端隐藏识别逻辑

`UIMessageList.vue` 的 `message.role === 'user'` 且 `isTextUIPart(part)` 的渲染分支增加判断：`isSystemReminderPart(part)` 为真则跳过渲染。

识别规则：`part.type === "text"` 且 `part.text.trim()` 以 `<system-reminder>` 开头、以 `</system-reminder>` 结尾。纯字符串判断，不解析 XML。

该工具函数放置于 `frontend/src/utils/system-reminder.ts`，仅前端使用。main 侧只通过 `wrapAsSystemReminder` 生产内容，不做识别——两端无共享代码依赖，避免 frontend 反向依赖 main。

### D6. 模板与变量插值

目录：

```
electron/main/services/chat/system-reminder/
  index.ts                      # resolveSystemReminder(ctx): Promise<TextUIPart | null>
  types.ts                      # SystemReminderContext
  wrap.ts                       # wrapAsSystemReminder(body): string
  providers/
    chat.ts
    apply.ts
    archive.ts
  templates/
    chat.md
    apply.md
    archive.md
```

**对外签名**：`resolveSystemReminder(ctx) => Promise<TextUIPart | null>`。返回值若非 null，直接就是可放入 `connection.prompt` 数组与调 `onReminderInjected` 的 `TextUIPart`。`wrapAsSystemReminder` 为模块内部 util，不对外导出给 IPC handler。

**`TextUIPart` 类型来源**：`import type { TextUIPart } from "ai"`，与 `UIMessage` 其他 part 使用的类型一致。

**wrap 防御**：`wrapAsSystemReminder(body)` 若检测到 body 字面量已包含 `<system-reminder>` 或 `</system-reminder>` 字符串，SHALL 抛 `Error`（开发期即暴露模板错误，不走静默 sanitize）。模板文件由主进程维护、内容可控，违反即是 bug。

**变量插值**：provider 读取模板文件内容，仅替换白名单字段（`{{changeId}}`、`{{stageIndex}}`、`{{runId}}`、`{{projectPath}}`），其他 `{{...}}` 占位符按字面量保留。

**变量 sanitize**：白名单字段在插入前做 sanitize —— 若字段内容包含 `<` 或 `>` 字符，provider 返回 null（跳过该 session 的 reminder），并通过 `logger.warn` 记录 owner 与被拒字段名。避免用户态数据意外闭合 `</system-reminder>` 标签。

### D7. v1 仅支持 Claude Code ACP adapter

`SystemReminderContext` 保留 `agentId` 字段为未来扩展预留，但 v1 实现里 Claude Code 家族的 agentId **锁定为单元素列表** `[DEFAULT_ACP_AGENT_ID]`。不在该列表中的 agentId，`resolveSystemReminder` 返回 null（不注入）。不报错、不阻塞会话。

未来新增兼容 agent 时，需要**主动**把其 agentId 加入该列表（列表所在文件头部加注释提示此维护点），而不是用"包含 `claude`" 之类宽松规则模糊处理。

### D8. fallback 路径只留 TODO，不在本 change 处理

在 `acp-session.ts` 的 `catch { acpSessionId = undefined }` 分支旁新增注释：

```ts
// TODO(fallback-treatment): resumeSession 失败降级到 newSession 时，
// 需要专项治理：回放 FylloCode 持久化的历史消息、迁移 acpSessionId 等。
// 相关 change：<本 change 的归档 id>，独立后续任务见 tasks.md。
```

tasks.md 里列一条独立"fallback 专项治理"任务条目，标注 out-of-scope。

## Risks / Trade-offs

- **[风险] 磁盘 jsonl "读全改写回"的并发安全**。chat 在 stream 过程中不会有其他写方触碰同一文件（assistant 消息要等 `done` 才写），注入点与 user 消息已落盘之间是线性串行，实际无并发。
  → 缓解：通过 `onReminderInjected` 的 `await` 保证顺序；若未来改为并行写，需引入文件级锁。当前用注释记录此约束。

- **[风险] 模板变量 XML 注入**。`changeId` 等字段理论上可能含尖括号。
  → 缓解：D6 的 sanitize 规则拒绝含 `<` / `>` 的字段；未通过即跳过该 session 的 reminder（可观测）。

- **[风险] reminder token 开销**。每个新建 session 多一段内容。
  → 缓解：内容以"指向 CLAUDE.md 的硬性规则摘要"为主，避免复述全文；总长目标控制在百级 token。

- **[风险] 前端 resume 后误展示旧 session 历史里的 reminder**。
  → 缓解：D5 的过滤器覆盖所有 UIMessageList 使用处（chat 与 SidePanel 都经同一组件）。

- **[风险] fallback 路径下 agent 拿到的是全新空 session，历史上下文丢失**。reminder 本身不加重此问题（有 reminder > 无 reminder），但整体仍是坏体验。
  → 缓解：D8 的 TODO 与独立任务；本 change 不承诺修复。

- **[权衡] 钩子式持久化 vs 事件流持久化**。事件流（在 `SessionEvent` 联合里新增一种）更符合现有模式，但引入"持久化失败后 stream 如何 recover"的额外状态；钩子是同步 await，失败即捕获记录、不阻塞 prompt，路径更短。选钩子。

- **[预期行为，非 bug] renderer 当前 turn 的内存 user message 与磁盘 user message 不一致**。注入发生在 renderer 已经 push 完 user 消息之后，钩子只改磁盘不推 sink。UI 当前 turn 看不到 reminder（符合目标）；下次 resume / 页面重开走磁盘路径加载，过滤器再隐藏。两条路径都"UI 不展示"，结果一致。其他 agent 看到这种不一致时不应"修复"成同步状态。

## Migration Plan

**部署**：无迁移成本。

- 已存在的 session（磁盘有 `acpSessionId`）下次发消息走 resume 分支 → 不注入，行为与现在一致
- 新建 session 自动获得 reminder
- 已有 `*.messages.jsonl` 不改动

**回滚**：删除 reminder 目录、`AcpSessionOpts` 的钩子字段、`UIMessageList.vue` 的过滤分支即可完全回到现状。磁盘上已注入的 reminder part 在过滤器移除后会变为可见的 user text，属轻微 UI 异常但不损数据。若需清理，可写一次性脚本扫 jsonl 剥离首位 reminder part。

## Open Questions

（无——v1 实现细节已全部定稿。reminder 模板 v1 文案由实现者按占位符起草、用户边测边修，不视为设计级争议。）
