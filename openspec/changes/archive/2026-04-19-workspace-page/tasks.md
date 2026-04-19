## 1. Types and Store Foundation

- [x] 1.1 Create `src/types/workspace.ts` with all Workspace types (Project, Session, Message, FileNode, DiffLine, AgentStatus, etc.)
- [x] 1.2 Create `src/stores/workspace.ts` Pinia store with mock data for project, sessions, messages, file tree, and diff panel state
- [x] 1.3 Add store actions for session CRUD (create, select, rename, delete, archive) with mock implementations
- [x] 1.4 Add store actions for sending messages and simulating agent responses with state transitions

## 2. Layout Shell

- [x] 2.1 Create `src/components/workspace/AppHeader.vue` with project switcher trigger, theme toggle, token usage, and agent status
- [x] 2.2 Create `src/components/workspace/ProjectSwitcher.vue` dropdown with project list, new project, and settings options
- [x] 2.3 Create `src/components/workspace/ActivityBar.vue` with five icons (workspace, pipeline, plugins, history, settings) and tooltips
- [x] 2.4 Create `src/components/workspace/Sidebar.vue` container with Sessions/Files tab switching logic
- [x] 2.5 Create the Workspace page layout (`src/pages/workspace.vue` or update existing) wiring header, activity bar, sidebar, main area, and diff panel with responsive breakpoints

## 3. Sidebar Content

- [x] 3.1 Create `src/components/workspace/SessionList.vue` with "New Session" button, session items (title, time, turns, status dot), selection highlight, hover actions menu
- [x] 3.2 Create `src/components/workspace/FileTree.vue` with recursive tree rendering and session change markers (green/yellow/red)
- [x] 3.3 Implement empty state for SessionList when no sessions exist

## 4. Chat Area and Messages

- [x] 4.1 Create `src/components/workspace/ChatArea.vue` as scrollable message container
- [x] 4.2 Create `src/components/workspace/MessageUser.vue` for user message cards
- [x] 4.3 Create `src/components/workspace/MessageThinking.vue` with collapsible summary and expand behavior
- [x] 4.4 Create `src/components/workspace/MessageFileOp.vue` with operation icon, file path, change summary, and click-to-open-diff
- [x] 4.5 Create `src/components/workspace/MessageCommand.vue` with command text, expandable output, success/failure color indicators
- [x] 4.6 Create `src/components/workspace/MessageConfirm.vue` with description, Allow/Deny buttons, and auto-mode conditional rendering
- [x] 4.7 Create `src/components/workspace/MessageText.vue` with markdown rendering support
- [x] 4.8 Create a message dispatcher component that renders the correct message type based on message kind

## 5. Input and Agent Controls

- [x] 5.1 Create `src/components/workspace/InputBar.vue` with multi-line textarea (Shift+Enter newline, Enter send), send button, and attachment entry
- [x] 5.2 Add file attachment preview in input area
- [x] 5.3 Create function bar above input with agent name display (clickable to switch) and Auto/Manual toggle
- [x] 5.4 Wire input submission to store action and update message stream

## 6. Diff Panel

- [x] 6.1 Create `src/components/workspace/DiffPanel.vue` with collapsible behavior, right-edge handle, file path header, and close button
- [x] 6.2 Implement side-by-side and inline diff rendering modes with toggle
- [x] 6.3 Add file selector dropdown/tab bar for multiple changed files
- [x] 6.4 Wire diff panel open triggers (file operation card click, file tree click, manual handle)

## 7. Integration and Polish

- [x] 7.1 Connect all components to workspace store and verify data flow
- [x] 7.2 Implement responsive behavior: diff panel overlay at <1280px, sidebar collapsible at <1024px
- [x] 7.3 Verify all components use Nuxt UI semantic colors (primary, secondary, etc.) with no hardcoded colors
- [x] 7.4 Verify all icons use lucide-vue-next
- [x] 7.5 Verify light/dark theme compatibility across all components
- [x] 7.6 Add navigation from welcome page project entry to workspace page
