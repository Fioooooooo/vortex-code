## ADDED Requirements

### Requirement: 系统提供 3 个内置模板

系统 SHALL 在项目首次打开 Pipeline 页时，自动注入以下 3 个内置模板：Standard Dev Flow、Quick Fix、Review Only。

#### Scenario: 首次打开注入

- **WHEN** 用户首次打开某项目的 Pipeline 页
- **AND** `data/pipelines/templates/` 目录下不存在 `builtin-*.json` 文件
- **THEN** 系统写入 3 个内置模板文件
- **AND** 每个文件的 `source` 字段为 `builtin`

#### Scenario: 非首次打开不重复注入

- **WHEN** 用户再次打开 Pipeline 页
- **AND** 内置模板文件已存在且 `builtinVersion` 与当前版本一致
- **THEN** 系统不重复写入

### Requirement: Standard Dev Flow 模板包含 5 个 stage

系统 SHALL 定义 Standard Dev Flow 模板包含 Discuss → Code → Test → Review → Deploy 五个 stage，其中 Deploy 默认禁用（`enabled: false`）。

#### Scenario: 查看 Standard Dev Flow 的 stage 序列

- **WHEN** 读取 Standard Dev Flow 模板
- **THEN** `stages` 数组按顺序包含 `discuss`、`code`、`test`、`review`、`deploy`
- **AND** `deploy` stage 的 `enabled` 字段为 `false`

#### Scenario: Standard Dev Flow 的 Gate 配置

- **WHEN** 读取 Standard Dev Flow 模板的 Gate 配置
- **THEN** Discuss stage 有 `manual-approval` Gate
- **AND** Code stage 有 `build-success` Gate
- **AND** Test stage 有 `test-pass-rate` Gate（threshold: 100）
- **AND** Review stage 有 `no-critical-issue` Gate（maxAllowedSeverity: `major`）
- **AND** Deploy stage 有 `manual-approval` Gate

#### Scenario: Standard Dev Flow 的失败策略

- **WHEN** 读取 Standard Dev Flow 模板的失败策略
- **THEN** Discuss stage 为 `pause`
- **AND** Code stage 为 `retry`（maxRetries: 3）
- **AND** Test stage 为 `retry`（maxRetries: 2）
- **AND** Review stage 为 `retry`（maxRetries: 2，retry 目标为 Code stage）
- **AND** Deploy stage 为 `pause`

### Requirement: Quick Fix 模板包含 2 个 stage

系统 SHALL 定义 Quick Fix 模板仅包含 Code → Test 两个 stage，适用于小 bug 修复场景。

#### Scenario: 查看 Quick Fix 的 stage 序列

- **WHEN** 读取 Quick Fix 模板
- **THEN** `stages` 数组按顺序包含 `code`、`test`
- **AND** 无 discuss、review、deploy stage

#### Scenario: Quick Fix 的 Gate 配置

- **WHEN** 读取 Quick Fix 模板的 Gate 配置
- **THEN** Code stage 有 `build-success` Gate
- **AND** Test stage 有 `test-pass-rate` Gate（threshold: 100）

### Requirement: Review Only 模板包含 1 个 stage

系统 SHALL 定义 Review Only 模板仅包含 Review 一个 stage，适用于对已有代码做 AI 评审。

#### Scenario: 查看 Review Only 的 stage 序列

- **WHEN** 读取 Review Only 模板
- **THEN** `stages` 数组仅包含 `review`
- **AND** 无其他 stage

### Requirement: 内置模板不可直接编辑

系统 SHALL 禁止对 `source='builtin'` 的模板进行就地编辑；用户编辑内置模板并保存时，系统创建一份 `source='custom'` 的副本。

#### Scenario: 编辑内置模板触发复制

- **WHEN** 用户编辑内置模板并点击保存
- **THEN** 系统创建新的自定义模板文件（`custom-<uuid>.json`）
- **AND** 原内置模板文件不变

### Requirement: 内置模板版本升级

系统 SHALL 在 FylloCode 升级后，若内置模板的 `builtinVersion` 低于代码中的版本号，覆盖对应 `builtin-*.json` 文件。

#### Scenario: 版本升级覆盖

- **WHEN** FylloCode 升级后首次打开 Pipeline 页
- **AND** 某内置模板的 `builtinVersion` 低于代码常量
- **THEN** 系统用新版本覆盖该 `builtin-*.json`
- **AND** 用户已复制的 `custom-*.json` 不受影响

### Requirement: 内置模板定义为代码常量

系统 SHALL 在 `shared/pipeline/builtin-templates.ts` 中以 TypeScript 常量形式导出 3 个内置模板定义，包含完整的 stage 配置、Gate 配置、promptTemplate 骨架与 inputSpec。

#### Scenario: 常量可被主进程引用

- **WHEN** 主进程需要注入内置模板
- **THEN** 从 `@shared/pipeline/builtin-templates` 导入常量
- **AND** 常量类型为 `PipelineTemplate[]`
