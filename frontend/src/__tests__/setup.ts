import { config } from "@vue/test-utils";
import { vi } from "vitest";

// ─────────────────────────────────────────────
// Mock @nuxt/ui auto-imported composables
// 在 Vite 构建时 @nuxt/ui/vite 插件会自动注入 import 语句，
// 但在 vitest 中不经过该插件，因此需要手动 mock
// ─────────────────────────────────────────────
const mockToast = { add: vi.fn() };

vi.mock("@nuxt/ui/composables", () => ({
  useToast: vi.fn(() => mockToast),
}));

// ─────────────────────────────────────────────
// Stub 全局自动注册的第三方组件
// @nuxt/ui 组件在 vite 构建时由插件自动导入注册，
// 测试中需手动 stub 以避免 "Failed to resolve component" 警告
// ─────────────────────────────────────────────
config.global.stubs = {
  // vue-router
  RouterView: true,

  // @nuxt/ui layout
  UApp: true,

  // @nuxt/ui components — 保留基础交互能力用于测试
  UButton: {
    template: "<button @click=\"$emit('click')\"><slot /></button>",
    props: ["loading", "icon", "color", "variant", "size"],
  },
  UBadge: true,
  UInput: {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ["modelValue", "placeholder"],
  },
  USelect: true,
  UCheckbox: true,
  UCard: {
    template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
  },
  UAlert: true,
};
