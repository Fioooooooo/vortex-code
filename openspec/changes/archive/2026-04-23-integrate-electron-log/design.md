## Context

主进程目前无统一日志机制，调试信息通过 `console.log` 输出，生产环境无持久化日志文件。`electron-log` v5 是 Electron 社区标准日志库，无额外依赖，支持主进程/渲染进程统一日志，已安装。

现有路径工具 `electron/main/utils/paths.ts` 已提供 `getLogsPath()`，开发环境返回 `data/logs/`，生产环境返回 `app.getPath("logs")`，logger 模块直接复用。

## Goals / Non-Goals

**Goals:**

- 封装统一的 `logger` 实例，各模块 `import` 即用
- 开发/生产环境日志路径自动切换
- 捕获未处理异常和 Promise rejection
- 渲染进程可通过 `electron-log/renderer` 使用同一日志管道

**Non-Goals:**

- 远程日志上报（remote transport）
- 渲染进程日志封装（由各自模块按需 import `electron-log/renderer`）
- 日志查看 UI

## Decisions

### 1. 封装为独立模块而非直接使用 electron-log 默认导出

`electron-log` 默认导出是全局单例，直接使用会导致各模块耦合到库的具体 API。封装为 `logger.ts` 统一配置后导出，未来切换实现只需改一处。

**备选方案**：各模块直接 `import log from 'electron-log/main'` — 放弃，配置分散，无法统一控制。

### 2. 使用 `resolvePathFn` 而非 `app.setPath("logs", ...)`

`app.setPath("logs", ...)` 会影响整个应用的日志路径，包括 Chromium 内部日志。`resolvePathFn` 只控制 `electron-log` 自身的文件输出路径，更精确，副作用更小。

**备选方案**：在 `index.ts` 中 `app.setPath("logs", getLogsPath())` — 已在上一次改动中评估，副作用过大，放弃。

### 3. 生产环境 console transport 限制为 warn

生产包中 DevTools 默认关闭，console 输出无意义；保留 warn/error 级别便于系统日志捕获（如 macOS Console.app）。

## Risks / Trade-offs

- **`log.initialize()` 需在 `app.whenReady()` 之前调用** → 在 `index.ts` 顶部模块加载时初始化，`logger.ts` 中调用 `log.initialize()`
- **`data/logs/` 目录不存在时写入失败** → `electron-log` 会自动创建目录，无需手动 `mkdirSync`
- **渲染进程日志通过 IPC 转发到主进程** → 开发环境 IPC transport 默认开启，生产环境默认关闭，行为符合预期
