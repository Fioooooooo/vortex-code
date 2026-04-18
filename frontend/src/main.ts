import "./assets/main.css";

import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import ui from "@nuxt/ui/vue-plugin";
import "./config/lucide-icon";

import App from "./App.vue";

const router = createRouter({
  routes: [{ path: "/", component: () => import("@renderer/pages/index.vue") }],
  history: createWebHistory(),
});

createApp(App).use(router).use(ui).mount("#app");
