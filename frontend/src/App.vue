<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useProjectStore } from "@renderer/stores/project";
import WelcomePage from "@renderer/components/WelcomePage.vue";

const projectStore = useProjectStore();
const router = useRouter();

watch(
  () => projectStore.currentProject,
  (project) => {
    if (project) {
      router.push("/workspace");
    } else {
      router.push("/");
    }
  },
  { immediate: true }
);
</script>

<template>
  <UApp>
    <WelcomePage v-if="!projectStore.currentProject" />
    <RouterView v-else />
  </UApp>
</template>
