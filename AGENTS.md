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
│   ├── main/           # 主进程，处理 窗口创建、生命周期、IPC 监听
│   └── preload/        # 预加载脚本，包含 contextBridge 暴露 API、接口类型声明
├── frontend/           # 前端，vite + vue3
├── build/              # 构建资源（图标、entitlements）
├── resources/          # 应用资源
├── vitest.config.mts   # Vitest 配置（ESM，.mts 后缀）
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.web.json   # 前端 tsconfig（extends @electron-toolkit/tsconfig）
└── tsconfig.node.json  # 后端 tsconfig（extends @electron-toolkit/tsconfig）
```

## 常用命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 类型检查 + 完整构建
pnpm typecheck        # 类型检查（Node + Web）
pnpm lint             # ESLint 检查
pnpm format           # Prettier 格式化
pnpm test             # 运行所有测试（单次）
pnpm test:watch       # 测试监听模式
pnpm test:coverage    # 生成覆盖率报告
```

## 文档归类

如需更多详细信息，Agent 可以主动查看下方的各类详细文档。

- **架构文档** - [Architecture](./docs/Architecture.md)
- **数据模型** - [DataModel](./docs/DataModel.md)
- **IPC 通信** - [IPC](./docs/IPC.md)
- **测试规范** - [Testing](./docs/Testing.md)
- **编码规范** - [CodeStyle](./docs/CodeStyle.md)

## 功能需求规范（OpenSpec）

`openspec/specs/` 是功能需求的权威来源，按功能模块分目录，每个目录下有一个 `spec.md`，包含 Requirements 和 Scenarios。

实现或修改某功能时，先在 `openspec/specs/` 中找到对应模块的 `spec.md` 阅读，spec 中的 SHALL 是强制要求。`changes/archive/` 是已归档的历史变更，仅供了解演进背景，不作为当前实现依据。

## AI 助手工作准则

1. **先读后改** — 修改代码前必须阅读相关文件，理解现有逻辑和约定
2. **不引入新依赖** — 除非用户明确要求，优先使用已有技术栈
3. **保持简洁** — 不为假想的未来需求做抽象，三个相似代码块再考虑抽离
4. **TypeScript 严格** — 不添加 `@ts-ignore`，修复类型错误而非绕过
5. **测试覆盖** — 新增 composables/utils 必须附带测试；修改现有逻辑时确保测试通过
6. **不修改构建产物** — `out/`、`dist/` 为生成目录，不手动编辑
7. **git 安全** — 不执行 `git reset --hard`、`git push --force` 等破坏性操作，除非用户明确要求
8. **中文优先** — 所有注释、文档、用户沟通使用中文，代码标识符保持英文
