import { resolve } from "path";
import { defineConfig } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import ui from "@nuxt/ui/vite";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "electron/main/index.ts"),
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "electron/preload/index.ts"),
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, "frontend"),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "frontend/index.html"),
        },
      },
    },
    resolve: {
      alias: {
        "@renderer": resolve(__dirname, "frontend/src"),
      },
    },
    plugins: [
      vue(),
      ui({ autoImport: { eslintrc: { enabled: true, filepath: "frontend/.eslintrc-auto-import.json" } } }),
    ],
  },
});
