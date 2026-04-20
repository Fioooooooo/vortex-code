## 1. Chat Sidebar Refactor

- [x] 1.1 Replace manual tab buttons with `UTabs` in `frontend/src/components/chat/Sidebar.vue`
- [x] 1.2 Configure `UTabs` with `variant="link"` and `ui` overrides to match existing styles
- [x] 1.3 Wire `UTabs` to `chatStore.sidebarTab` via `:model-value` + `@update:model-value`

## 2. Pipeline Sidebar Refactor

- [x] 2.1 Replace manual tab buttons with `UTabs` in `frontend/src/components/pipeline/PipelineSidebar.vue`
- [x] 2.2 Configure `UTabs` with `variant="link"` and `ui` overrides to match existing styles
- [x] 2.3 Wire `UTabs` to `pipelineStore.sidebarTab` via `:model-value` + `@update:model-value`

## 3. Verification

- [x] 3.1 Run typecheck and verify no TypeScript errors in modified components
- [x] 3.2 Verify `/chat` sidebar tabs use `UTabs` with `variant="link"`
- [x] 3.3 Verify `/pipeline` sidebar tabs use `UTabs` with `variant="link"`
