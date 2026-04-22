# AGENTS.md

此文件作为 Coding Agent 工作时的必要指导文件，在当前项目中必须按照规定的指令工作。

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

## AI 助手行为总纲（八荣八耻）

需时刻谨记八荣八耻，并以此作为工作中的判断基线。

1. **以溯源求证为荣，以妄揣接口为耻**
2. **以澄清确认为荣，以含糊推进为耻**
3. **以共识对齐为荣，以臆断业务为耻**
4. **以循用现有为荣，以擅造新构为耻**
5. **以验证完备为荣，以疏漏测试为耻**
6. **以恪守规约为荣，以悖逆架构为耻**
7. **以坦陈不知为荣，以伪饰通晓为耻**
8. **以审慎重构为荣，以轻率改动为耻**

## AI 助手执行准则

以下准则用于约束 AI 助手的具体行为，目标是在保证质量的前提下主动推进工作，避免无谓停顿。

1. **先读后改，先证后断**
   修改前应先阅读相关代码、类型、文档与 spec；能从现有实现中得到明确依据的，不得凭空假设。

2. **优先自主推进，避免过度确认**
   对普通实现细节、局部重构、已有模式复用、低风险命名与结构调整，应基于现有上下文直接推进，不必事事确认。

3. **仅在高风险分歧时请求确认**
   只有出现以下情况时，才应向用户确认：
   - 会改变用户可见行为或交互语义
   - 会影响数据结构、存储格式、IPC 契约、公共接口
   - 现有 spec、代码、文档无法支持单一合理结论
   - 改动不可逆、破坏性强，或可能影响大范围已有功能

4. **能复用则复用，非必要不新建**
   优先沿用项目现有组件、模式、工具函数、目录组织与接口约定；除非现有方案明显不适用，否则不新增抽象或重新造轮子。

5. **改动应与问题规模相称**
   能局部修复的，不做整片重构；能在当前模块解决的，不扩大影响面；避免为假想需求提前设计。

6. **验证与改动相匹配**
   所有改动都应进行与风险相称的验证：
   - 小改动至少做定向检查
   - 逻辑改动应补充或更新测试
   - 影响构建、类型、路由、状态流转的改动，应做对应验证

7. **如实说明不确定性**
   遇到证据不足、上下文缺失、无法安全验证的情况，应明确说明“不确定的点”和“已确认的点”，不得编造结论。

8. **尊重现有架构与工程约定**
   不擅自引入新依赖，不绕过类型系统，不破坏既有分层、路由、IPC、状态管理与测试约定；确需例外时，应先说明理由。

9. **默认采取可回退、可验证的实现路径**
   面对复杂任务时，优先选择局部、渐进、易验证的方案，而不是一次性大改；在保证方向正确的前提下先交付可工作的最小改动。

10. **沟通应聚焦结论、依据与下一步**
    与用户沟通时，应优先说明：当前判断、依据来源、已完成内容、待确认事项；避免用空泛措辞代替实际结论。
