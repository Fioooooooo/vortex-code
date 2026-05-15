## MODIFIED Requirements

### Requirement: Session 信息持久化

系统 SHALL 将每个 session 的元数据（含 `acpSessionId`、`agentId`、可选 `available_commands`）持久化到 `getDataSubPath('sessions')/<sessionId>.json`，支持应用重启后恢复 ACP session 上下文和 session 级可用命令列表。所有 `acpSessionId`、`turnCount`、`title`、`tokenUsage`、`available_commands` 等 session meta 变更 SHALL 通过 `electron/main/infra/storage/session-store.ts` 提供的统一 API 完成；主进程其他模块 MUST NOT 自行执行 `load -> merge -> save` 的整对象回写。

#### Scenario: 首次创建 session 时写入持久化文件

- **WHEN** 新 ACP session 创建成功
- **THEN** 系统在 `getDataSubPath('projects')/<encodeProjectPath(project.path)>/sessions/<sessionId>.json` 写入 `{ sessionId, acpSessionId, agentId, title, turnCount, tokenUsage, createdAt, updatedAt }`
- **AND** `available_commands` 初始缺失
- **AND** `tokenUsage` 初始化为 `{ used: 0, size: 0 }`
- **AND** `tokenUsage.cost` 初始为 `undefined`
- **AND** `encodeProjectPath` 实现为：去掉路径开头的 `/`，将所有 `/` 替换为 `-`

#### Scenario: 存在持久化文件时恢复 ACP session 上下文

- **WHEN** IPC handler 收到 `chat:stream:message`，且 `getDataSubPath('projects')/<encodeProjectPath(project.path)>/sessions/<sessionId>.json` 存在
- **THEN** 读取文件中的 `acpSessionId` 用于 `resumeSession`
- **AND** 若文件包含 `available_commands`，主进程在构建 `Session` 返回值时将其映射为 `availableCommands`

#### Scenario: available_commands 持久化格式

- **WHEN** 主进程保存 session meta 且当前 session 已收到 commands
- **THEN** session meta JSON 使用 key `available_commands`
- **AND** 其值为 `AcpAvailableCommand[]`
- **AND** 不使用 `availableCommands` 作为落盘 key

#### Scenario: 第二轮对话启动不覆盖已有 available_commands

- **WHEN** 某 session 已在历史 turn 中持久化 `available_commands`
- **AND** 后续一次 `AcpSession.start()` 因 `newSession`、`resumeSession` 或其回退分支而更新 `acpSessionId`、`turnCount`、`updatedAt`
- **THEN** 本次写入通过 session-store 的字段级更新完成
- **AND** session meta 中既有的 `available_commands` SHALL 保持不变，除非本 turn 收到新的 `available_commands_update`
