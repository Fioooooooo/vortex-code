<script setup lang="ts">
import type { TextMessage } from "@renderer/types/workspace";

defineProps<{
  message: TextMessage;
}>();
</script>

<template>
  <div class="flex gap-3">
    <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
      <UIcon name="i-lucide-bot" class="w-4 h-4 text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="prose prose-sm dark:prose-invert max-w-none text-sm text-highlighted">
        <!-- Simple markdown rendering -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="renderMarkdown(message.content)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function renderMarkdown(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/gim, '<code class="px-1 py-0.5 rounded bg-muted text-xs font-mono">$1</code>')
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/\n/gim, "<br>");
}
</script>
