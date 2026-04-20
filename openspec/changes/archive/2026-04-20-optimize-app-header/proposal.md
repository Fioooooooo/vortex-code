## Why

当前 AppHeader 高度为 48px，左右布局不够紧凑，右侧 controls 区域包含 token usage、agent status、theme toggle 等多个元素，视觉上较为拥挤。需要优化 Header 布局，使其更简洁、高度更低，并为未来的扩展预留空间。

## What Changes

- 将 Header 高度从 `h-12` (48px) 调整为固定 35px
- 布局改为左中右三部分：左侧 20%（占位）、中间 60%、右侧 20%
- 中间区域居中展示：项目名称 + Agent 名称 + chevron-down icon，使用带边框的 div 容器替代 UButton，div 与 Header 上下有间距
- 点击中间 div 触发项目切换 dropdown menu，menu 可滚动，使用分割线分隔已有项目与"创建新项目"
- 点击"创建新项目"唤起 CreateProjectModal（复用 welcome page 的创建项目功能）
- 右侧区域仅保留主题切换 icon button，移除 token usage 和 agent status 展示
- 右侧 icon button container 距右 8px，内部 icon button 间距 4px，button 尺寸 22x22px，icon 尺寸 16x16px，hover 有背景色变化
- Header 根元素添加 `-webkit-app-region: drag` 属性，支持 Electron 窗口拖拽
- Header 内部所有交互元素（button、icon 等）添加 `-webkit-app-region: no-drag` 属性，确保这些元素可正常点击而不触发拖拽
- macOS 平台：Electron mainWindow 使用 `titleBarStyle: 'hidden'` 隐藏原生 titlebar，保留红绿灯按钮
- macOS 平台：通过 `trafficLightPosition` 将红绿灯定位到 Header 左侧 20% 区域内
- 左侧区域保持为空，仅占位（为 macOS 红绿灯预留空间）

## Capabilities

### New Capabilities

- `app-header-layout`: 定义 AppHeader 的三栏布局规范、尺寸规范和 icon button 交互规范

### Modified Capabilities

- `workspace-layout`: 更新 workspace 顶部 Header 区域的布局要求（高度、结构变化）

## Impact

- `frontend/src/components/layout/AppHeader.vue`：样式和结构重构
- 移除 token usage 和 agent status 在 Header 中的展示（这些功能可能需要在其他位置重新展示）
