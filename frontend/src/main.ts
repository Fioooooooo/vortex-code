import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";
import "./config/auto-icon";
import { router } from "./config/auto-routes";

import App from "./App.vue";

const pinia = createPinia();

createApp(App).use(pinia).use(router).use(ui).mount("#app");
