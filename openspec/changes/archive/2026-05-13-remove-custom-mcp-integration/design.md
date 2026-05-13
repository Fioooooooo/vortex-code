## Context

`integration-custom-mcp` capability 在 `2026-04-19-integrations-page` 这次 change 中作为"高级扩展位"引入到 /integration 页面底部，但只完成了前端骨架（`CustomIntegrationSection.vue` 和 preload 占位 API）；主进程从未注册任何对应的 IPC 处理器，因此即使用户填写并点击"保存配置"，也不会有任何持久化或运行时效果——是一个"按下不响"的入口。

与此同时，`separate-provider-credentials-and-project-integration` 正在重构 /integration 的整体心智：settings 管全局凭证、/integration 管项目级资源挂载，每张卡片背后都是某个 provider manifest。Custom MCP 的语义不属于上述任何一层：它既不是 provider（无凭证字段、无 manifest），也不是某阶段下的资源（与 stage 概念正交）。如果保留，会让用户在一个本应概念清晰的页面里看到一个不属于这套模型的角落。

考虑到产品未公开发布、链路尚未打通、未来的扩展点形态尚未确定，本次直接撤回该 capability 与对应代码，是最干净的处理方式。

## Goals / Non-Goals

**Goals:**

- 从 /integration 页面、前端 API 封装、preload API、共享类型与文档中彻底删除"自定义集成（Custom MCP）"相关代码与描述。
- 撤回 `integration-custom-mcp` capability 与其下全部 requirement，使 openspec 中不再保留这条规范。
- 降低后续 integration 主链路重构（`separate-provider-credentials-and-project-integration`）的认知干扰与代码维护负担。

**Non-Goals:**

- 不设计、不实现新的扩展点替代方案。
- 不改动其他 integration 相关 capability（providers、tool-registry、connection-management、project-enablement、config-panel）。
- 不做数据迁移、清理脚本或回滚开关：链路未打通，userData 下基本不存在 Custom MCP 数据。

## Decisions

### D1：直接删除而非"暂时隐藏"

可能的替代方案是用 feature flag 或 `v-if="false"` 隐藏 `CustomIntegrationSection`，保留代码备用。否决理由：

- 链路本就未打通，"备用"价值为零；
- 重新引入时大概率不会沿用现有占位代码（新模型应嵌入 provider manifest 或独立设置页），保留旧代码反而会误导后续设计；
- 隐藏代码长期不被执行，会随主链路演进逐渐失效（类型变更、依赖升级），最终仍要重写。

### D2：撤回 capability，后续若重新引入则建立新 capability

可选项是保留 `integration-custom-mcp` capability 的目录结构、仅在 spec 文件中删除 requirement。否决理由：

- 当前 capability 命名（`integration-custom-mcp`）将"自定义"绑定到 MCP 协议；未来再引入扩展能力可能不局限于 MCP（例如基于 provider manifest 的扩展、基于 Skill 的扩展），此命名会形成路径锁定；
- openspec 工作流允许后续以新名字（如 `integration-extensibility`、`integration-plugins` 等）重新建立 capability，更利于反映新形态。

### D3：preload 删除 API 而非保留 stub

`electron/preload/api/integration.ts` 中的 `listCustom` 在主进程从未注册处理器，调用时 IPC 调用栈会落到 fallback。删除该方法虽然在 TypeScript 层面是"破坏性"变更，但因为现网无任何已发布版本依赖、运行时也已经在错——删除让契约真实反映能力，避免误导调用方。

## Risks / Trade-offs

- **Trade-off**：`integration-custom-mcp` capability 撤回后，"未来如何承接用户自定义扩展"的产品诉求暂时无人回答。
  → Mitigation：本次 change 在 proposal 中明确列出 Out of scope，记录"待 integration 主链路稳定后由新 change 重新引入"；后续启动相关讨论时，将以全新的 capability 名重新建立规范，而不是复活 `integration-custom-mcp`。
- **Risk**：与 `separate-provider-credentials-and-project-integration` 的实施时序耦合——后者的 tasks 中 8.3 提到"在 custom-mcp 入口附近做一次 UI 复核"。
  → Mitigation：本次 change 落地后，对方 change 中该任务自然失效；建议两者按"先合本 change，再合 integration 重构"的顺序推进，或在合并时由实施方主动剔除该任务。
- **Risk**：开发机或测试环境若曾经手工创建过 Custom MCP 相关的 userData 文件，删除前端入口后会变成"孤儿数据"。
  → Mitigation：目前未观察到主进程产出此类文件。即便存在，也不会被任何代码读取，无运行时影响；如开发者介意可手动清理。
