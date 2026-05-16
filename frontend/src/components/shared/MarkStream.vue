<script setup lang="ts">
import MarkdownRender from "markstream-vue";

defineProps<{
  content: string;
  isStreaming: boolean;
}>();
</script>

<template>
  <MarkdownRender
    :content="content"
    :final="!isStreaming"
    :max-live-nodes="isStreaming ? 0 : undefined"
    :batch-rendering="true"
    :render-batch-size="16"
    :render-batch-delay="8"
    :render-batch-budget-ms="4"
    :fade="!isStreaming"
    :typewriter="isStreaming"
    :smooth-streaming="isStreaming ? 'auto' : false"
  />
</template>

<style scoped>
.markstream-vue :deep(.paragraph-node) {
  margin-top: 0;
}
</style>
