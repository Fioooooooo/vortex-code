import "./assets/main.css";

import { createApp } from "vue";
import ui from "@nuxt/ui/vue-plugin";
import "./config/auto-icon";
import { router } from "./config/auto-routes";

import App from "./App.vue";

createApp(App).use(router).use(ui).mount("#app");
