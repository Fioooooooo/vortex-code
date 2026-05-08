## Why

主窗口当前始终以 `900x670` 启动，这对 FylloCode 现有的多栏桌面布局偏紧；用户每次重启后还要重复调整窗口大小，也打断了桌面应用应有的连续工作流。

## What Changes

- 调整主窗口的默认启动尺寸，使首屏布局在常见桌面分辨率下更舒展
- 为主窗口增加最小尺寸约束，避免侧栏和内容区被压缩到难以使用
- 记录主窗口上一次的正常窗口 bounds，并在下次启动时恢复
- 当保存的窗口状态失效或已离开当前显示区域时，回退到安全的默认尺寸

## Capabilities

### New Capabilities

- `main-window-state`: 定义主窗口的默认尺寸、最小尺寸和跨启动恢复行为

### Modified Capabilities

None.

## Impact

- `electron/main/bootstrap/window.ts`
- `electron/main/infra/paths/index.ts`
- `electron/main/infra/storage/*`（新增窗口状态持久化）
- `electron/main/__tests__/bootstrap/*`
- `electron/main/__tests__/infra/*`
- 无 IPC、preload 或 renderer API 契约变更
