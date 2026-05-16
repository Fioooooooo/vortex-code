## 1. Proposal 详情页迁移到 MarkStream

- [x] 1.1 修改 `frontend/src/components/proposal/ProposalMarkdownContent.vue`：移除 `import ChatComark from "@renderer/components/chat/ChatComark"`，改为 `import MarkStream from "@renderer/components/shared/MarkStream.vue"`
- [x] 1.2 将模板中 `<ChatComark :markdown="activeContent" />` 替换为 `<MarkStream :content="activeContent" :is-streaming="false" />`，保持外层 `prose` 容器结构不变
- [x] 1.3 手动检查 Proposal 详情页的 proposal / design / tasks tab 切换时 markdown 渲染正常（标题、列表、代码块、表格等）

## 2. UIMessageList 清理过渡期遗留

- [x] 2.1 在 `frontend/src/components/shared/UIMessageList.vue` 中删除被注释的 `import ChatComark` 语句（line 7）
- [x] 2.2 删除模板内两处 `<!-- <ChatComark .../> -->` 注释（reasoning 分支与 assistant text part 分支）
- [x] 2.3 确认 `MarkStream` 调用保留：reasoning part 传 `:content="part.text" :is-streaming="isPartStreaming(part)"`；assistant text part 同样传值

## 3. 移除旧组件

- [x] 3.1 删除文件 `frontend/src/components/chat/ChatComark.ts`
- [x] 3.2 执行 `grep -rn "ChatComark" frontend/ electron/` 确认无残留引用（含字符串）

## 4. 更新测试 stub

- [x] 4.1 修改 `frontend/src/__tests__/components/shared/ui-message-list.spec.ts` 中 `mountList` 的 `global.stubs`，将 `ChatComark` 条目替换为 `MarkStream`，stub props 改为 `["content", "isStreaming"]`，template 改为 `<div data-test="markdown">{{ content }}</div>`
- [x] 4.2 复查 spec 中 `renders text parts` 用例：断言 `wrapper.text()` 包含消息文本仍然成立
- [x] 4.3 运行 `pnpm test` 确认全部测试通过

## 5. 清理依赖

- [x] 5.1 在仓库根执行 `pnpm remove @comark/vue shiki` 移除主包与原本仅为满足其 peer 依赖才声明的 `shiki`（说明：旧 `ChatComark.ts` 中的 `@shikijs/langs/<lang>` 形式是 `@shikijs/langs` 包的子路径导入，不是 `package.json` 顶层条目，无需单独 `pnpm remove`；它会随 `shiki` / `@comark/vue` 的 lock 失效而被 pnpm 清出 `pnpm-lock.yaml`）
- [x] 5.2 提交后 `git diff package.json pnpm-lock.yaml` 复核：确认 `@comark/vue`、`shiki` 与传递性的 `@shikijs/*` 解析条目不再出现，且 `markstream-vue` 保留

## 6. 同步 spec 文案

- [x] 6.1 按本 change 的 `specs/chat-interface/spec.md` MODIFIED 内容，在 archive 阶段由工具同步到 `openspec/specs/chat-interface/spec.md`（实施阶段无需手工编辑主 spec）
- [x] 6.2 实施阶段确认 `openspec validate replace-markdown-renderer` 通过

## 7. 验证

- [x] 7.1 执行 `pnpm typecheck` 通过
- [x] 7.2 执行 `pnpm lint` 通过
- [x] 7.3 执行 `pnpm test` 通过（预存的 `chat-container.spec.ts > renders an inline stream error after the message list` 失败在 main HEAD 上同样存在，与本次替换无关，需另开 change 处理）
- [x] 7.4 执行 `pnpm dev`，分别在 Chat 主区域（触发 assistant 流式回复，含代码块、列表、表格、reasoning part）与 Proposal 详情页（切换三个 tab）人工目检 markdown 渲染结果与流式打字机效果
- [x] 7.5 `.openspec.yaml` 的 `status` 在实施开始时已切换为 `applying`
