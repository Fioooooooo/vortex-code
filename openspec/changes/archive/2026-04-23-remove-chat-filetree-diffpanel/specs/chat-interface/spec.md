## MODIFIED Requirements

### Requirement: Chat 侧边栏仅显示 Sessions 标签

系统 SHALL 在 Chat 侧边栏顶部仅渲染"Sessions"标签，不再提供"Files"标签切换。侧边栏始终显示 SessionList，无需标签切换器。

#### Scenario: 侧边栏默认显示 SessionList

- **WHEN** 用户打开 Chat 页面
- **THEN** 侧边栏直接显示 SessionList，无标签切换器

## REMOVED Requirements

### Requirement: Chat 侧边栏支持在 Sessions 和 Files 之间切换标签

**Reason**: FileTree 功能基于 mock 数据，产品方向未定，整体移除以消除死代码
**Migration**: 无用户可见迁移路径；侧边栏仅保留 Sessions 视图
