## 1. Main window state storage

- [x] 1.1 Extend the main-process data path helper with a dedicated window-state subdirectory
- [x] 1.2 Add a small JSON-backed store for the main window's bounds and maximized state
- [x] 1.3 Add unit coverage for saving, loading, and handling invalid window-state files

## 2. Window bootstrap integration

- [x] 2.1 Refactor `createMainWindow()` to use the restored state when available and fall back to the new default size otherwise
- [x] 2.2 Apply the new minimum size constraints when constructing the BrowserWindow
- [x] 2.3 Persist the latest usable window state before shutdown
- [x] 2.4 Add unit coverage for default sizing, restore behavior, and off-screen fallback

## 3. Verification

- [x] 3.1 Run targeted main-process tests for the new window state helpers and bootstrap flow
- [x] 3.2 Run the project validation checks relevant to the modified main-process files
