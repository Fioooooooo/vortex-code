<script setup lang="ts">
import ChatComark from "@renderer/components/chat/ChatComark";
import type { MessageMeta } from "@shared/types/chat";
import type { ApplyRunMeta } from "@shared/types/proposal";
import type { UIMessage } from "ai";

const props = defineProps<{
  runMeta: ApplyRunMeta | null;
  messages: UIMessage<MessageMeta>[];
  isStreaming: boolean;
}>();

defineEmits<{
  close: [];
}>();

function getStageIndex(): number {
  if (!props.runMeta || props.runMeta.stages.length === 0) {
    return 0;
  }

  return Math.min(props.runMeta.currentStageIndex, props.runMeta.stages.length - 1);
}

function getStageCount(): number {
  return props.runMeta?.stages.length ?? 0;
}
</script>

<template>
  <div
    v-if="runMeta"
    class="flex flex-col w-96 shrink-0 border-l border-default bg-default overflow-hidden"
  >
    <div class="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-default">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0" />
        <span class="text-sm font-medium text-highlighted truncate">{{ runMeta.workflowId }}</span>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <span class="text-xs text-muted">
          {{ getStageCount() > 0 ? getStageIndex() + 1 : 0 }}/{{ getStageCount() }}
        </span>
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          icon="i-lucide-x"
          @click="$emit('close')"
        />
      </div>
    </div>

    <div class="shrink-0 px-4 py-2 border-b border-default bg-elevated/50">
      <div class="flex items-center gap-1.5">
        <template v-for="(stage, index) in runMeta.stages" :key="stage.id">
          <div
            class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            :class="
              index < getStageIndex()
                ? 'bg-success/10 text-success'
                : index === getStageIndex()
                  ? 'bg-warning/10 text-warning font-medium'
                  : 'bg-elevated text-muted'
            "
          >
            <UIcon v-if="index < getStageIndex()" name="i-lucide-check" class="w-3 h-3" />
            <span
              v-else-if="index === getStageIndex()"
              class="w-1.5 h-1.5 rounded-full bg-current"
            />
            <span>{{ stage.name }}</span>
          </div>
          <UIcon
            v-if="index < runMeta.stages.length - 1"
            name="i-lucide-chevron-right"
            class="w-3 h-3 text-muted shrink-0"
          />
        </template>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <div
        v-for="message in messages"
        :key="message.id"
        class="space-y-2 rounded-lg border border-default bg-elevated/30 px-3 py-3"
      >
        <div v-for="(part, index) in message.parts" :key="index">
          <div v-if="part.type === 'text'" class="prose prose-sm dark:prose-invert max-w-none">
            <ChatComark :markdown="part.text" />
          </div>

          <div
            v-else-if="part.type === 'dynamic-tool'"
            class="flex items-start gap-2 rounded-md border border-default bg-default px-3 py-2 text-xs"
          >
            <UIcon
              v-if="part.state === 'input-available'"
              name="i-lucide-loader-2"
              class="w-3.5 h-3.5 animate-spin text-warning mt-0.5 shrink-0"
            />
            <UIcon v-else name="i-lucide-check" class="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="font-medium text-highlighted">
                {{ part.toolName }}
              </div>
              <div v-if="part.state === 'input-available'" class="text-muted">调用中</div>
              <div v-else class="mt-1 text-muted whitespace-pre-wrap">
                {{ part.title ?? part.toolName }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isStreaming" class="flex items-center gap-2 text-xs text-muted">
        <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin" />
        <span>正在执行...</span>
      </div>
    </div>
  </div>
</template>
