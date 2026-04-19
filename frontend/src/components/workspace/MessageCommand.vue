<script setup lang="ts">
import { ref } from "vue";
import type { CommandMessage } from "@renderer/types/workspace";

defineProps<{
  message: CommandMessage;
}>();

const expanded = ref(false);
</script>

<template>
  <div class="flex gap-3">
    <div
      class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
      :class="message.success ? 'bg-success' : 'bg-error'"
    >
      <UIcon :name="message.success ? 'i-lucide-terminal' : 'i-lucide-alert-triangle'" class="w-4 h-4 text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="rounded-lg border overflow-hidden" :class="message.success ? 'border-success/30' : 'border-error/30'">
        <!-- Command -->
        <div
          class="px-3 py-2 flex items-center gap-2 cursor-pointer"
          :class="message.success ? 'bg-success/5' : 'bg-error/5'"
          @click="expanded = !expanded"
        >
          <UIcon
            :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="w-3.5 h-3.5 text-muted shrink-0"
          />
          <UIcon name="i-lucide-dollar-sign" class="w-3.5 h-3.5 text-muted shrink-0" />
          <code class="text-xs font-mono text-highlighted">{{ message.command }}</code>
          <UIcon
            v-if="message.success"
            name="i-lucide-check-circle"
            class="w-3.5 h-3.5 text-success shrink-0 ml-auto"
          />
          <UIcon v-else name="i-lucide-x-circle" class="w-3.5 h-3.5 text-error shrink-0 ml-auto" />
        </div>
        <!-- Output -->
        <div
          v-if="expanded"
          class="px-3 py-2 text-xs font-mono text-muted whitespace-pre-wrap border-t"
          :class="message.success ? 'border-success/20' : 'border-error/20'"
        >
          {{ message.output }}
        </div>
      </div>
    </div>
  </div>
</template>
