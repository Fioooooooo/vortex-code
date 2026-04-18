## 1. Type Definitions

- [x] 1.1 Create `src/types/project.ts` with `ProjectInfo`, `RecentProject`, `CreateProjectForm` interfaces
- [x] 1.2 Create `src/types/welcome.ts` with welcome page related types

## 2. Pinia Store

- [x] 2.1 Create `src/stores/welcome.ts` with `useWelcomeStore`
- [x] 2.2 Implement `recentProjects` state with mock data (8-10 items)
- [x] 2.3 Implement `openFolder` action (mock async)
- [x] 2.4 Implement `createProject` action (mock async)
- [x] 2.5 Implement `openRecentProject` action
- [x] 2.6 Implement `removeRecentProject` action
- [x] 2.7 Implement `showCreateProjectModal` state and toggle action

## 3. Welcome Page Component

- [x] 3.1 Create `src/pages/WelcomePage.vue`
- [x] 3.2 Implement brand identity section (logo + name + tagline)
- [x] 3.3 Implement action buttons section (Open Folder + Create Project)
- [x] 3.4 Implement recent projects list with scrollable container
- [x] 3.5 Implement empty state for no recent projects
- [x] 3.6 Implement list item hover highlighting and remove button
- [x] 3.7 Implement relative time display using VueUse `useTimeAgo`
- [x] 3.8 Wire all interactions to welcome store actions

## 4. Create Project Modal

- [x] 4.1 Create `src/components/CreateProjectModal.vue`
- [x] 4.2 Implement project name input with validation
- [x] 4.3 Implement storage path input with default value
- [x] 4.4 Implement template selection (Empty Project / Clone from Git)
- [x] 4.5 Implement conditional git URL input
- [x] 4.6 Implement create button with form validation
- [x] 4.7 Wire modal to welcome store

## 5. Integration

- [x] 5.1 Update root layout/App to conditionally render WelcomePage vs Workspace
- [x] 5.2 Verify all store actions are properly typed
- [x] 5.3 Run type check and lint
