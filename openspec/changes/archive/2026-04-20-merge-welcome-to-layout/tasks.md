## 1. Create WelcomeView Component

- [x] 1.1 Create `frontend/src/components/WelcomeView.vue` by extracting content from `pages/welcome.vue`
- [x] 1.2 Remove page-level full-screen wrapper styles (h-screen, flex centering), adapt to layout content area
- [x] 1.3 Preserve all functionality: Open Folder, Create Project, Recent Projects list, CreateProjectModal

## 2. Reorganize Page Files

- [x] 2.1 Move `pages/index/workspace.vue` → `pages/workspace.vue`
- [x] 2.2 Move `pages/index/pipeline.vue` → `pages/pipeline.vue`
- [x] 2.3 Move `pages/index/integration.vue` → `pages/integration.vue`
- [x] 2.4 Move `pages/index/setting.vue` → `pages/settings.vue`
- [x] 2.5 Delete `pages/welcome.vue`
- [x] 2.6 Delete `pages/index/index.vue`

## 3. Update Layout Parent Page

- [x] 3.1 Modify `pages/index.vue`: add `hasCurrentProject` conditional rendering (WelcomeView vs RouterView)
- [x] 3.2 Remove or simplify route guard watchEffect (no more /welcome redirect needed)
- [x] 3.3 Add `onMounted` redirect: `/` → `/workspace` when project exists

## 4. Update Navigation Links

- [x] 4.1 Update `components/layout/ActivityBar.vue`: `/setting` → `/settings`, keep `/workspace`, `/pipeline`, `/integration`
- [x] 4.2 Update `components/layout/ActivityBar.vue`: disable project-scoped nav items when no project
- [x] 4.3 Update `components/layout/AppHeader.vue`: project dropdown redirect to `/workspace`
- [x] 4.4 Update `components/workspace/ProjectSwitcher.vue`: switch project redirect to `/workspace`
- [x] 4.5 Update `components/workspace/ProjectSwitcher.vue`: "New Project" clears current project instead of routing to `/welcome`
- [x] 4.6 Update `components/CreateProjectModal.vue`: redirect to `/workspace` after creation

## 5. Update Store (if needed)

- [x] 5.1 Check if `projectStore` has `clearCurrentProject()` method; add if missing

## 6. Regenerate Types and Verify

- [x] 6.1 Clear Vite cache and restart dev server to regenerate `typed-router.d.ts`
- [x] 6.2 Run typecheck (`vue-tsc --noEmit`) to verify no type errors
- [x] 6.3 Verify no compilation errors

## 7. Manual Testing

- [ ] 7.1 Test: Open app with no project → WelcomeView shows inside layout (header + sidebar visible)
- [ ] 7.2 Test: Click "Open Folder" → project opens, workspace displays without page jump
- [ ] 7.3 Test: Click "Create Project" → modal opens, after creation workspace displays
- [ ] 7.4 Test: Click recent project → workspace displays
- [ ] 7.5 Test: Sidebar navigation between workspace/pipeline/integration works
- [ ] 7.6 Test: Settings page at `/settings` works with and without project
- [ ] 7.7 Test: ProjectSwitcher "New Project" returns to WelcomeView without route jump
- [ ] 7.8 Test: Theme toggle works in WelcomeView state
