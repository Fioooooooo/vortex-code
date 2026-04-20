## Context

目前两个 sidebar 组件（`chat/Sidebar.vue` 和 `pipeline/PipelineSidebar.vue`）都使用手动实现的 tab 切换：

- 用 `v-for` 遍历 tabs 数组渲染 `<button>`
- 通过 `:class` 绑定 active 状态样式（底部边框、文字颜色、背景色）
- 通过 `@click` 调用 store 方法切换 tab

两个组件的实现几乎完全相同，只是 tabs 数据和绑定的 store 不同。

## Goals / Non-Goals

**Goals:**

- 用 nuxt/ui 的 `UTabs` 组件替换手动 tab 实现
- 使用 `variant="link"` 保持底部指示器的视觉风格
- 保持 store 状态管理和内容渲染逻辑不变

**Non-Goals:**

- 不修改 store 中的 `sidebarTab` 状态或 `setSidebarTab` 方法
- 不修改 tab 内容组件（SessionList、FileTree、RunList、TemplateList）
- 不新增或删除 tab

## Decisions

### 使用 `UTabs` 的 `link` variant

`UTabs` 提供 `pill`（胶囊背景）和 `link`（下划线指示器）两种 variant。现有实现使用底部边框作为 active 指示器，`link` variant 的样式最接近。

### 保持 `v-model` 与 store 的双向绑定

`UTabs` 支持 `v-model`，可以绑定到 store 的 `sidebarTab`。由于 store 的 state 是 ref，可以直接用 `v-model` 或 `:model-value` + `@update:model-value` 模式。

考虑到 store 的 setter 是显式方法 `setSidebarTab`，使用 `:model-value` + `@update:model-value` 更明确：

```vue
<UTabs
  :items="tabs"
  :model-value="chatStore.sidebarTab"
  @update:model-value="chatStore.setSidebarTab"
  variant="link"
/>
```

## Risks / Trade-offs

- **UTabs 的 items 格式**：`UTabs` 的 `items` 期望特定格式（`label`、`icon` 等），与现有 tabs 数组格式兼容。
  - _缓解_：现有 tabs 数组已使用 `label` 和 `icon`，格式一致。

## Migration Plan

1. 修改 `chat/Sidebar.vue`：替换 tab 切换为 `UTabs`
2. 修改 `pipeline/PipelineSidebar.vue`：替换 tab 切换为 `UTabs`
3. 运行 dev server 验证两个页面的 sidebar 样式和行为
