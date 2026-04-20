<script setup lang="ts">
import { onMounted, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import WelcomeView from "@renderer/components/WelcomeView.vue";
import { useProjectStore } from "@renderer/stores/project";

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const protectedRoutes = ["/chat", "/pipeline", "/integration"];

watchEffect(() => {
  const isProtectedRoute = protectedRoutes.some((path) => route.path.startsWith(path));

  if (isProtectedRoute && !projectStore.hasCurrentProject) {
    void router.replace("/");
  }
});

onMounted(() => {
  if (projectStore.hasCurrentProject && route.path === "/") {
    void router.replace("/chat");
  }
});
</script>

<template>
  <WelcomeView v-if="!projectStore.hasCurrentProject" />
  <RouterView v-else />
</template>
