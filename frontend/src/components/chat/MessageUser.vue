<script setup lang="ts">
import type { UserMessage } from "@renderer/types/workspace";

defineProps<{
  message: UserMessage;
}>();
</script>

<template>
  <div class="flex gap-3">
    <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
      <UIcon name="i-lucide-user" class="w-4 h-4 text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="bg-muted/50 rounded-lg px-4 py-2.5">
        <p class="text-sm text-highlighted whitespace-pre-wrap">{{ message.content }}</p>
      </div>
      <div v-if="message.attachments?.length" class="flex gap-2 mt-2">
        <div
          v-for="att in message.attachments"
          :key="att.id"
          class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 text-xs text-muted"
        >
          <UIcon
            :name="att.type === 'image' ? 'i-lucide-image' : 'i-lucide-paperclip'"
            class="w-3.5 h-3.5"
          />
          <span class="truncate max-w-[120px]">{{ att.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
