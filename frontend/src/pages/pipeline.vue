<script setup lang="ts">
import PipelineSidebar from "@renderer/components/pipeline/PipelineSidebar.vue";
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <div class="h-full shrink-0">
      <PipelineSidebar />
    </div>

    <main class="flex-1 flex flex-col min-w-0 bg-default overflow-hidden" />
  </div>
</template>
