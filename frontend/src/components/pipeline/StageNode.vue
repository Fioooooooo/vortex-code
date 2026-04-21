<script setup lang="ts">
import type { PipelineStageRun } from "@shared/types/pipeline";

const props = defineProps<{
  stage: PipelineStageRun;
  isActive: boolean;
  isLast: boolean;
}>();

const emit = defineEmits<{
  (e: "click", stageId: string): void;
  (e: "approve", stageId: string): void;
  (e: "reject", stageId: string): void;
}>();

const statusConfig = {
  passed: {
    icon: "i-lucide-check",
    colorClass: "text-success",
    borderClass: "border-success",
    bgClass: "bg-success/10",
  },
  running: {
    icon: "i-lucide-loader-2",
    colorClass: "text-primary",
    borderClass: "border-primary",
    bgClass: "bg-primary/10",
  },
  failed: {
    icon: "i-lucide-x",
    colorClass: "text-error",
    borderClass: "border-error",
    bgClass: "bg-error/10",
  },
  skipped: {
    icon: "i-lucide-minus",
    colorClass: "text-muted",
    borderClass: "border-muted",
    bgClass: "bg-muted/20",
  },
  "waiting-approval": {
    icon: "i-lucide-pause",
    colorClass: "text-warning",
    borderClass: "border-warning",
    bgClass: "bg-warning/10",
  },
  pending: {
    icon: "i-lucide-circle",
    colorClass: "text-muted",
    borderClass: "border-muted",
    bgClass: "bg-transparent",
  },
};

const config = statusConfig[props.stage.status];
</script>

<template>
  <div class="flex flex-col items-center relative" :class="{ 'flex-1': !isLast }">
    <!-- Node -->
    <button
      class="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all cursor-pointer min-w-[80px]"
      :class="[
        config.borderClass,
        config.bgClass,
        isActive ? 'ring-2 ring-primary/30' : 'hover:opacity-80',
      ]"
      @click="emit('click', stage.id)"
    >
      <UIcon
        :name="config.icon"
        class="w-5 h-5"
        :class="[config.colorClass, stage.status === 'running' ? 'animate-spin' : '']"
      />
      <span class="text-xs font-medium text-default whitespace-nowrap">{{ stage.name }}</span>
    </button>

    <!-- Approve/Reject for waiting-approval -->
    <div v-if="stage.status === 'waiting-approval'" class="flex items-center gap-1 mt-1.5">
      <UButton
        size="xs"
        color="success"
        variant="soft"
        class="text-xs px-2 py-0.5 h-6"
        @click.stop="emit('approve', stage.id)"
      >
        Approve
      </UButton>
      <UButton
        size="xs"
        color="error"
        variant="soft"
        class="text-xs px-2 py-0.5 h-6"
        @click.stop="emit('reject', stage.id)"
      >
        Reject
      </UButton>
    </div>
  </div>
</template>
