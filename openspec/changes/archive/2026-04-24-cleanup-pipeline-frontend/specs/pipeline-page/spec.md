## MODIFIED Requirements

### Requirement: Pipeline 页面采用两区域布局

系统 SHALL 以左侧边栏面板和中央主区域渲染 Pipeline 页面，左侧面板包含可切换标签的内容，中央区域为空白主区域，待后续重构填充内容。

#### Scenario: 默认 Pipeline 布局

- **WHEN** 用户处于 `/pipeline` 路由
- **THEN** 左侧边栏面板以 260px 宽度可见
- **AND** 中央主区域占据剩余水平空间
- **AND** 右侧无 diff 面板

#### Scenario: 较小视口的响应式行为

- **WHEN** 视口宽度低于桌面断点
- **THEN** 左侧边栏面板可能折叠或以浮层显示
- **AND** 中央主区域保持可访问

### Requirement: Pipeline 侧边栏支持在运行和模板之间切换标签

系统 SHALL 在 Pipeline 侧边栏顶部渲染标签切换器，允许用户在"运行"和"模板"视图之间切换。标签切换器 SHALL 使用 nuxt/ui 的 `UTabs` 组件，`variant="link"`。标签选中状态 SHALL 维护在 `PipelineSidebar` 组件内部，不通过 store 透传。

#### Scenario: 默认标签

- **WHEN** 用户打开 Pipeline 侧边栏
- **THEN** "运行"标签默认激活
- **AND** 内容区域为空（待重构填充）

#### Scenario: 切换到模板标签

- **WHEN** 用户点击"模板"标签
- **THEN** "模板"标签显示激活视觉状态

#### Scenario: 标签切换器视觉样式

- **WHEN** 侧边栏标签切换器渲染
- **THEN** 使用 `variant="link"` 的 `UTabs`
- **AND** 激活标签有主色底部边框指示器
- **AND** 激活标签文字为主色
- **AND** 非激活标签显示静音文字并有悬停高亮
