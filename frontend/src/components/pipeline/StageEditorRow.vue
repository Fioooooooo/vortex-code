<script setup lang="ts">
import type { PipelineStageConfig, StageType } from "@shared/types/pipeline";

defineProps<{
  stage: PipelineStageConfig;
  index: number;
  isExpanded: boolean;
}>();

const emit = defineEmits<{
  (e: "update", stage: PipelineStageConfig): void;
  (e: "delete", index: number): void;
  (e: "toggle-expand", index: number): void;
  (e: "drag-start", index: number): void;
  (e: "drag-over", index: number): void;
  (e: "drop", index: number): void;
  (e: "drag-end"): void;
}>();

const stageTypeOptions: { value: StageType; label: string }[] = [
  { value: "discuss", label: "需求讨论" },
  { value: "code", label: "代码编写" },
  { value: "test", label: "单元测试" },
  { value: "review", label: "代码审查" },
  { value: "deploy", label: "部署" },
  { value: "custom", label: "自定义" },
];

const typeIconMap: Record<StageType, string> = {
  discuss: "i-lucide-message-circle",
  code: "i-lucide-code",
  test: "i-lucide-test-tube",
  review: "i-lucide-eye",
  deploy: "i-lucide-rocket",
  custom: "i-lucide-cog",
};
</script>

<template>
  <div
    class="rounded-lg border border-default bg-muted/20 transition-colors"
    :class="isExpanded ? 'ring-1 ring-primary/20' : ''"
    draggable="true"
    @dragstart="emit('drag-start', index)"
    @dragover.prevent="emit('drag-over', index)"
    @drop.prevent="emit('drop', index)"
    @dragend="emit('drag-end')"
  >
    <!-- Collapsed Row -->
    <div class="flex items-center gap-2 px-3 py-2.5">
      <!-- Drag Handle -->
      <button
        class="cursor-grab active:cursor-grabbing text-muted hover:text-default p-0.5"
        @mousedown.stop
      >
        <UIcon name="i-lucide-grip-vertical" class="w-4 h-4" />
      </button>

      <!-- Type Icon -->
      <UIcon :name="typeIconMap[stage.type]" class="w-4 h-4 text-muted shrink-0" />

      <!-- Type Selector -->
      <USelect
        :model-value="stage.type"
        :items="stageTypeOptions"
        size="sm"
        class="w-28 shrink-0"
        @update:model-value="
          emit('update', {
            ...stage,
            type: $event as StageType,
            name: stageTypeOptions.find((o) => o.value === $event)?.label ?? stage.name,
          })
        "
      />

      <!-- Name Input -->
      <UInput
        :model-value="stage.name"
        size="sm"
        class="flex-1 min-w-0"
        placeholder="Stage name"
        @update:model-value="emit('update', { ...stage, name: $event })"
      />

      <!-- Expand Toggle -->
      <UButton
        variant="ghost"
        size="xs"
        color="neutral"
        class="w-6 h-6 p-0 justify-center"
        @click="emit('toggle-expand', index)"
      >
        <UIcon
          :name="isExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="w-3.5 h-3.5"
        />
      </UButton>

      <!-- Delete -->
      <UButton
        variant="ghost"
        size="xs"
        color="error"
        class="w-6 h-6 p-0 justify-center"
        @click="emit('delete', index)"
      >
        <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
      </UButton>
    </div>
  </div>
</template>
