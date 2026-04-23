## Why

主进程目前没有统一的日志机制，调试信息散落在 `console.log` 中，生产环境无法持久化日志，出现问题时难以排查。引入 `electron-log` 建立规范的日志管理，是后续所有功能模块可靠运行的基础设施。

## What Changes

- 新增 `electron/main/utils/logger.ts`，封装 `electron-log` 并统一导出 `logger` 实例
- 开发环境日志文件写入 `data/logs/main.log`，对接已有的 `getLogsPath()`
- 生产环境日志走 `electron-log` 默认平台路径（macOS: `~/Library/Logs/FylloCode/main.log`）
- 在主进程 `index.ts` 中调用 `log.initialize()`，使渲染进程也可使用同一 logger
- 生产环境 console transport 级别限制为 `warn` 及以上，减少噪音
- 启用 `log.errorHandler.startCatching()` 捕获未处理异常和 Promise rejection
- 更新 `docs/Architecture.md` 补充日志规范说明

## Capabilities

### New Capabilities

- `logging`: 主进程统一日志管理，包含日志初始化、路径配置、级别控制、异常捕获规范

### Modified Capabilities

（无现有 spec 需要变更）

## Impact

- **新增依赖**：`electron-log` v5.4.3（已安装）
- **修改文件**：`electron/main/index.ts`、`docs/Architecture.md`
- **新增文件**：`electron/main/utils/logger.ts`
- **不影响**：IPC 契约、渲染进程代码、数据路径规范
