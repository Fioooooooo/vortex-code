## 1. Registry & Composable

- [x] 1.1 Create `frontend/src/config/activity-bar.ts` with `ActivityBarItem` interface and `activityBarItems` array (top + bottom items, `isDefault: true` on task entry, dev assert for uniqueness)
- [x] 1.2 Create `frontend/src/composables/useDefaultAppRoute.ts` with `defaultPath` computed and `goToDefault()` action

## 2. Refactor ActivityBar

- [x] 2.1 Import `activityBarItems` into `ActivityBar.vue`, replace hard-coded `items`/`bottomItems` with filtered computed from registry
- [x] 2.2 Replace `activeItem` 6-line `if/startsWith` with longest-prefix match from registry; return `null` on no match instead of fallback to `"task"`
- [x] 2.3 Verify ActivityBar renders correctly and all menu items remain clickable with correct `:to`

## 3. Replace Default-Page Hardcoding

- [x] 3.1 Replace `router.push("/task")` in `WelcomeView.vue:15` with `goToDefault()`
- [x] 3.2 Replace `router.push("/task")` in `WelcomeView.vue:22` with `goToDefault()`
- [x] 3.3 Replace `router.push("/task")` in `AppHeader.vue:29` with `goToDefault()`
- [x] 3.4 Replace `router.replace("/chat")` in `index.vue:23` with `useDefaultAppRoute().goToDefault()`
- [x] 3.5 Verify `task.vue:241` (`router.push("/chat")`) and proposal internal navigations are NOT modified

## 4. Refactor index.vue Protected Routes

- [x] 4.1 Replace hard-coded `protectedRoutes` array in `index.vue` with filtered paths from `activityBarItems` where `requiresProject: true`
- [x] 4.2 Replace `router.replace("/chat")` in `index.vue` with `useDefaultAppRoute().goToDefault()`

## 5. Spec Text Alignment

- [x] 5.1 Update `openspec/specs/app-shell-routing/spec.md`: change "redirecting to `/chat`" to "redirecting to the default application page declared by the ActivityBar registry", add default-page uniqueness requirement
- [x] 5.2 Update `openspec/specs/project-page-routing/spec.md`: change "重定向到 `/workspace`" to "重定向到 ActivityBar 注册表声明的默认应用页", add default-page uniqueness requirement
- [x] 5.3 Run `openspec validate` to confirm spec format is correct

## 6. Testing & Verification

- [x] 6.1 Add unit test for `activity-bar.ts` registry: assert exactly one `isDefault`, assert all paths are non-empty, assert no duplicate ids
- [x] 6.2 Add unit test for `useDefaultAppRoute`: `defaultPath` returns correct value, `goToDefault()` calls `router.push` with that path
- [x] 6.3 Add/update ActivityBar tests: verify activeItem for each registered path, verify no match returns null, verify longest-prefix matching
- [x] 6.4 Run `pnpm typecheck` — zero errors
- [x] 6.5 Run `pnpm test` — all tests pass (144/144)
- [x] 6.6 Run `pnpm lint` — zero errors
