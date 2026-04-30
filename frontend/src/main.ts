import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";
import "./config/auto-icon";
import { router } from "./config/auto-routes";

import { registerBootstrapTasks, runBootstrapTasks } from "./bootstrap";

import App from "./App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia).use(router).use(ui).mount("#app");

registerBootstrapTasks();
void runBootstrapTasks({ pinia, router });
