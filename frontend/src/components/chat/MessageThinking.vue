<script setup lang="ts">
import { ref } from "vue";
import type { ThinkingMessage } from "@shared/types/chat";

defineProps<{
  message: ThinkingMessage;
}>();

const expanded = ref(false);
</script>

<template>
  <div class="flex gap-3">
    <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
      <UIcon name="i-lucide-brain" class="w-4 h-4 text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/10 cursor-pointer hover:bg-secondary/15 transition-colors"
        @click="expanded = !expanded"
      >
        <UIcon
          :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="w-3.5 h-3.5 text-muted shrink-0"
        />
        <UIcon name="i-lucide-loader" class="w-3.5 h-3.5 text-secondary animate-spin shrink-0" />
        <span class="text-sm text-muted italic">{{ message.summary }}</span>
      </div>
      <div
        v-if="expanded"
        class="mt-1 px-3 py-2 rounded-lg bg-secondary/5 text-sm text-muted whitespace-pre-wrap"
      >
        {{ message.content }}
      </div>
    </div>
  </div>
</template>
