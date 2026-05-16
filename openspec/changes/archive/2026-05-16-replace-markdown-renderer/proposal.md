## Why

测试发现当前 markdown 渲染器 `@comark/vue` 在流式回复场景下存在严重问题，无法继续满足 Chat 与 Proposal 详情页对 markdown 渲染的稳定性需求。新的 `markstream-vue` 已完成集成与功能验证，需要执行一次彻底替换，统一渲染通路并清理旧依赖，避免遗留两套并存。

## What Changes

- **BREAKING**（实现层）：渲染进程的 markdown 渲染器从 `@comark/vue` 切换为 `markstream-vue`，通过 `frontend/src/components/shared/MarkStream.vue` 作为统一封装组件对外暴露。
- Chat 主区域（`UIMessageList.vue` 中 assistant text part 与 reasoning part）改用 `MarkStream` 渲染，清理过渡期遗留的 `ChatComark` 注释代码。
- Proposal 详情页（`ProposalMarkdownContent.vue` 中 proposal/design/tasks tab）改用 `MarkStream` 渲染，传入 `isStreaming=false` 走非流式分支。
- 删除旧组件 `frontend/src/components/chat/ChatComark.ts`。
- 移除 `@comark/vue` 与仅服务于 `ChatComark` 的 `@shikijs/langs/*` 各语言包依赖（html / css / python / sql / go / rust / java / c / cpp / ruby / php / swift / kotlin / diff / dockerfile / xml / toml / graphql）。代码高亮改为完全依赖 `markstream-vue` 默认能力，不再手动维护语言清单。
- 更新 `frontend/src/__tests__/components/shared/ui-message-list.spec.ts`，把测试中针对 `ChatComark` 的 stub 替换为针对 `MarkStream` 的 stub。
- 修订 `chat-interface` spec 中对 `ChatComark` 的具体点名，使表述抽象到"markdown 渲染组件"层面，避免 spec 与具体实现耦合。

## Capabilities

### New Capabilities

- _(无新能力引入)_

### Modified Capabilities

- `chat-interface`：调整"Chat 主区域与 Proposal SidePanel 共享 UIMessage 列表组件"requirement 中点名 `ChatComark` 的表述，使 markdown 渲染子组件抽象为"统一 markdown 渲染组件"，避免 spec 强绑定特定实现。

> Proposal 详情页相关的 `proposal-detail` spec 现有 requirement 不点名具体组件，仅要求"对应 markdown 文件内容以渲染格式展示"，本次替换不引入 requirement 级行为变化，**不**列入 Modified Capabilities。

## Impact

- **代码**：
  - 修改：`frontend/src/components/shared/UIMessageList.vue`、`frontend/src/components/proposal/ProposalMarkdownContent.vue`、`frontend/src/__tests__/components/shared/ui-message-list.spec.ts`。
  - 删除：`frontend/src/components/chat/ChatComark.ts`。
  - 已存在：`frontend/src/components/shared/MarkStream.vue`（封装组件，无需新增）。
- **依赖**（`package.json`）：移除 `@comark/vue`、`@shikijs/langs/html` 等共 18 个 `@shikijs/langs/*` 子包；保留并依赖 `markstream-vue`。
- **用户可见行为**：markdown 渲染观感细节（流式打字机效果、代码高亮、表格等）会发生变化，但功能保持等价（标题、列表、代码块、行内格式仍按 markdown 语义渲染）。
- **spec**：仅 `chat-interface` 文案级修订；`proposal-detail` 不动。
- **风险**：
  - 个别 markdown 语法在新渲染器下的呈现差异需通过手动 chat / proposal 详情页双路径验证。
  - `markstream-vue` 当前版本为 `0.0.14-beta.8`，仍在 beta，需关注后续小版本兼容性。
