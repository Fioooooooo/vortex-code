## MODIFIED Requirements

### Requirement: Agent 安装状态检测

主进程 SHALL 通过 `acp:detectStatus` 检测系统中每个 registry agent 的安装状态，返回 `AcpAgentStatus[]`，每项包含 `id`、`installed`、`detectedVersion`（可选）、`managedBy`（`"fyllocode" | "user" | null`）。

#### Scenario: 检测到已安装（FylloCode 管理）

- **WHEN** 调用 `detectStatus`，且 `installed.json` 中存在该 agent 记录，且对应命令/文件在系统中可找到
- **THEN** 返回 `installed: true, managedBy: "fyllocode", detectedVersion: <版本号>`

#### Scenario: 检测到已安装（用户自行安装）

- **WHEN** 调用 `detectStatus`，且系统中可找到该 agent 命令，但 `installed.json` 中无记录
- **THEN** 返回 `installed: true, managedBy: "user", detectedVersion: <版本号>`，并在 `installed.json` 中写入 `managedBy: "user"` 记录

#### Scenario: 未安装

- **WHEN** 调用 `detectStatus`，且系统中找不到该 agent 命令/文件
- **THEN** 返回 `installed: false, managedBy: null`

### Requirement: 安装 npx 类型 agent

主进程 SHALL 通过 `npm install -g <package>` 安装 `distribution.npx` 类型的 agent，安装前检测 npm 环境，安装过程中通过 `acp:installProgress` 推送进度，完成后写入 `installed.json`。

#### Scenario: npm 环境缺失

- **WHEN** 调用 `acp:install`，agent 为 npx 类型，且系统中找不到 npm
- **THEN** 返回错误 `{ code: "ENV_MISSING", message: "需要先安装 Node.js" }`，不执行安装

#### Scenario: 安装成功

- **WHEN** 调用 `acp:install`，agent 为 npx 类型，npm 可用
- **THEN** 执行 `npm install -g <package>`，推送 `{ agentId, status: "installing", message: "正在安装..." }`；完成后推送 `{ agentId, status: "done" }`，并在 `installed.json` 写入 `{ managedBy: "fyllocode", installMethod: "npx", installedVersion, installedAt }`

#### Scenario: 安装失败

- **WHEN** `npm install -g` 命令以非零退出码结束
- **THEN** 推送 `{ agentId, status: "error", message: <stderr 摘要> }`，不写入 `installed.json`

### Requirement: 安装 uvx 类型 agent

主进程 SHALL 通过 `uv tool install <package>` 安装 `distribution.uvx` 类型的 agent，安装前检测 uv 环境。

#### Scenario: uv 环境缺失

- **WHEN** 调用 `acp:install`，agent 为 uvx 类型，且系统中找不到 uv
- **THEN** 返回错误 `{ code: "ENV_MISSING", message: "需要先安装 uv" }`，不执行安装

#### Scenario: 安装成功

- **WHEN** 调用 `acp:install`，agent 为 uvx 类型，uv 可用
- **THEN** 执行 `uv tool install <package>`，推送进度；完成后写入 `installed.json`，`installMethod: "uvx"`

### Requirement: 安装 binary 类型 agent

主进程 SHALL 根据当前平台（`process.platform + process.arch`）选择对应 archive，下载到临时文件后解压至 `getDataSubPath('agents')/bin/<agent-id>/`，完成后写入 `installed.json`。

#### Scenario: 当前平台无对应 binary

- **WHEN** 调用 `acp:install`，agent 为 binary 类型，但 `distribution.binary` 中无当前平台的 entry
- **THEN** 返回错误 `{ code: "PLATFORM_UNSUPPORTED", message: "当前平台不支持此安装方式" }`

#### Scenario: 下载并安装成功

- **WHEN** 调用 `acp:install`，agent 为 binary 类型，当前平台有对应 entry
- **THEN** 下载 archive 到临时文件，推送 `{ agentId, status: "downloading" }`；解压到 `getDataSubPath('agents')/bin/<agent-id>/`，推送 `{ agentId, status: "installing" }`；完成后推送 `{ agentId, status: "done" }`，写入 `installed.json`，`installMethod: "binary", installPath: <解压路径>`

#### Scenario: 下载中断

- **WHEN** binary 下载过程中网络中断
- **THEN** 清理临时文件，推送 `{ agentId, status: "error", message: "下载失败，请重试" }`，不写入 `installed.json`

### Requirement: 并发安装限制

同一时间 SHALL 只允许一个 agent 处于安装中状态。

#### Scenario: 尝试并发安装

- **WHEN** 已有 agent 正在安装时，调用 `acp:install` 安装另一个 agent
- **THEN** 返回错误 `{ code: "INSTALL_BUSY", message: "请等待当前安装完成" }`
