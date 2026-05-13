## 1. 前端代码清理

- [x] 1.1 删除 `frontend/src/components/integration/CustomIntegrationSection.vue` 文件
- [x] 1.2 在 `frontend/src/pages/integration.vue` 中移除 `CustomIntegrationSection` 的 import 与 template 中 `<CustomIntegrationSection />` 使用
- [x] 1.3 在 `frontend/src/api/integration.ts` 中移除 `CustomIntegration` 类型 import、`listCustom` 方法以及自定义集成保存相关方法
- [x] 1.4 全局搜索 `CustomIntegration|customIntegration|自定义集成|高级 — 自定义集成` 确保无残留引用

## 2. Preload 与共享类型清理

- [x] 2.1 在 `electron/preload/api/integration.ts` 中移除 `CustomIntegration` import、`listCustom` 与自定义集成保存方法，更新 contextBridge 暴露的 integration API 类型
- [x] 2.2 在 `shared/types/integration.ts` 中删除 `CustomIntegration` 接口定义及其相关导出
- [x] 2.3 全局搜索 `CustomIntegration` 类型引用，确认无遗漏

## 3. 文档清理

- [x] 3.1 在 `docs/DataModel.md` 中删除 `CustomIntegration` 数据结构描述及相关段落
- [x] 3.2 复核 `docs/IPC.md`、`docs/RendererProcess.md`、`docs/MainProcess.md`，移除任何提及"自定义集成"的句段（若存在）

## 4. 验证

- [x] 4.1 运行 `pnpm typecheck`：确保前端、preload、共享类型在删除后仍通过类型检查
- [x] 4.2 运行 `pnpm lint`：处理因删除残留的 import / 未使用变量告警
- [ ] 4.3 运行 `pnpm test`：确保现有单测全部通过；如有针对 `CustomIntegrationSection` 或 `listCustom` 的测试，一并删除
- [ ] 4.4 `pnpm dev` 手动检查：进入 /integration 页面，确认页面底部不再出现"高级 — 自定义集成"折叠区块，整体布局自然收尾
