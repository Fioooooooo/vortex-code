# chat-interface 规范

Chat 界面定义了消息流的渲染方式以及侧边栏在 Sessions 和 Files 标签之间的切换行为。

## Requirements

### Requirement: Chat 区域显示可滚动的消息流

系统 SHALL 在中央主区域渲染垂直滚动的消息序列，消息数据类型为 `UIMessage<MessageMeta>`，每条消息通过 `parts` 数组描述内容。

#### Scenario: 消息流渲染

- **WHEN** session 处于活跃状态
- **THEN** Chat 区域按时间顺序显示所有消息，可从上到下滚动
- **AND** 消息类型为 `UIMessage<MessageMeta>`，包含 `metadata.sessionId` 和 `metadata.createdAt`

### Requirement: Chat 侧边栏支持在 Sessions 和 Files 之间切换标签

系统 SHALL 在 Chat 侧边栏顶部渲染标签切换器，允许用户在"Sessions"和"Files"视图之间切换。标签切换器 SHALL 使用 nuxt/ui 的 `UTabs` 组件，`variant="link"`。

#### Scenario: 默认标签

- **WHEN** 用户打开 Chat 侧边栏
- **THEN** "Sessions"标签默认激活
- **AND** 显示 SessionList

#### Scenario: 切换到 Files 标签

- **WHEN** 用户点击"Files"标签
- **THEN** 显示 FileTree
- **AND** "Files"标签显示激活视觉状态

#### Scenario: 标签切换器视觉样式

- **WHEN** 侧边栏标签切换器渲染
- **THEN** 使用 `variant="link"` 的 `UTabs`
- **AND** 激活标签有主色底部边框指示器
- **AND** 激活标签文字为主色
- **AND** 非激活标签显示静音文字并有悬停高亮
