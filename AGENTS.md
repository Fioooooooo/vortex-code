# AGENTS.md

此文件作为 Coding Agent 工作时的必要指导文件，在当前项目中必须按照规定的指令工作。

## 项目概述

**Vortex Code** — 基于 Electron + Vue 3 + TypeScript 的桌面应用。使用 electron-vite 构建，@nuxt/ui v4 作为 UI 组件库，vue-router/auto 实现文件系统路由。

## 技术栈

| 层       | 技术                                 |
| -------- | ------------------------------------ |
| 桌面框架 | Electron 39                          |
| 前端框架 | Vue 3.5 (Composition API)            |
| 构建工具 | Vite 7 + electron-vite 5             |
| UI 库    | @nuxt/ui 4.6                         |
| 路由     | vue-router/auto (文件系统路由)       |
| 样式     | Tailwind CSS 4                       |
| 语言     | TypeScript 6                         |
| 包管理   | pnpm                                 |
| 测试     | Vitest + @vue/test-utils + happy-dom |

## 目录结构

```
vortex-code/
├── electron/           # Electron 进程代码
│   ├── main/           # 主进程
│   │   └── index.ts    # 窗口创建、生命周期、IPC 监听
│   └── preload/        # 预加载脚本
│       ├── index.ts    # contextBridge 暴露 API
│       └── index.d.ts  # 类型声明
├── frontend/           # 渲染进程前端代码（详见 frontend/AGENTS.md）
│   └── src/
├── build/              # 构建资源（图标、entitlements）
├── resources/          # 应用资源
├── vitest.config.mts   # Vitest 配置（ESM，.mts 后缀）
├── electron.vite.config.ts
├── electron-builder.yml
└── tsconfig.web.json   # 前端 tsconfig（extends @electron-toolkit/tsconfig）
```

## Electron 进程规范

### 主进程 (`electron/main/`)

- 入口 `index.ts` 负责窗口创建、应用生命周期管理、IPC 监听
- 使用 `@electron-toolkit/utils` 提供的工具函数（`electronApp`、`optimizer`、`is`）
- 窗口配置：开发环境通过 `ELECTRON_RENDERER_URL` 加载远程 URL，生产环境加载本地 HTML

### 预加载脚本 (`electron/preload/`)

- 使用 `contextBridge.exposeInMainWorld` 安全暴露 API
- 默认暴露 `window.electron`（`@electron-toolkit/preload` 提供）和 `window.api`（自定义）
- 类型声明在 `index.d.ts` 中维护，渲染进程通过该类型获得 `window.electron` 的类型提示

## IPC 通信规范

- 渲染进程通过 `window.electron.ipcRenderer` 调用主进程
- 主进程通过 `ipcMain.on` / `ipcMain.handle` 监听
- 所有自定义 API 通过 `preload/index.ts` 的 `contextBridge.exposeInMainWorld` 暴露
- 新增 IPC channel 时同步更新 `preload/index.d.ts` 中的类型声明

## 前端规范

前端渲染进程的详细编码约定、Vue 组件规范、路由规范、测试规范等，见：

**[frontend/AGENTS.md](frontend/AGENTS.md)**

## AI 助手工作准则

1. **先读后改** — 修改代码前必须阅读相关文件，理解现有逻辑和约定
2. **不引入新依赖** — 除非用户明确要求，优先使用已有技术栈
3. **保持简洁** — 不为假想的未来需求做抽象，三个相似代码块再考虑抽离
4. **TypeScript 严格** — 不添加 `@ts-ignore`，修复类型错误而非绕过
5. **测试覆盖** — 新增 composables/utils 必须附带测试；修改现有逻辑时确保测试通过
6. **不修改构建产物** — `out/`、`dist/` 为生成目录，不手动编辑
7. **git 安全** — 不执行 `git reset --hard`、`git push --force` 等破坏性操作，除非用户明确要求
8. **中文优先** — 所有注释、文档、用户沟通使用中文，代码标识符保持英文
