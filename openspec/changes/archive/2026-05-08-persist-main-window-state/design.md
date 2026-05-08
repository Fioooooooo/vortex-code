## Context

当前主窗口在 `electron/main/bootstrap/window.ts` 中直接以 `900x670` 创建，没有 `minWidth` / `minHeight`，也没有任何窗口状态持久化。项目现有的主进程持久化约定是：开发环境写入仓库根目录 `data/`，生产环境写入 Electron `userData`；窗口相关行为集中在 bootstrap 层处理。

## Goals / Non-Goals

**Goals:**

- 为首次启动提供更适合当前桌面布局的默认窗口尺寸
- 为主窗口提供明确的最小尺寸约束
- 在应用重启后恢复上一次可用的主窗口大小和位置
- 避免因为显示器切换或分辨率变化把窗口恢复到不可见区域

**Non-Goals:**

- 新增用户可配置的窗口尺寸设置页
- 为多窗口场景设计通用窗口管理框架
- 改动现有 `window` IPC handler 或 renderer 调用方式

## Decisions

### 1. 将窗口状态建模为独立的 main-process 持久化文件

窗口状态不进入当前未完成持久化的 settings store，而是在 `electron/main/infra/storage/` 下新增专用 store。数据使用一个小型 JSON 文件保存主窗口的 normal bounds 和是否处于 maximized 状态，路径沿用现有 `data/` / `userData` 约定。

### 2. 默认尺寸使用固定目标值，首次启动时直接应用

主窗口的默认目标尺寸提升为 `1280x760`，最小尺寸设置为 `960x640`。这些值足以容纳当前的 ActivityBar、侧栏和主内容区，同时仍兼顾常见笔记本分辨率。

### 3. 恢复逻辑只接受当前显示环境中的安全 bounds

启动时若存在已保存状态，则优先恢复；但恢复前会根据当前显示器 work area 对保存的 bounds 做校验和裁剪。若状态缺失、损坏或完全落在当前显示区域之外，则回退到默认尺寸。

### 4. 保存 normal bounds，并额外记录 maximized 状态

非最大化窗口直接保存当前 bounds；最大化窗口保存 `getNormalBounds()` 并记录 `isMaximized: true`。这样下次启动时既能保留用户上次的窗口尺寸，也能在需要时恢复最大化状态。

## Risks / Trade-offs

- [风险] 默认尺寸比当前更大，在小屏设备上可能接近屏幕边界。→ 通过恢复前校验和基于显示器 work area 的安全裁剪降低风险。
- [风险] 新增本地 JSON 文件后，损坏文件可能导致恢复失败。→ 读取失败时直接回退到默认窗口状态，不阻塞应用启动。
- [风险] 仅记录主窗口状态，未来多窗口需求仍需单独设计。→ 本次显式限定为单主窗口场景，避免过度抽象。
