import { defineConfig } from "eslint/config";
import tseslint from "@electron-toolkit/eslint-config-ts";
import eslintConfigPrettier from "@electron-toolkit/eslint-config-prettier";
import eslintPluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let autoImportGlobals = {};
try {
  autoImportGlobals = require("./frontend/.eslintrc-auto-import.json").globals;
} catch {
  // file not yet generated, run dev once to generate it
}

export default defineConfig(
  { ignores: ["**/node_modules", "**/dist", "**/out", "**/data"] },
  tseslint.configs.recommended,
  eslintPluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        extraFileExtensions: [".vue"],
        parser: tseslint.parser,
      },
      globals: autoImportGlobals,
    },
  },
  {
    files: ["**/*.{ts,mts,tsx,vue}"],
    rules: {
      "vue/require-default-prop": "off",
      "vue/multi-word-component-names": "off",
      "vue/block-lang": [
        "error",
        {
          script: {
            lang: "ts",
          },
        },
      ],
    },
  },
  eslintConfigPrettier
);
