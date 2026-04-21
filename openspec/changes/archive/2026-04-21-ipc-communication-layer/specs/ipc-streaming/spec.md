## ADDED Requirements

### Requirement: AI 聊天流式输出使用 MessagePort 通信

AI 聊天的流式响应 SHALL 通过 MessagePort 传输。Main 进程创建 `MessageChannelMain`，将 port2 通过 `postMessage` 传递给 renderer，在 port1 上逐 chunk 推送数据。

#### Scenario: 发起流式聊天

- **WHEN** renderer 调用 `window.api.chat.streamMessage(sessionId, prompt, callbacks)`
- **THEN** preload 调用 `ipcRenderer.invoke('chat:stream:message', { sessionId, prompt })` 发起流式请求
- **AND** main 创建 MessagePort 并通过 `event.sender.postMessage('chat:stream:port', null, [port2])` 传递给 renderer

#### Scenario: 接收流式 chunk

- **WHEN** main 进程从 AI 服务收到一个文本 chunk
- **THEN** 通过 port1 发送 `{ type: 'chunk', data: { content: string, tokenCount: number } }`
- **AND** preload 层调用 `callbacks.onChunk(data)` 回调

#### Scenario: 流式完成

- **WHEN** AI 服务完成响应
- **THEN** main 通过 port1 发送 `{ type: 'done', data: { totalTokens: number } }`
- **AND** 关闭 port1
- **AND** preload 层调用 `callbacks.onDone(data)` 回调

#### Scenario: 流式错误

- **WHEN** AI 服务返回错误
- **THEN** main 通过 port1 发送 `{ type: 'error', data: { code: string, message: string } }`
- **AND** 关闭 port1
- **AND** preload 层调用 `callbacks.onError(error)` 回调

### Requirement: 流式 API 封装为回调式接口

Preload 暴露给 renderer 的流式 API SHALL 采用回调式接口，renderer 不直接接触 MessagePort 对象。

#### Scenario: 流式 API 签名

- **WHEN** renderer 使用流式聊天功能
- **THEN** 调用签名为 `streamMessage(sessionId, prompt, { onChunk, onDone, onError })`
- **AND** 返回一个 `cancel()` 函数用于中断流式传输

#### Scenario: 取消流式传输

- **WHEN** 用户在流式输出过程中点击停止
- **THEN** renderer 调用 `cancel()` 函数
- **AND** preload 关闭 port 并通知 main 中断 AI 调用

### Requirement: 事件推送使用 ipcRenderer.on 订阅模式

非流式的事件推送（Pipeline 状态变更、下载进度等）SHALL 使用 `event.sender.send` + `ipcRenderer.on` 模式，preload 封装为订阅/取消订阅 API。

#### Scenario: 订阅 Pipeline 阶段状态变更

- **WHEN** renderer 调用 `window.api.pipeline.onStageChanged(handler)`
- **THEN** preload 内部注册 `ipcRenderer.on('pipeline:event:stageChanged', handler)`
- **AND** 返回 unsubscribe 函数

#### Scenario: 取消订阅

- **WHEN** 组件卸载时调用 unsubscribe 函数
- **THEN** preload 移除对应的 `ipcRenderer` 监听器
- **AND** 不影响其他组件的同事件监听

### Requirement: 所有订阅 API 必须返回取消订阅函数

Preload 暴露的每个事件订阅方法 SHALL 返回一个 `() => void` 类型的取消订阅函数，用于精确移除对应的监听器。

#### Scenario: 多组件同时订阅同一事件

- **WHEN** 两个组件分别调用 `window.api.pipeline.onStageChanged(handlerA)` 和 `window.api.pipeline.onStageChanged(handlerB)`
- **THEN** 两个 handler 均被注册
- **AND** 调用 handlerA 的 unsubscribe 不影响 handlerB

### Requirement: 事件推送的消息结构统一

所有事件推送消息 SHALL 包含 `type` 和 `payload` 字段，其中 type 标识事件类型，payload 为事件数据。

#### Scenario: Pipeline 阶段变更事件结构

- **WHEN** Pipeline 某阶段状态从 running 变为 passed
- **THEN** 推送消息为 `{ type: 'stageChanged', payload: { runId, stageId, status: 'passed', timestamp } }`

#### Scenario: 下载进度事件结构

- **WHEN** 文件下载进度更新
- **THEN** 推送消息为 `{ type: 'progress', payload: { taskId, percent, bytesDownloaded, totalBytes } }`
