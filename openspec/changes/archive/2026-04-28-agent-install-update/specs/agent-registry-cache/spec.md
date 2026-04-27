## ADDED Requirements

### Requirement: Registry 数据本地缓存

主进程 SHALL 将从 ACP registry 获取的数据缓存到 `getDataSubPath('agents')/registry-cache.json`，结构为 `{ fetchedAt: number, data: RegistryData }`。缓存 TTL 为 24 小时。

#### Scenario: 缓存命中（TTL 内）

- **WHEN** 前端调用 `settings:agents:getRegistry`，且缓存存在且 `fetchedAt` 距今不超过 24 小时
- **THEN** 主进程直接返回缓存数据，不发起网络请求

#### Scenario: 缓存过期触发后台刷新

- **WHEN** 前端调用 `settings:agents:getRegistry`，且缓存已过期（超过 24 小时）
- **THEN** 主进程先返回过期缓存数据（保证响应速度），同时在后台发起网络请求；网络请求成功后更新缓存并通过 `settings:agents:registryUpdated` 推送新数据给前端

#### Scenario: 无缓存且网络可用

- **WHEN** 前端调用 `settings:agents:getRegistry`，且本地无缓存
- **THEN** 主进程发起网络请求，成功后写入缓存并返回数据

#### Scenario: 无缓存且网络不可用

- **WHEN** 前端调用 `settings:agents:getRegistry`，且本地无缓存，且网络请求失败
- **THEN** 主进程返回错误响应，前端展示"加载失败"状态

#### Scenario: 有缓存且网络不可用

- **WHEN** 前端调用 `settings:agents:getRegistry`，且缓存存在（无论是否过期），且网络请求失败
- **THEN** 主进程返回缓存数据，不报错

#### Scenario: 强制刷新

- **WHEN** 前端调用 `settings:agents:refreshRegistry`
- **THEN** 主进程忽略缓存 TTL，立即发起网络请求；成功后更新缓存并返回新数据；失败时返回错误

### Requirement: Agent 图标本地缓存

主进程 SHALL 将 agent 图标下载后存储为文件 `getDataSubPath('agents')/icons/<agent-id>`，并在 `settings:agents:getIcons` 调用时以 base64 data URL 形式批量返回。每次后台刷新 registry 后，对比各 agent 的 `icon` URL 是否变化，URL 变化时删除对应缓存文件，下次 `getIcons` 调用时重新下载。

#### Scenario: 图标缓存命中

- **WHEN** 前端调用 `settings:agents:getIcons`，且所有 agent 图标文件均已存在
- **THEN** 主进程读取文件并返回 `Record<agentId, base64DataURL>`，不发起网络请求

#### Scenario: 部分图标缺失

- **WHEN** 前端调用 `settings:agents:getIcons`，且部分 agent 图标文件不存在
- **THEN** 主进程对缺失图标发起下载，下载完成后写入文件；返回所有已成功获取的图标（下载失败的 id 不包含在结果中）

#### Scenario: Icon URL 变化触发图标重新下载

- **WHEN** 后台刷新 registry 时，某 agent 的 `icon` URL 与缓存中记录的不同
- **THEN** 主进程删除该 agent 对应的图标缓存文件，在下次 `getIcons` 调用时重新下载
