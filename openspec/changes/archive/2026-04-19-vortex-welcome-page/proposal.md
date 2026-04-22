## Why

FylloCode 需要在没有项目打开时展示一个启动页，作为用户进入 IDE 的第一个接触点。当前应用启动后直接进入空白 Workspace，缺乏引导用户打开或创建项目的入口，降低了首次使用体验。启动页将提供品牌标识、核心操作入口和最近项目历史，帮助用户快速进入工作状态。

## What Changes

- 新增 `WelcomePage` 页面组件，在无项目打开时全屏展示
- 新增品牌标识区域（Logo + 产品名 + tagline）
- 新增两个核心操作按钮："打开目录"和"创建项目"
- 新增"创建项目"弹窗流程（项目名称、存放路径、模板选择）
- 新增最近打开项目列表，支持点击打开和移除记录
- 新增空状态引导文案
- 抽取共享类型到 `src/types` 目录，便于与 Electron 层共享
- 新增 Pinia store 管理启动页状态和数据（mock 数据）

## Capabilities

### New Capabilities

- `welcome-page`: 启动页 UI 展示与交互——品牌标识、操作按钮、最近项目列表
- `project-creation`: 创建项目流程——表单输入、路径选择、模板选择、进入 Workspace
- `recent-projects`: 最近项目历史管理——读取、打开、移除记录

### Modified Capabilities

- (none)

## Impact

- 新增文件位于 `src/pages/WelcomePage.vue` 及子组件
- 新增 store `src/stores/welcome.ts`
- 新增类型定义 `src/types/project.ts`, `src/types/welcome.ts`
- 使用 `@nuxt/ui` 组件（Button、Modal、Input、Select 等）
- 路由层面需处理无项目时的默认展示逻辑
