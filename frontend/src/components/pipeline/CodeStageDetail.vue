<script setup lang="ts">
import { computed } from "vue";
import type { PipelineStageRun } from "@shared/types/pipeline";

const props = defineProps<{
  stage: PipelineStageRun;
}>();

const messages = computed(() => props.stage.output?.messages ?? []);
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Execution Process -->
    <div v-if="messages.length > 0" class="space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-terminal" class="w-4 h-4" />
        Execution
      </h4>
      <div class="space-y-2">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="rounded-md border border-default bg-muted/20 p-3 text-sm"
        >
          <template v-for="(part, idx) in msg.parts" :key="idx">
            <template v-if="part.type === 'tool-invocation'">
              <div class="flex items-center gap-2 text-muted text-xs mb-1">
                <UIcon name="i-lucide-terminal" class="w-3.5 h-3.5" />
                Tool call
              </div>
            </template>
            <template v-else-if="part.type === 'reasoning'">
              <pre class="whitespace-pre-wrap text-xs text-muted">{{ part.text }}</pre>
            </template>
            <template v-else-if="part.type === 'text'">
              <p class="text-default whitespace-pre-wrap">{{ part.text }}</p>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="messages.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-code" class="w-8 h-8 text-muted mx-auto mb-2" />
      <p class="text-sm text-muted">No code execution records yet.</p>
    </div>
  </div>
</template>
