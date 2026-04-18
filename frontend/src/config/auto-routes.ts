import { createRouter, createWebHistory } from "vue-router";
import { routes, handleHotUpdate } from "vue-router/auto-routes";

export const router = createRouter({
  routes,
  history: createWebHistory(),
});

if (import.meta.hot) {
  handleHotUpdate(router);
}
