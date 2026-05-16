## Context

当前渲染进程通过 `frontend/src/components/chat/ChatComark.ts`（基于 `@comark/vue`，挂载 `@shikijs/langs/*` 18 个语言包）渲染 markdown，使用方有两处：

- `frontend/src/components/shared/UIMessageList.vue`：Chat 主区域 assistant text part 与 reasoning part。
- `frontend/src/components/proposal/ProposalMarkdownContent.vue`：Proposal 详情页 proposal / design / tasks tab 静态 markdown。

在测试中发现 `@comark/vue` 在流式回复场景下存在严重问题，已无法继续使用。`markstream-vue@0.0.14-beta.8` 已加入 `package.json`，并完成 PoC 验证；新封装组件 `frontend/src/components/shared/MarkStream.vue` 已落地。`UIMessageList.vue` 已切换到 `MarkStream`，但留下 `ChatComark` 的注释代码作为过渡。`ProposalMarkdownContent.vue` 还未迁移。

`openspec/specs/chat-interface/spec.md` 中"Chat 主区域与 Proposal SidePanel 共享 UIMessage 列表组件"requirement 直接点名 `ChatComark`，与即将下线的实现耦合，需同步修订。`openspec/specs/proposal-detail/spec.md` 仅要求"以渲染格式展示"，不点名具体组件。

## Goals / Non-Goals

**Goals:**

- 用 `markstream-vue` 完全替换 `@comark/vue`，渲染进程 markdown 渲染统一通过 `frontend/src/components/shared/MarkStream.vue` 进入。
- 清理过渡期遗留：删除 `ChatComark.ts`、清除 `UIMessageList.vue` 中的旧调用注释、移除 `@comark/vue` 与 `@shikijs/langs/*` 相关依赖。
- 解除 spec 与具体实现名 `ChatComark` 的耦合，让 chat-interface spec 可以容纳后续渲染器演进而不必再次修订。

**Non-Goals:**

- 不重新实现或扩展 markdown 渲染能力（数学公式、Mermaid 等），完全沿用 `markstream-vue` 默认能力。
- 不维护 `@shikijs/langs/*` 风格的"手动语言白名单"，代码高亮范围由 `markstream-vue` 默认决定，不在本变更中调优。
- 不引入新的功能性 requirement / scenario：proposal-detail spec 不修订；chat-interface spec 仅做"实现名 → 抽象描述"的措辞调整。
- 不调整 Chat 与 Proposal 之外的 markdown 渲染入口（目前没有第三处使用，本变更结束后 `MarkStream` 是唯一渲染入口）。

## Decisions

### 决策 1：以 `MarkStream.vue` 作为统一封装，而非各使用方直接引入 `markstream-vue`

`MarkStream.vue` 已封装 `markstream-vue` 的 props（`content`、`final`、`max-live-nodes`、`batch-rendering`、`render-batch-size`、`render-batch-delay`、`render-batch-budget-ms`、`fade`、`typewriter`、`smooth-streaming`），对外仅暴露 `content: string` 与 `isStreaming: boolean`。

**理由**：

- 把 `markstream-vue` 当前 beta 版本的 API 细节封死在一个文件内，未来升级或再次替换只改一处。
- Chat 主区域与 Proposal 详情页对"流式 / 非流式"的需求语义清晰，仅靠 `isStreaming` 区分足够，调用方不需要感知 typewriter / smooth-streaming 等渲染策略。
- 与 chat-interface spec 即将放宽的"统一 markdown 渲染组件"措辞匹配。

**备选方案**：各使用方直接 `import MarkdownRender from "markstream-vue"`，自己传参。**不采用**：会让流式/非流式策略散落，且 `markstream-vue` props 较多，存在调用方写错的风险。

### 决策 2：通过 `isStreaming` 单参数驱动流式 / 非流式分支

`MarkStream.vue` 根据 `isStreaming` 切换：

- `isStreaming=true`：启用 typewriter + smooth-streaming + 限制 max-live-nodes，呈现打字机式增量效果。
- `isStreaming=false`：关闭 typewriter / smooth-streaming，启用 fade，完整一次性渲染。

