## ADDED Requirements

### Requirement: Fyllo Clarification 横幅

系统 SHALL 在 Run 处于 `waiting-clarification` 状态时，在 Run 详情区顶部（Stage Flow 上方）显示 Clarification 横幅。

#### Scenario: 显示 Clarification 横幅

- **WHEN** Run 状态为 `waiting-clarification`
- **THEN** Run 详情区顶部显示横幅
- **AND** 横幅包含 Fyllo 的问题文本、回答输入框和 Send 按钮

#### Scenario: 提交回答

- **WHEN** 用户在输入框中填写回答并点击 Send
- **THEN** 调用 `respondClarification` IPC
- **AND** 按钮显示 loading 状态
- **AND** Run 状态回到 `running` 后横幅消失

#### Scenario: 横幅可关闭

- **WHEN** 用户点击横幅的关闭按钮
- **THEN** 横幅隐藏
- **AND** Orchestrator 抽屉中仍可见该 clarification 请求
- **AND** Run 状态保持 `waiting-clarification`

#### Scenario: 非 waiting-clarification 状态不显示

- **WHEN** Run 不处于 `waiting-clarification` 状态
- **THEN** 不显示 Clarification 横幅
