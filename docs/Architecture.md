# 架构文档

## 项目概述

**FylloCode** — 基于 Electron + Vue 3 + TypeScript 的桌面应用。使用 electron-vite 构建，@nuxt/ui v4 作为 UI 组件库，vue-router/auto 实现文件系统路由。

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
FylloCode/
├── electron/           # Electron 进程代码
│   ├── main/           # 主进程，处理 窗口创建、生命周期、IPC 监听
│   └── preload/        # 预加载脚本，包含 contextBridge 暴露 API、接口类型声明
├── frontend/           # 前端，vite + vue3
├── build/              # 构建资源（图标、entitlements）
├── resources/          # 应用资源
├── shared/             # electron 与 frontend 共享类型、配置
├── data/               # 开发环境数据目录（已 gitignore，生产环境使用系统路径）
│   ├── projects/       # 项目元数据
│   ├── sessions/       # 会话记录（按 {projectId}/{sessionId}.json 组织）
│   ├── settings/       # 用户偏好（preferences.json）
│   ├── integrations/   # 集成配置
│   ├── pipelines/      # Pipeline 模板与运行记录
│   └── logs/           # 应用日志
├── vitest.config.mts   # Vitest 配置（ESM，.mts 后缀）
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.web.json   # 前端 tsconfig（extends @electron-toolkit/tsconfig）
└── tsconfig.node.json  # 后端 tsconfig（extends @electron-toolkit/tsconfig）
```

### 数据路径规范

业务数据通过 `electron/main/utils/paths.ts` 统一管理：

| 路径函数                     | 开发环境         | 生产环境                                                     |
| ---------------------------- | ---------------- | ------------------------------------------------------------ |
| `getDataSubPath("projects")` | `data/projects/` | `~/Library/Application Support/FylloCode/projects/`（macOS） |
| `getDataSubPath("sessions")` | `data/sessions/` | `~/Library/Application Support/FylloCode/sessions/`          |
| `getDataSubPath("settings")` | `data/settings/` | `~/Library/Application Support/FylloCode/settings/`          |
| `getLogsPath()`              | `data/logs/`     | `~/Library/Logs/FylloCode/`（macOS）                         |

Electron 内部缓存（Code Cache、GPU Cache 等）始终使用系统默认路径，不受影响。

## Electron 进程规范

### 进程模型

```
electron/main/index.ts      # 主进程：窗口创建、生命周期、IPC 监听
electron/preload/index.ts   # 预加载：contextBridge 安全暴露 API
electron/preload/index.d.ts # 预加载类型声明（window.electron / window.api）
frontend/src/               # 渲染进程：Vue 3 应用
shared/types/               # 主进程与渲染进程共享的类型
```

IPC 通信：渲染进程通过 `window.electron.ipcRenderer` 调用主进程；新增 channel 时同步更新 `preload/index.d.ts`。

### 主进程 (`electron/main/`)

- 入口 `index.ts` 负责窗口创建、应用生命周期管理、IPC 监听
- 使用 `@electron-toolkit/utils` 提供的工具函数（`electronApp`、`optimizer`、`is`）
- 窗口配置：开发环境通过 `ELECTRON_RENDERER_URL` 加载远程 URL，生产环境加载本地 HTML

### 日志规范

统一使用 `electron-log` v5，通过 `electron/main/utils/logger.ts` 封装后导出：

```ts
import logger from "../utils/logger";

logger.info("...");
logger.warn("...");
logger.error("...");
```

- **不得**在主进程业务代码中直接使用 `console.log`
- 渲染进程使用 `import log from 'electron-log/renderer'`，日志通过 IPC 转发到主进程统一写文件

| 环境            | 日志文件路径                                            |
| --------------- | ------------------------------------------------------- |
| 开发            | `<project-root>/data/logs/main.log`                     |
| 生产（macOS）   | `~/Library/Logs/FylloCode/main.log`                     |
| 生产（Windows） | `%USERPROFILE%\AppData\Roaming\FylloCode\logs\main.log` |

### 预加载脚本 (`electron/preload/`)

- 使用 `contextBridge.exposeInMainWorld` 安全暴露 API
- 默认暴露 `window.electron`（`@electron-toolkit/preload` 提供）和 `window.api`（自定义）
- 类型声明在 `index.d.ts` 中维护，渲染进程通过该类型获得 `window.electron` 的类型提示

### IPC 通信规范

- 渲染进程通过 `window.electron.ipcRenderer` 调用主进程
- 主进程通过 `ipcMain.on` / `ipcMain.handle` 监听
- 所有自定义 API 通过 `preload/index.ts` 的 `contextBridge.exposeInMainWorld` 暴露
- 新增 IPC channel 时同步更新 `preload/index.d.ts` 中的类型声明

## 前端概述

渲染进程基于 **Vue 3.5 + TypeScript 6**，使用 **Vite 7** 构建，**@nuxt/ui v4** 提供 UI 组件，**vue-router/auto** 实现文件系统路由。

### Vue 单文件组件

- 必须使用 `<script setup lang="ts">`
- 组件名：PascalCase
- Props 使用 `defineProps<{ ... }>()` 带类型声明
- 事件使用 `defineEmits<{ ... }>()` 带类型声明
- 复杂逻辑抽离到 `composables/` 或 `utils/`，不在模板中内联

### TypeScript

- 严格模式：`noImplicitAny: true`
- 优先使用 `type` 而非 `interface`
- 函数返回值显式标注（除非明显可推断）
- 不使用 `any`，用 `unknown` + 类型守卫替代
- 前端专属类型在 `frontend/src/` 下维护

### 样式

- 使用 Tailwind CSS utility classes，不手写 CSS 文件
- 颜色通过 @nuxt/ui 的主题系统控制，不使用硬编码色值（如 `#ff0000`）
- 布局间距使用标准值：`gap-2`、`p-4`、`space-y-8` 等
- 需要自定义样式时优先使用 Tailwind 的 `@apply` 或在 `main.css` 中定义 CSS 变量

### 图标

- 统一使用 Lucide 图标集（`@iconify-json/lucide`）
- 格式：`i-lucide-<name>`，如 `i-lucide-plus`、`i-lucide-settings`
- 在 `frontend/src/config/auto-icon.ts` 中注册图标集，业务代码直接使用即可

### 路由规范

- 使用文件系统路由：`frontend/src/pages/*.vue` 自动生成路由配置
- 页面组件名不需要遵循多词规则（eslint 已关闭 `vue/multi-word-component-names`）
- 嵌套路由通过目录结构实现：`pages/parent.vue` + `pages/parent/child.vue`
- 动态路由参数：`[id].vue`
- 路由类型由 `vue-router/auto` 自动生成到 `typed-router.d.ts`，提交到版本控制
