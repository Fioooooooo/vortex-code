<script setup lang="ts">
import { useChatStore } from "@renderer/stores/chat";
import type { FileOpMessage } from "@renderer/types/chat";

defineProps<{
  message: FileOpMessage;
}>();

const chatStore = useChatStore();

function handleClick(filePath: string): void {
  chatStore.openDiffPanel(filePath);
}

function getOpIcon(changeType: string): string {
  switch (changeType) {
    case "added":
      return "i-lucide-file-plus";
    case "modified":
      return "i-lucide-file-pen";
    case "deleted":
      return "i-lucide-file-minus";
    default:
      return "i-lucide-file";
  }
}

function getOpColor(changeType: string): string {
  switch (changeType) {
    case "added":
      return "text-success border-success/30 bg-success/5";
    case "modified":
      return "text-warning border-warning/30 bg-warning/5";
    case "deleted":
      return "text-error border-error/30 bg-error/5";
    default:
      return "text-muted border-muted";
  }
}
</script>

<template>
  <div class="flex gap-3">
    <div class="w-7 h-7 rounded-full bg-info flex items-center justify-center shrink-0 mt-0.5">
      <UIcon name="i-lucide-files" class="w-4 h-4 text-white" />
    </div>
    <div class="flex-1 min-w-0 space-y-1.5">
      <div
        v-for="op in message.operations"
        :key="op.filePath"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
        :class="getOpColor(op.changeType)"
        @click="handleClick(op.filePath)"
      >
        <UIcon :name="getOpIcon(op.changeType)" class="w-4 h-4 shrink-0" />
        <code class="text-xs font-mono truncate flex-1">{{ op.filePath }}</code>
        <span class="text-xs font-medium shrink-0">{{ op.summary }}</span>
        <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 shrink-0 opacity-50" />
      </div>
    </div>
  </div>
</template>