**理由**：

- 调用方语义最小化：Chat 流式回复传 `isPartStreaming(part)`，Proposal 详情页静态 markdown 传 `false`，无需理解底层渲染参数。
- 流式行为细节（典型如 `render-batch-size: 16` / `render-batch-delay: 8` / `render-batch-budget-ms: 4`）作为实现调优保留在组件内部，**不写入 spec**。后续如果调整数值，无需 spec 同步。

### 决策 3：代码高亮完全依赖 `markstream-vue` 默认能力，不再维护手动语言清单

旧实现通过 `@shikijs/langs/<lang>` 显式注册了 18 种语言（html / css / python / sql / go / rust / java / c / cpp / ruby / php / swift / kotlin / diff / dockerfile / xml / toml / graphql）。

**理由**：

- `markstream-vue` 默认已集成代码高亮，新增语言成本低，无须自维护白名单。
- 用户场景以"AI 输出的代码块"为主，对高亮命中率有容忍度，缺失语言以纯文本展示即可，可接受。
- 维护手动清单会延续旧实现的负担，并增大依赖体积。

**备选方案**：把这 18 个 `@shikijs/langs/*` 移植到新封装组件。**不采用**：与"完全依赖默认能力"目标冲突，且增加 `markstream-vue` 版本兼容风险。

### 决策 4：proposal-detail spec 不变，chat-interface spec 仅做点名表述抽象

按 `guidelines/OpenSpec.md`，"实现方式变了但功能定义没变"通常不需要 OpenSpec change。本变更对 proposal-detail 是纯实现替换：spec 没点名 `ChatComark`，requirement / scenario 行为不变。但 chat-interface spec 字面上写了 "`ChatComark`"，这是 spec 与实现耦合的轻度缺陷，借本次替换一并修订，把表述抽象为"统一 markdown 渲染组件"。

**理由**：

- 修订是文案级，不改 SHALL 语义，不引入新 scenario。
- 后续若再升级 markdown 渲染器，chat-interface spec 不需要再修订。

### 决策 5：依赖移除与构建验证顺序

依赖移除步骤：

1. 先在源代码中完成所有 `ChatComark` → `MarkStream` 替换并删除 `ChatComark.ts`。
2. 再执行依赖卸载（`pnpm remove @comark/vue @shikijs/langs` + 18 个 `@shikijs/langs/<lang>` 子包）。
3. 最后跑 `pnpm typecheck` + `pnpm test` + `pnpm dev`（手动验证 Chat 流式与 Proposal 详情页）。

**理由**：先去引用再卸依赖，避免 typecheck 报"找不到模块"的中间不一致态。

## Risks / Trade-offs

- **Risk**：`markstream-vue@0.0.14-beta.8` 仍在 beta，可能在 PR 完成后短期内有破坏性更新。→ **Mitigation**：在 `MarkStream.vue` 中集中封装；版本固定为 `0.0.14-beta.8`（已是 `package.json` 当前值，不带 `^`），升级需显式触发并人工验证。
- **Risk**：默认代码高亮覆盖语言可能少于旧手动清单中的部分冷门语言（如 toml / kotlin / swift），出现"高亮丢失"。→ **Mitigation**：以纯文本块呈现，仍可读；如出现高频用户场景遗漏，后续单开 change 调优。
- **Risk**：markdown 渲染视觉细节（间距、表格边框、代码块字体等）与 `@comark/vue` 有差异，可能影响 Proposal 详情页阅读体验。→ **Mitigation**：在本变更落地 PR 中提供 Chat 与 Proposal 详情页的截图人工对比；必要时通过 `MarkStream.vue` 的 scoped style 微调。
- **Trade-off**：spec 与实现解耦的抽象表述（"统一 markdown 渲染组件"）会让 spec 不再直接告诉读者"组件叫什么名字"。→ **Mitigation**：仍保留对组件职责的描述（如 markdown 语义、流式 part 支持），可读性可接受。
