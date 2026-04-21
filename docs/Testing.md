# 测试规范

## 目录结构

```
frontend/src/__tests__/
├── setup.ts              # 全局 mock / stub（每次测试前自动执行）
├── components/pages/     # 页面组件测试
├── composables/          # composable 测试
└── utils/                # 工具函数测试
```

测试文件命名：`*.spec.ts`，放在 `__tests__/` 对应子目录，不分散在源码目录内。

## 运行命令

```bash
pnpm test             # 单次运行所有测试（CI 用）
pnpm test:watch       # 监听模式
pnpm test:coverage    # 生成覆盖率报告（输出到 ./coverage/）
# 运行单个文件
pnpm vitest run frontend/src/__tests__/components/pages/index.spec.ts
```

## @nuxt/ui 组件测试适配

`@nuxt/ui` 组件在 Vite 构建时由插件自动注入，Vitest 不经过该插件，因此：

1. **composables**（如 `useToast`）在 `setup.ts` 中用 `vi.mock` 手动 mock
2. **UI 组件**在 `setup.ts` 中全局 stub，避免 `Failed to resolve component` 警告

### 当前 stub 清单（`setup.ts`）

| 组件                                       | Stub 方式                               | 说明               |
| ------------------------------------------ | --------------------------------------- | ------------------ |
| `RouterView`                               | `true`（空元素）                        | —                  |
| `UApp`                                     | `true`                                  | —                  |
| `UButton`                                  | `<button @click>` 保留 click 事件       | 可测试点击交互     |
| `UInput`                                   | `<input>` 保留 v-model                  | 可测试输入双向绑定 |
| `UCard`                                    | `<div>` 保留 header/default/footer slot | 可测试 slot 内容   |
| `UBadge`、`USelect`、`UCheckbox`、`UAlert` | `true`                                  | 无需交互验证       |

**新增 @nuxt/ui 组件时：**

- 需要交互测试 → 在 `setup.ts` 添加有意义的 stub（参考 `UButton`）
- 纯展示组件 → 设为 `true`

### Mock 约定

| 目标                         | 方式                                        | 位置         |
| ---------------------------- | ------------------------------------------- | ------------ |
| `useToast()` 等 composables  | `vi.mock('@nuxt/ui/composables')`           | `setup.ts`   |
| `window.electron`（IPC API） | 在 `setup.ts` 中挂载到 `globalThis`         | `setup.ts`   |
| `setTimeout` / `setInterval` | `vi.useFakeTimers()` / `vi.useRealTimers()` | 单个测试文件 |

## 各类测试策略

### 组件测试

聚焦**状态与交互逻辑**，不验证 UI 库内部渲染：

```ts
import { mount } from "@vue/test-utils";
import MyComponent from "@renderer/components/MyComponent.vue";

test("点击按钮触发事件", async () => {
  const wrapper = mount(MyComponent);
  await wrapper.find("button").trigger("click");
  expect(wrapper.emitted("submit")).toBeTruthy();
});
```

### Composable 测试

重点测试**状态流转、副作用时机、边界条件**。涉及 IPC 的 composable 需 mock `window.electron`：

```ts
// 在测试文件顶部或 setup.ts 中
globalThis.window = {
  electron: { ipcRenderer: { invoke: vi.fn(), on: vi.fn() } },
} as unknown as Window;
```

### 工具函数测试

纯函数，直接用 Vitest API，不依赖 Vue 运行时。

## 覆盖率

- 报告输出到 `./coverage/`
- 已排除：`__tests__/`、`config/`、`assets/`、类型声明文件
- 目标：Statements > 80%
