## Context

AppHeader 当前高度为 48px (`h-12`)，采用左右两栏布局：左侧是项目切换器（包含项目名称、agent badge、chevron-down），右侧是 controls（token usage popover、agent status indicator、theme toggle）。右侧元素过多导致视觉拥挤，且当前布局没有为未来扩展预留清晰的结构。

## Goals / Non-Goals

**Goals:**

- 将 Header 高度降至 35px，更紧凑
- 建立清晰的三栏布局结构（左 20% / 中 60% / 右 20%）
- 中间区域集中展示核心导航信息（项目 + Agent + chevron-down）
- 右侧仅保留主题切换，为未来 icon buttons 预留扩展空间
- 定义 icon button 的统一尺寸和交互规范

**Non-Goals:**

- 不迁移 token usage 和 agent status 到其他位置（仅在本变更中从 Header 移除）
- 不改变项目切换器的交互逻辑（仅调整位置和样式）
- 不新增除主题切换外的其他功能

## Decisions

**使用 flex 布局而非 grid**

- 三栏布局使用 `flex` 配合 `w-[20%]` / `w-[60%]` 实现，因为需要中间内容自适应居中，左右固定比例
- Grid 的 `grid-cols-[1fr_3fr_1fr]` 也可以，但 flex 更灵活，且项目已有 tailwind 的 flex 使用习惯

**右侧使用独立的 icon button container**

- 右侧 20% 宽度的容器内再包一层 container，控制 `pr-2` (8px) 的右间距
- Container 内部使用 `flex items-center justify-end gap-1` (4px 间距)
- 为未来添加其他 icon button 预留结构，无需改动外层布局

**Icon button 使用 UButton 的自定义样式**

- 不使用 `size="xs"`（默认 26px），而是自定义 `w-[22px] h-[22px]` 的 button
- Icon 使用 `w-4 h-4` (16px)
- Hover 背景通过 UButton 的 `variant="ghost"` 自动处理

## Risks / Trade-offs

- **[Risk]** Token usage 和 agent status 从 Header 移除后，用户可能找不到这些信息
  - **Mitigation**: 这两个功能在后续变更中需要重新安置（如放到 sidebar 或状态栏）
- **[Risk]** 35px 高度对某些 touch 设备可能偏小
  - **Mitigation**: 当前目标为桌面端应用，35px 在桌面端完全可用

**macOS 红绿灯定位**

- Electron `titleBarStyle: 'hidden'` 会隐藏原生 titlebar 但保留红绿灯
- `trafficLightPosition: { x: 12, y: 10 }` 将红绿灯定位到 Header 左侧区域内
- 左侧 20% 宽度约 180px（窗口宽度 900px 时），足够容纳红绿灯（约 52px 宽）
- 红绿灯默认垂直居中偏上，y=10 可在 35px 高度内视觉居中
- 仅对 `process.platform === 'darwin'` 应用此配置
