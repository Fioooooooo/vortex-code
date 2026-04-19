## 1. Types and Store Foundation

- [x] 1.1 Create `src/types/integration.ts` with all integration types (IntegrationTool, IntegrationCategory, ConnectionType, ConnectionStatus, ToolConfig, ProjectToolConfig, etc.)
- [x] 1.2 Create `src/stores/integration.mock.ts` with mock data for 6 categories and all MVP/coming-soon tools
- [x] 1.3 Create `src/stores/integration.ts` Pinia store with state (tools, connections, filter/search), getters (filteredTools, connectedTools, enabledTools), and actions (connectTool, disconnectTool, testConnection, enableToolInProject, disableToolInProject, updateToolConfig, updateProjectToolConfig)

## 2. Routing and Navigation Updates

- [x] 2.1 Update `src/components/layout/ActivityBar.vue`: change Extension nav item to Integrations, update route to `/integration`, change activeItem matching
- [x] 2.2 Update `src/pages/index.vue`: update `protectedRoutes` to include `/integration`, update `activeItem` computed to handle `/integration`

## 3. Core Components

- [x] 3.1 Create `src/components/integration/IntegrationToolCard.vue` — card front face with logo, name, description, connection status badge, project enablement area, click-to-expand behavior
- [x] 3.2 Create `src/components/integration/IntegrationToolCardExpand.vue` — expanded configuration panel with Account Connection, Tool Parameters, and Project Configuration sections
- [x] 3.3 Create `src/components/integration/IntegrationCategorySection.vue` — category title, description, and responsive grid of tool cards
- [x] 3.4 Create `src/components/integration/IntegrationSearchFilter.vue` — search input and filter dropdown (All / Connected / Enabled in Project)
- [x] 3.5 Create `src/components/integration/CustomIntegrationSection.vue` — collapsed "Advanced" link at page bottom, expandable MCP server / custom skill configuration form

## 4. Page Implementation

- [x] 4.1 Rewrite `src/pages/index/integration.vue` with full layout: max-width container (~960px), search/filter header, category sections, custom integration footer
- [x] 4.2 Wire up store to page: bind search/filter state, render categories from store, handle card expand/collapse
- [x] 4.3 Implement responsive grid behavior for tool cards (2-3 per row based on breakpoint)

## 5. Connection Management UI

- [x] 5.1 Implement API Token connection form in expanded panel: dynamic form fields based on tool config, helper text, help links, Test Connection button with loading state
- [x] 5.2 Implement OAuth connection simulation: Connect with {Provider} button, loading state, simulated callback, state update
- [x] 5.3 Implement connected state display: account/org summary, Disconnect button with confirmation behavior

## 6. Tool Parameters and Project Configuration

- [x] 6.1 Implement Tool Parameters section with tool-specific forms: Codeup (org selector, branch naming), Flow (template selector, trigger config), Alibaba Cloud (region, instance, env), DingTalk (webhook URL, event checkboxes)
- [x] 6.2 Implement Project Configuration section: conditional visibility (only when tool enabled in project), section title with project name, override fields
- [x] 6.3 Implement form save actions: update store state, show success feedback

## 7. Polish and Edge Cases

- [x] 7.1 Implement Coming Soon styling: reduced opacity, non-interactive, Coming Soon badge
- [x] 7.2 Add expand/collapse transition animation for tool cards
- [x] 7.3 Verify all nuxt/ui components use semantic colors (primary, secondary, neutral, success, error, warning), no hardcoded colors
- [x] 7.4 Verify all icons use lucide (`i-lucide-*`), including search, filter, check, disconnect, settings, puzzle, etc.
- [x] 7.5 Verify dark/light theme compatibility across all new components
