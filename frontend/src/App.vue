<script setup lang="ts">
import { useProjectStore } from "@renderer/stores/project";
import WelcomePage from "@renderer/components/WelcomePage.vue";

const projectStore = useProjectStore();
</script>

<template>
  <UApp>
    <WelcomePage v-if="!projectStore.currentProject" />
    <RouterView v-else />
  </UApp>
</template>
