## Why

当前所有走 ACP 的交互（chat、proposal-apply、proposal-archive）都只把"用户 prompt"或"stage 种子 prompt"作为 prompt 送给 agent，缺少一条主进程内置、session 级稳定的"工作原则/工作方式"前置说明。这导致每个 agent 在接触同一个 FylloCode 项目时都要靠猜或靠 `CLAUDE.md` 里的后验信息理解定位，容易出现越权改动、忽略 OpenSpec 流程、在不该建 change 的地方建、在该建的地方不建等问题。

我们需要在主进程创建 ACP session 的那一刻，一次性把这类规则以 system-reminder 的形式注入到 ACP session 里，让后续所有 turn 自然继承。这套机制必须由主进程全权控制，用户不能注入任意自定义内容。

## What Changes

- 新增"**system reminder 注入**"能力：主进程在 `connection.newSession()` 成功之后、发送首个 `connection.prompt()` 之时，把一段主进程内置的 system-reminder 文本作为 prompt 数组里的**独立 text block** 拼在用户 block 之前，仅在每个 ACP session 的**首次** prompt 注入一次。
- 注入范围覆盖 **chat / apply / archive** 三种 owner；reminder 内容按 owner 分模板。
- reminder 以 `<system-reminder>...</system-reminder>` 包裹，与现有 Claude Code 约定一致。
- **持久化**：注入的 reminder 作为 `TextUIPart`（`type: "text"`，来自 `ai` 包，与其它 text part 同类型）落盘为该 turn user 消息的 `parts` 首位；不新增自定义 `part.type` 值；不单独建新消息。
- **仅主进程可控**：reminder 模板和 provider 全部位于 `electron/main/` 下；**不新增 IPC 通道**、不新增 preload 暴露、不新增 shared 类型导出；frontend/preload 不 import reminder 相关代码。用户侧没有任何注入入口。
- **前端渲染隐藏**：`UIMessageList.vue` 在 `message.role === 'user'` 的 text part 渲染分支中过滤掉 system-reminder part（通过首尾标签字面量识别），不在 UI 上显示该内容；但磁盘与 `UIMessage.parts` 中仍然保留，供 resume 后送回 agent 使用。
- **resumeSession 场景不注入**：注入条件严格绑定"这次调用了 `connection.newSession()`"。`turnCount`、`wasResumed` 等代理信号不使用。
- **fallback 路径（resumeSession 失败降级到 newSession）按"进入 newSession 即注入"处理**，不为此加分支；遗留的 fallback 专项治理（回放历史消息、迁移 `acpSessionId` 等）作为独立后续工作，仅以 `TODO` 注释与独立任务条目记录，不在本 change 范围内。
- **钩子失败不阻塞 prompt**：reminder 持久化通过可选钩子 `onReminderInjected` 回传给 IPC handler；钩子在 `try/catch` 中 await，异常仅 `logger.error` 不上抛，`connection.prompt()` 照常发起——磁盘与内存短暂不一致属预期行为。
- **v1 Claude Code agent 列表锁死**：内置精确列表初始为 `[DEFAULT_ACP_AGENT_ID]`，只对严格相等的 agentId 注入；其他 agentId 返回 null，不报错。

## Capabilities

### New Capabilities

- `system-reminder-injection`: 主进程在 ACP session 新建时，按 owner 分发、以独立 text block 注入一次性 system-reminder 的机制；包含 owner 到模板的映射、模板变量插值白名单、与现有消息持久化路径的结合方式。

### Modified Capabilities

- `acp-chat-backend`: `AcpSession.start()` 流程调整——`connection.newSession()` 成功后触发 reminder 解析与注入；`connection.prompt()` 的 `prompt` 数组结构由"单 user text block"扩展为"可选 system-reminder block + user text block"；同轮 user 消息的 `UIMessage.parts` 结构相应扩展（首个 part 可能是 system-reminder）。
- `proposal-apply-run`: apply / archive 两种 owner 的 `AcpSession` 首轮 prompt 组装路径与 chat 对齐，统一接入 system-reminder 注入；持久化到 `stage-{N}.messages.jsonl` / `archive.messages.jsonl` 的 user 消息 `parts` 可能包含首个 system-reminder part。
- `chat-interface`: `UIMessageList.vue` 的 user text part 渲染分支 SHALL 过滤 system-reminder 内容，不在 UI 显示。

## Impact

**代码**

- 新增目录：`electron/main/services/chat/system-reminder/`（index / types / providers / templates）
- 修改：`electron/main/services/chat/acp-session.ts`（构造参数增加 `owner` 与可选 owner 上下文；`start()` 内在 `newSession` 分支解析并拼 reminder block）
- 修改：`electron/main/ipc/chat.ts`、`electron/main/ipc/proposal-apply.ts`（在创建 `AcpSession` 时传入 owner 与上下文）
- 修改：user message 构造路径（`buildUserMessage` 等）：允许首个 part 为 system-reminder 并参与落盘
- 修改：`frontend/src/components/shared/UIMessageList.vue`（`message.role === 'user'` 分支过滤 system-reminder part）

**数据与协议**

- ACP prompt 数组结构从 `[text]` 扩展为 `[reminder?, text]`
- 磁盘 `UIMessage<MessageMeta>`（user 角色）的 `parts` 首个 part 可能为 system-reminder text part
- 不新增 IPC 通道，不改现有 IPC 入参形状

**依赖与外部系统**

- 无新增 npm 依赖
- 无新增环境变量

**非目标（本 change 不做）**

- 不支持用户自定义 reminder 内容
- 不实现 resumeSession 失败降级路径的完整治理（仅留 TODO 与独立任务条目）
- 不做多 agent（非 claude-code）的 reminder wrapper 分发；v1 Claude Code 家族 agentId 精确列表初始锁定为 `[DEFAULT_ACP_AGENT_ID]`，严格相等匹配
- 不最终定稿 reminder 文案；模板以占位骨架 + `{{白名单变量}}` 形式提供，由实现者/用户边测边改
