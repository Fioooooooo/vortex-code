## Context

FylloCode 的 Settings > Agents 页面目前通过 `netApi`（前端直接发起 HTTP 请求）从 ACP registry 拉取 agent 列表并展示卡片，无安装能力、无状态检测、无缓存。主进程的 `settings:listAgents` handler 是空壳（返回空数组）。

ACP registry 返回的每个 agent 包含 `distribution` 字段，支持三种分发方式：`npx`（npm 全局包）、`uvx`（uv Python 工具）、`binary`（平台特定二进制 archive）。

前端请求链路规范：component → store → `src/api/settings` → IPC → main。

## Goals / Non-Goals

**Goals:**

- registry 数据与图标本地缓存，弱网时降级展示
- 检测系统中已安装的 agent 及版本
- 支持三种分发方式的安装流程，含进度反馈
- 更新检测，区分 FylloCode 管理与用户自管理
- 前端请求链路全部迁移至 `settings:agents:*` IPC

**Non-Goals:**

- 卸载 agent
- 管理 agent 配置项
- 支持私有 registry 或自定义 registry URL
- 安装进度的精确百分比（npm/uv 输出不可靠）

## Decisions

### D1：主进程统一管理网络请求与缓存

**决策**：registry fetch、图标下载、安装命令全部在主进程执行，前端通过 IPC 获取数据。

**理由**：前端（renderer）直接发起网络请求绕过了 Electron 的安全模型；主进程可访问文件系统做持久化缓存；统一入口便于后续添加代理、超时、重试策略。

**备选**：保留 netApi 在前端直接请求 → 无法缓存到磁盘，弱网体验差，且与项目 IPC 规范不符。

### D2：缓存策略——registry TTL 24h，图标以内容哈希失效

**决策**：

- `registry-cache.json` 存储 `{ fetchedAt, data }`，TTL 24h；后台静默刷新
- 图标存为文件 `getDataSubPath('agents')/icons/<agent-id>`；每次后台刷新 registry 后，对比各 agent 的 `icon` URL 是否变化，URL 变了则删除对应缓存文件，下次 `getIcons` 时重新下载

**理由**：registry 顶层 `version` 字段不随 agent 更新而变化，不可靠；改用 `icon` URL 变化作为图标失效信号，更准确且无需额外哈希计算。

**备选**：全部 TTL → 图标频繁重下载，浪费带宽。

### D3：installed.json 以 agent id 为 key，记录管理方

**决策**：`getDataSubPath('agents')/installed.json` 结构：

```json
{
  "<agent-id>": {
    "managedBy": "fyllocode" | "user",
    "installMethod": "npx" | "uvx" | "binary",
    "installPath": "/usr/local/bin/claude",
    "installedVersion": "1.2.3",
    "installedAt": 1745000000000
  }
}
```

系统检测到已安装但无记录的 agent → `managedBy: "user"`。

**理由**：区分管理方是更新策略的基础；用 id 作 key 与 registry 数据对齐，查找 O(1)。

### D4：安装方式映射

| 分发类型 | 安装命令                                                      | 检测方式                          | 前置条件   |
| -------- | ------------------------------------------------------------- | --------------------------------- | ---------- |
| `npx`    | `npm install -g <package>`（全局，用户 npm prefix）           | `npm list -g <package> --depth=0` | Node + npm |
| `uvx`    | `uv tool install <package>`（全局，uv tools 目录）            | `uv tool list`                    | uv         |
| `binary` | 下载 archive → 解压 → 存 `getDataSubPath('agents')/bin/<id>/` | 检查文件是否存在                  | 无         |

binary 类型按 `process.platform + process.arch` 选对应 archive entry。

### D5：IPC 通道命名（`settings:agents:*`）

| 通道                              | 类型      | 说明                                        |
| --------------------------------- | --------- | ------------------------------------------- |
| `settings:agents:getRegistry`     | invoke    | 返回缓存或网络 registry 数据                |
| `settings:agents:refreshRegistry` | invoke    | 强制刷新缓存                                |
| `settings:agents:getIcons`        | invoke    | 批量返回 `Record<id, base64DataURL>`        |
| `settings:agents:detectStatus`    | invoke    | 检测所有 agent 安装状态                     |
| `settings:agents:install`         | invoke    | 安装指定 agent                              |
| `settings:agents:registryUpdated` | on (push) | 后台刷新完成后推送新数据                    |
| `settings:agents:installProgress` | on (push) | 安装进度推送 `{ agentId, status, message }` |

### D6：前端链路

```
SettingsAgents.vue / AgentCard.vue
  ↓
useSettingsStore (agentRegistry, agentStatuses, installProgress)
  ↓
src/api/settings.ts (agentsApi)
  ↓
window.api.settings.agents.*  (preload contextBridge)
  ↓
IPC → electron/main/agents/
```

## Risks / Trade-offs

- **npm/uv 环境缺失** → 安装前检测环境，缺失时在 UI 提示"需要先安装 Node.js / uv"，不直接报错
- **binary 下载失败（网络中断）** → 下载到临时文件，完成后再移动，失败时清理临时文件，不污染安装目录
- **用户自管理 agent 被覆盖** → 更新前弹确认对话框，明确告知"将由 FylloCode 接管"
- **installed.json 与实际状态不一致**（如用户手动删除了 agent）→ `detectStatus` 每次都重新检测文件系统，不信任缓存状态
- **并发安装** → 同一时间只允许安装一个 agent，安装中的 agent 按钮禁用

## Migration Plan

1. 新增 `shared/types/agents.ts` 共享类型
2. 新增主进程 `electron/main/agents/` 模块（不影响现有 handler）
3. 在 `shared/types/channels.ts` 新增 `AgentsChannels`
4. 扩展 preload `window.api.settings.agents`
5. 新增 `src/api/settings.ts` 中的 `agentsApi`
6. 扩展 `useSettingsStore` 加入 agent 状态
7. 更新 `SettingsAgents.vue` 和 `AgentCard.vue`，移除 `netApi` 调用
8. 全程不删除 `netApi`，仅在 Agents 页面停止使用

## Open Questions

- binary 类型安装后是否需要将 `getDataSubPath('agents')/bin/<id>/` 加入 PATH？（当前方案：不修改 PATH，FylloCode 内部调用时使用绝对路径）
