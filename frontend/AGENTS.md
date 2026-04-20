# Frontend AGENTS.md

此文件定义前端渲染进程的编码规范与工作准则。根目录 `AGENTS.md` 涵盖 Electron 进程与项目全局约定。

## 前端概述

渲染进程基于 **Vue 3.5 + TypeScript 6**，使用 **Vite 7** 构建，**@nuxt/ui v4** 提供 UI 组件，**vue-router/auto** 实现文件系统路由。

## 技术栈

| 层       | 技术                                        |
| -------- | ------------------------------------------- |
| 框架     | Vue 3.5 (Composition API, `<script setup>`) |
| 构建工具 | Vite 7                                      |
| UI 库    | @nuxt/ui 4.6                                |
| 路由     | vue-router/auto (文件系统路由)              |
| 样式     | Tailwind CSS 4                              |
| 图标     | Lucide (`@iconify-json/lucide`)             |
| 测试     | Vitest + @vue/test-utils + happy-dom        |

## 目录结构

```
frontend/
├── src/
│   ├── components/      # 复用组件（PascalCase 命名）
│   ├── pages/           # 路由页面（自动生成路由）
│   ├── composables/     # 自定义组合式函数
│   ├── utils/           # 纯工具函数
│   ├── config/          # 配置文件（auto-routes, auto-icon）
│   ├── assets/          # 静态资源
│   ├── __tests__/       # 测试目录
│   │   ├── setup.ts     # 全局 mock / stub
│   │   ├── components/  # 组件测试
│   │   ├── composables/ # composable 测试
│   │   ├── utils/       # 工具函数测试
│   │   └── AGENTS.md    # 测试规范
│   ├── App.vue
│   ├── main.ts          # 渲染进程入口
│   ├── vite-env.d.ts
│   └── typed-router.d.ts  # vue-router/auto 生成（勿改）
├── index.html
├── .eslintrc-auto-import.json  # @nuxt/ui 生成（勿改）
├── auto-imports.d.ts           # @nuxt/ui 生成（勿改）
└── components.d.ts             # @nuxt/ui 生成（勿改）
```

## 编码约定

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

## 路由规范

- 使用文件系统路由：`frontend/src/pages/*.vue` 自动生成路由配置
- 页面组件名不需要遵循多词规则（eslint 已关闭 `vue/multi-word-component-names`）
- 嵌套路由通过目录结构实现：`pages/parent.vue` + `pages/parent/child.vue`
- 动态路由参数：`[id].vue`
- 路由类型由 `vue-router/auto` 自动生成到 `typed-router.d.ts`，提交到版本控制

## 测试规范

- 测试文件：`*.spec.ts`，放在 `frontend/src/__tests__/` 下
- 运行命令：`pnpm test` / `pnpm test:watch` / `pnpm test:coverage`
- 新增 composables/utils 必须附带测试

详细测试策略（组件 stub、mock 约定、覆盖率配置等）见：

**[src/**tests**/AGENTS.md](src/**tests**/AGENTS.md)**
