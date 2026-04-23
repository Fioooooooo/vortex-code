# integration-connection-management 规范

集成连接管理定义了用户通过 API Token 或 OAuth 连接第三方工具、以及断开连接的交互规范。

## Requirements

### Requirement: 用户可通过 API Token 连接工具

对于使用 API Token 认证的工具，系统 SHALL 显示带有标签输入字段的表单，用于填写所需凭据（如 Access Key、Token、Webhook URL）。每个字段 SHALL 包含帮助文本和说明如何获取凭据的帮助链接。SHALL 提供"测试连接"按钮以验证所填凭据。

#### Scenario: API Token 连接流程

- **WHEN** 用户展开使用 API Token 认证的工具卡片
- **THEN** 连接区块显示所需凭据的输入字段
- **AND** 每个字段有标签、帮助文本和帮助链接
- **AND** 提供"测试连接"按钮

#### Scenario: 连接测试成功

- **WHEN** 用户填写有效凭据并点击"测试连接"
- **THEN** 系统验证凭据
- **AND** 验证成功后连接状态变为"已连接"
- **AND** 显示已连接的账户/组织名称

### Requirement: 用户可断开工具连接

对于已连接的工具，系统 SHALL 显示已连接账户信息和"断开连接"按钮。点击"断开连接" SHALL 移除连接并将工具重置为未连接状态。

#### Scenario: 断开工具连接

- **WHEN** 用户点击已连接工具的"断开连接"
- **THEN** 工具连接被移除
- **AND** 卡片更新显示"未连接"
- **AND** 该工具在所有已启用它的项目中被禁用

### Requirement: OAuth 工具显示连接按钮

对于使用 OAuth 认证的工具，系统 SHALL 显示"通过 {Provider} 连接"按钮。点击按钮 SHALL 模拟 OAuth 流程（短暂延迟后状态变为已连接）。

#### Scenario: OAuth 连接模拟

- **WHEN** 用户点击即将推出的 OAuth 工具上的"通过 GitHub 连接"
- **THEN** 按钮显示加载状态
- **AND** 模拟延迟后工具变为已连接
- **AND** 显示已连接的账户名称
