<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import ActivityBar from "@renderer/components/layout/ActivityBar.vue";
import AppHeader from "@renderer/components/layout/AppHeader.vue";
import AppLayout from "@renderer/layouts/AppLayout.vue";
import { useProjectStore } from "@renderer/stores/project";

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const protectedRoutes = ["/workspace", "/pipeline", "/extension", "/setting"];

const activeItem = computed(() => {
  if (route.path.startsWith("/pipeline")) return "pipeline";
  if (route.path.startsWith("/extension")) return "extension";
  if (route.path.startsWith("/setting")) return "setting";
  return "workspace";
});

watchEffect(() => {
  const isProtectedRoute = protectedRoutes.some((path) => route.path.startsWith(path));

  if (isProtectedRoute && !projectStore.hasCurrentProject) {
    void router.replace("/welcome");
  }
});
</script>

<template>
  <AppLayout>
    <template #header>
      <AppHeader />
    </template>

    <template #side>
      <ActivityBar :active-item="activeItem" />
    </template>

    <RouterView />
  </AppLayout>
</template>
