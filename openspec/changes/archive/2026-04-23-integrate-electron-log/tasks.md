## 1. 创建 logger 模块

- [x] 1.1 删除之前创建的临时 `electron/main/utils/logger.ts`（内容不完整）
- [x] 1.2 重新创建 `electron/main/utils/logger.ts`：使用 `resolvePathFn` 配置文件路径，开发环境对接 `getLogsPath()`，生产环境使用 electron-log 默认路径
- [x] 1.3 在 logger.ts 中设置生产环境 console transport 级别为 `warn`
- [x] 1.4 在 logger.ts 中调用 `log.errorHandler.startCatching()` 启用异常捕获
- [x] 1.5 在 logger.ts 中调用 `log.initialize()` 以支持渲染进程使用

## 2. 主进程集成

- [x] 2.1 在 `electron/main/index.ts` 中 import logger 模块（触发初始化），移除之前遗留的 `app.setPath("logs", ...)` 调用
- [x] 2.2 将 `index.ts` 中现有的 `console.log` / `console.error` 替换为 `logger.info` / `logger.error`

## 3. 文档更新

- [x] 3.1 在 `docs/Architecture.md` 的主进程规范章节补充日志规范：logger 模块路径、使用方式、开发/生产路径说明
