## 1. Type Definitions and Store Foundation

- [x] 1.1 Create `src/types/pipeline.ts` with all Pipeline-related types (PipelineRun, PipelineTemplate, PipelineStage, StageType, StageStatus, GateCondition, FailureStrategy, ReviewComment, TestResult, DeployLog, etc.)
- [x] 1.2 Create `src/stores/pipeline.mock.ts` with mock data generators for runs, templates, and stages
- [x] 1.3 Create `src/stores/pipeline.ts` Pinia store with state (runs, templates, selectedRunId, selectedTemplateId, sidebarTab) and actions (createRun, selectRun, selectTemplate, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, approveGate, rejectGate, rerunStage, skipStage, forcePassStage)

## 2. Pipeline Page Shell and Left Sidebar

- [x] 1.4 Create `src/components/pipeline/PipelineSidebar.vue` with tab switcher (Runs / Templates) matching Workspace Sidebar style
- [x] 1.5 Create `src/components/pipeline/RunList.vue` for the Runs tab (New Run button, run record list with status indicator, pulsing dot for running records)
- [x] 1.6 Create `src/components/pipeline/TemplateList.vue` for the Templates tab (New Template button, Built-in / Custom grouping, template cards with hover actions)
- [x] 1.7 Create `src/components/pipeline/NewRunModal.vue` modal for template selection and trigger description input
- [x] 1.8 Update `pages/index/pipeline.vue` to integrate PipelineSidebar and central main area with empty state

## 3. Stage Flow Visualization

- [x] 1.9 Create `src/components/pipeline/StageFlow.vue` horizontal progress bar component with stage nodes and connecting lines
- [x] 1.10 Create `src/components/pipeline/StageNode.vue` individual stage node component with all status variants (passed, running, failed, skipped, waiting-approval, pending) and Approve/Reject actions
- [x] 1.11 Create `src/components/pipeline/StageConnector.vue` connecting line component with status-aware styling (solid/dashed, color, animation)
- [x] 1.12 Create `src/components/pipeline/GateMarker.vue` diamond gate marker with tooltip showing condition description

## 4. Run Detail View and Stage Details

- [x] 1.13 Create `src/components/pipeline/RunDetailView.vue` as the container for run detail (StageFlow + stage detail area)
- [x] 1.14 Create `src/components/pipeline/StageDetailLayout.vue` unified layout framework with title bar (name, status badge, duration, tokens, action buttons)
- [x] 1.15 Create `src/components/pipeline/DiscussStageDetail.vue` conversation thread + summary card for discuss stage
- [x] 1.16 Create `src/components/pipeline/CodeStageDetail.vue` execution cards + expandable file change list with inline diff
- [x] 1.17 Create `src/components/pipeline/TestStageDetail.vue` test result summary + failure details + auto-repair log
- [x] 1.18 Create `src/components/pipeline/ReviewStageDetail.vue` review comment cards with category/severity badges
- [x] 1.19 Create `src/components/pipeline/DeployStageDetail.vue` log stream + target info + result + verification

## 5. Template Editor

- [x] 1.20 Create `src/components/pipeline/TemplateEditor.vue` container with name/description inputs, stage list, and save/cancel actions
- [x] 1.21 Create `src/components/pipeline/StageEditorRow.vue` collapsed stage row with drag handle, type selector, name input, expand toggle, and delete button
- [x] 1.22 Create `src/components/pipeline/StageEditorExpanded.vue` expanded configuration panel (Prompt textarea with variable highlighting, Agent selector, Gate conditions list with add/remove, Failure strategy selector, MCP/Skills checkboxes)
- [x] 1.23 Implement stage drag-and-drop reordering using native HTML5 DnD API
- [x] 1.24 Implement "+ Add Stage" button and default stage initialization
- [x] 1.25 Implement save logic: built-in templates save as custom copy, custom templates update in place

## 6. Empty State and Polish

- [x] 1.26 Create `src/components/pipeline/PipelineEmptyState.vue` with contextual guidance ("Create your first pipeline template" / "Start a new run" or template-aware messaging)
- [x] 1.27 Wire up all central area content states: Run Detail, Template Editor, Empty State based on store selection
- [x] 1.28 Implement simulated real-time run progress updates via store interval
- [x] 1.29 Verify all components use `@nuxt/ui` native components and semantic colors (primary, secondary, success, warning, error, neutral, muted)
- [x] 1.30 Verify all icons use lucide (`i-lucide-*`) and no hardcoded color values exist
