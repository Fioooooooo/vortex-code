## Context

FylloCode 是一个 Electron + Vue 3 桌面应用（electron-vite 构建），定位为 AI 编程助手。前端已完成 5 个页面（Welcome、Chat、Pipeline、Integration、Settings）的 UI 和 Pinia store，类型定义覆盖了 chat、pipeline、integration、settings、project 五个业务域。但主进程与渲染进程之间几乎没有通信——preload 暴露的 `window.api` 是空对象，main 仅有一个测试用 `ping` handler。所有数据均为 store 内的 mock 数据。

技术栈约束：

- Electron（contextIsolation 已开启，sandbox: false）
- electron-vite 构建，preload 和 main 分别编译
- TypeScript 全栈
- 前端使用 @nuxt/ui v4 + Pinia + Vue Router
- AI SDK：`@ai-sdk/vue` + `ai`（已安装但未接入）

## Goals / Non-Goals

**Goals:**

- 建立一套类 RESTful 的 IPC 通信规范，使 renderer 调用体验接近 REST SDK
- 统一请求-响应结构（`IpcResponse<T>`），包含成功/失败/错误码
- 为 AI 聊天流式输出提供 MessagePort 通信方案
- 为进度/状态推送提供 `ipcRenderer.on` 事件订阅方案
- 确保 main/preload/renderer 三层共享 TypeScript 类型
- preload 作为安全边界，renderer 不接触 IPC channel 字符串

**Non-Goals:**

- 不实现具体的业务逻辑（如真正的 AI 调用、数据库操作）
- 不改造现有 Pinia store（store 接入 IPC 是后续工作）
- 不引入额外的 IPC 框架（如 electron-trpc、comlink）
- 不处理 Electron 自动更新、原生菜单等非业务 IPC

## Decisions

**1. Channel 命名采用 `domain:action` 格式**

- 格式：`chat:sendMessage`、`project:list`、`settings:get`
- 理由：比 `v1/chat/sendMessage` 更简洁，Electron channel 不是 HTTP URL，不需要路径语义；比 `chat-send-message` 更有层次感，便于按域过滤日志
- 替代方案：`domain/action`（斜杠容易与路径混淆）、`domain.action`（与 JS 属性访问混淆）

**2. Preload 按业务域拆分文件，对外暴露领域 API**

- 结构：`preload/api/chat.ts`、`preload/api/project.ts` 等，在 `preload/index.ts` 中组合后通过 `contextBridge.exposeInMainWorld('api', { chat, project, ... })` 暴露
- 理由：renderer 调用 `window.api.chat.sendMessage()` 而非 `ipcRenderer.invoke('chat:sendMessage')`，隔离 IPC 细节，便于搜索和重构
- 替代方案：单文件暴露所有 API（文件过大，职责不清）；通用 `invoke(channel)` 透传（安全边界模糊，类型难维护）

**3. Main 按业务域拆分 handler，统一注册**

- 结构：`main/ipc/chat.ts` 导出 `registerChatHandlers()`，在 `main/ipc/index.ts` 中统一调用
- 理由：避免 main/index.ts 膨胀，每个域的 handler 独立维护
- 替代方案：全部写在 main/index.ts（不可维护）

**4. 统一响应结构 `IpcResponse<T>`**

```ts
interface IpcResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}
```

- 理由：renderer 层可以统一处理成功/失败，不需要 try-catch 每个调用；错误码便于前端做差异化提示
- 替代方案：直接抛异常让 invoke 的 Promise reject（错误信息在序列化过程中容易丢失，且 renderer 需要 try-catch 每个调用）

**5. 流式通信采用 MessagePort（AI 聊天）+ ipcRenderer.on（事件推送）双轨方案**

- MessagePort 用于 AI 聊天流式输出：每次流式会话创建独立 port，数据量大、频率高、生命周期明确（会话开始到结束）
- `ipcRenderer.on` 用于 Pipeline 状态变更、下载进度等：频率较低、多个组件可能同时监听、生命周期与组件绑定
- 理由：MessagePort 是点对点通道，性能更好且不会污染全局事件；`ipcRenderer.on` 更适合广播式的状态通知
- 替代方案：全部用 `ipcRenderer.on`（AI 流式场景性能不够）；全部用 MessagePort（简单事件推送过于复杂）

**6. 共享类型放在项目根目录 `shared/types/`**

- 项目根目录新增 `shared/` 目录，仅包含类型定义和 `as const` 常量
- 在 `electron.vite.config.ts` 中为 main/preload/renderer 三个构建目标配置 `@shared` 路径别名指向 `shared/`
- 在 `tsconfig` 中添加对应的 `paths` 映射
- 理由：`shared/` 独立于 `electron/` 和 `frontend/`，职责清晰；纯类型 import 编译后被擦除，不产生运行时跨进程依赖；channel 常量用 `as const` 定义，各构建目标各自打包一份，体积可忽略
- 替代方案：放在 `electron/shared/`（frontend 引用路径不自然）；放在 `src/shared/`（项目无顶层 `src/` 目录）

## Risks / Trade-offs

- **[Risk]** MessagePort 在 contextIsolation 下的序列化限制 → **Mitigation**: preload 中通过 `ipcRenderer.once` 接收 port，不直接暴露 MessagePort 对象给 renderer，而是封装为回调 API
- **[Risk]** 共享类型在 electron-vite 构建中的路径解析 → **Mitigation**: 在 `electron.vite.config.ts` 中为 main/preload/renderer 三个构建目标配置 `@shared` 别名指向项目根目录的 `shared/`，同时在 tsconfig 中添加 paths 映射
- **[Risk]** preload 中 `ipcRenderer.on` 的监听器泄漏 → **Mitigation**: 所有订阅 API 必须返回 unsubscribe 函数，preload 层维护监听器引用以支持精确移除
- **[Trade-off]** 不引入 electron-trpc 等框架，手动维护类型映射 → 短期工作量略大，但避免引入额外依赖和学习成本，且项目域数量有限（5-6 个），手动维护可控
