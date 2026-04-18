import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import ui from "@nuxt/ui/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue(),
    ui({
      autoImport: {
        eslintrc: { enabled: false },
      },
    }),
  ],
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["frontend/src/**/*.{test,spec}.{ts,vue}"],
    setupFiles: ["frontend/src/__tests__/setup.ts"],
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["frontend/src"],
      exclude: [
        "frontend/src/**/*.d.ts",
        "frontend/src/typed-router.d.ts",
        "frontend/src/vite-env.d.ts",
        "frontend/src/__tests__/**",
        "frontend/src/config/**",
        "frontend/src/assets/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "frontend/src"),
    },
  },
});
