<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectStore } from "@renderer/stores/project";

const router = useRouter();
const projectStore = useProjectStore();

onMounted(() => {
  void router.replace(projectStore.hasCurrentProject ? "/workspace" : "/welcome");
});
</script>

<template>
  <div />
</template>
