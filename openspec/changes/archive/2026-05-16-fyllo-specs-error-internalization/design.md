## Context

fyllo-specs MCP server 当前通过 `McpError` 向外抛出业务错误（change 不存在、CLI 失败、归档冲突等）。这导致 agent 在调用 tool 后只收到裸错误消息，skill prompt（包含完整工作流指导）完全丢失。skill prompt 本身已设计错误处理策略（如 pause 并等待 guidance），错误应当作为状态信息让 agent 自主决策，而非中断 tool 调用。

## Goals / Non-Goals

**Goals:**

- 所有 tool 无论成功或失败，始终返回 `skillPrompt + state` 双段文本
- 业务错误和 CLI 错误内敛到 `state.errors` 字段
- 保持 zod schema 校验错误仍由 MCP SDK 原样处理（真正的契约错误）

**Non-Goals:**

- 不修改任何 SKILL.md prompt 文件（prompt 本身已包含错误处理策略）
- 不修改 openspec-runtime 适配层内部的错误类型（`OpenspecCliError`、`OpenspecTimeoutError` 继续作为运行时错误类型存在）
- 不改写 openspec CLI 本身的错误语义

## Decisions

### Decision 1: `runTool` 包装器

在 `utils/state.ts` 中新增 `runTool` 函数，职责为 try/catch + 自动填充错误 state：

```ts
export async function runTool(
  promptId: PromptId,
  build: () => Promise<Record<string, unknown>>
): Promise<string> {
  const skillPrompt = loadPrompt(promptId);
  try {
    const state = await build();
    return wrapState(skillPrompt, state);
  } catch (err) {
    const errorEntry = {
      type: err instanceof Error ? err.name : "UnknownError",
      message: err instanceof Error ? err.message : String(err),
    };
    return wrapState(skillPrompt, { errors: [errorEntry] });
  }
}
```

**Rationale:** 保持 `wrapState` 只做纯格式化，新增 `runTool` 负责错误收敛。这样 normal path 和 error path 都走 `wrapState`，保证输出结构一致。

**Alternative considered:** 直接修改 `wrapState` 让它也接受错误参数。被否决——`wrapState` 当前是一个纯函数，保持单一职责更清晰；错误包装逻辑更复杂（需要 loadPrompt），放在新函数中更合理。

### Decision 2: 错误类型映射

`OpenspecCliError` → `state.errors[0].type === "OpenspecCliError"`  
`OpenspecTimeoutError` → `state.errors[0].type === "OpenspecTimeoutError"`  
普通 `Error` → `state.errors[0].type === "Error"`  
非 Error 对象 → `state.errors[0].type === "UnknownError"`

**Rationale:** 保留原始错误类型名称，让 agent 可以区分 CLI 错误、超时错误、文件系统错误等不同类别，做出不同的响应决策。

### Decision 3: zod schema 错误保持现状

zod schema 校验错误（如 `name: 123` 非字符串）仍由 MCP SDK 在 `registerTool` 层面拦截，我们的 handler 不会执行。

**Rationale:** 这是 caller agent 用错了 schema，是真正的契约错误。MCP SDK 返回的 `InvalidParams` 错误包含具体字段信息，比我们自己 catch 再包装更有价值。且这类错误不涉及 skill prompt 的丢失问题——zod 错误在业务逻辑执行前就拦截了。

## Risks / Trade-offs

- **[Risk]** agent 代码从 try/catch 模式切换为检查 `state.errors`，需要一定适应成本
  - **Mitigation:** 只有一个调用方（Claude Code harness），修改范围可控
- **[Risk]** `state.errors` 可能掩盖深层问题（agent 忽略错误继续执行）
  - **Mitigation:** prompt 本身已有 "pause on errors" 指导；agent 看到 errors 字段会按 prompt 指引 pause
- **[Trade-off]** 不再能通过 error code（`InvalidRequest`/`InternalError`）区分错误类别
  - **Mitigation:** `errors[].type` 字段保留了原始错误类型，信息量足够

## Migration Plan

1. 修改 `utils/state.ts`：新增 `runTool`
2. 修改 4 个 tool handler：改用 `runTool` 包裹业务逻辑
3. 更新 `fyllo-specs-mcp` spec：将"错误归一化"改为"错误内敛"
4. 更新测试：`tools.test.ts` 中断言 `rejects` 的 case 改为检查 `state.errors`
5. 验证：运行测试确保全部通过

## Open Questions

无

## 后续补充: `includeInstruction` 参数

### Decision: 可选参数控制 instruction 输出

四个 tool 统一增加可选参数 `includeInstruction?: boolean`，默认 `true`。当传 `false` 时，`runTool` 直接返回 `JSON.stringify(state)`，不包装 `<tool_instruction>` 与 `<state>` 标签。

**Rationale:**

- 当 agent 已熟悉工作流、多次调用同一 tool 时，重复返回大段 instruction 消耗冗余 token
- 默认值 `true` 保持向后兼容，不破坏现有调用方
- 由 agent 自主决定是否省略，server 不做任何缓存或状态跟踪

**实现位置:**

- `utils/state.ts`: `runTool` 增加 `options.includeInstruction`，条件分支输出
- 四个 tool handler: zod schema 均加 `includeInstruction: z.boolean().optional()`
- `__tests__/tools.test.ts`: 覆盖 `includeInstruction: false` 的正常路径与错误路径
