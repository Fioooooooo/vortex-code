<script setup lang="ts">
import type { PipelineStageRun } from "@renderer/types/pipeline";

const props = defineProps<{
  stage: PipelineStageRun;
}>();

const messages = computed(() => props.stage.output?.messages ?? []);
const summary = computed(() => props.stage.output?.summary ?? "");

import { computed } from "vue";
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Conversation -->
    <div v-if="messages.length > 0" class="space-y-3">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex gap-3"
        :class="msg.type === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          v-if="msg.type !== 'user'"
          class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
        >
          <UIcon name="i-lucide-bot" class="w-4 h-4 text-primary" />
        </div>

        <div
          class="max-w-[80%] rounded-lg px-3 py-2 text-sm"
          :class="
            msg.type === 'user'
              ? 'bg-primary text-primary-inverse'
              : 'bg-muted border border-default text-default'
          "
        >
          <template v-if="msg.type === 'thinking'">
            <p class="font-medium text-xs text-muted mb-1">{{ msg.summary }}</p>
            <pre class="whitespace-pre-wrap text-xs">{{ msg.content }}</pre>
          </template>
          <template v-else-if="msg.type === 'user' || msg.type === 'text'">
            <p class="whitespace-pre-wrap">{{ msg.content }}</p>
          </template>
          <template v-else-if="msg.type === 'confirm'">
            <p class="text-xs text-muted">{{ msg.description }}</p>
            <p class="text-sm mt-1">{{ msg.action }}</p>
          </template>
          <template v-else>
            <p class="text-xs text-muted">{{ msg.type }}</p>
          </template>
        </div>

        <div
          v-if="msg.type === 'user'"
          class="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0"
        >
          <UIcon name="i-lucide-user" class="w-4 h-4 text-secondary" />
        </div>
      </div>
    </div>

    <!-- Summary Card -->
    <div v-if="summary" class="rounded-lg border border-default bg-muted/30 p-4">
      <div class="flex items-center gap-2 mb-2">
        <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-primary" />
        <h4 class="text-sm font-semibold text-default">Discussion Summary</h4>
      </div>
      <p class="text-sm text-muted whitespace-pre-wrap">{{ summary }}</p>
    </div>

    <!-- Empty state -->
    <div v-if="messages.length === 0 && !summary" class="text-center py-8">
      <UIcon name="i-lucide-message-circle" class="w-8 h-8 text-muted mx-auto mb-2" />
      <p class="text-sm text-muted">No discussion records yet.</p>
    </div>
  </div>
</template>
