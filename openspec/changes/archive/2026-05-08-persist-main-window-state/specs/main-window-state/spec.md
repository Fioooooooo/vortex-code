## ADDED Requirements

### Requirement: Main window uses an ergonomic default size

系统 SHALL 在没有可恢复窗口状态时，以默认 `1280x760` 作为主窗口的目标尺寸创建主窗口，并在当前显示区域不足时安全裁剪到可见范围，而不是继续使用 `900x670`。

#### Scenario: First launch without saved state

- **WHEN** 用户首次启动应用，或系统找不到可用的主窗口状态
- **THEN** 主窗口以宽 `1280`、高 `760` 的默认尺寸创建

### Requirement: Main window enforces a minimum usable size

系统 SHALL 为主窗口设置最小尺寸约束，默认阈值为宽 `960`、高 `640`，防止桌面布局被压缩到不可用。

#### Scenario: User resizes the window smaller than supported

- **WHEN** 用户拖拽主窗口，尝试把窗口缩小到宽 `960` 或高 `640` 以下
- **THEN** 系统阻止窗口继续缩小到该阈值以下

### Requirement: Main window restores the last valid window state

系统 SHALL 在应用下次启动时恢复主窗口上一次保存的有效窗口状态，包括 normal bounds 和是否处于 maximized 状态；当保存的状态无效、损坏或离开当前显示区域时，系统 SHALL 回退到默认目标尺寸，并在需要时裁剪到当前显示区域。

#### Scenario: Saved window state is valid

- **WHEN** 系统启动时读取到有效的主窗口状态
- **THEN** 主窗口使用保存的 bounds 创建
- **AND** 若保存状态标记为 maximized，则主窗口恢复为最大化

#### Scenario: Saved window state is invalid or off-screen

- **WHEN** 系统启动时读取到损坏的窗口状态，或其 bounds 不再位于当前显示区域内
- **THEN** 系统忽略该状态
- **AND** 主窗口回退到默认目标尺寸创建
