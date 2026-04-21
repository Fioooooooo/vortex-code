<script setup lang="ts">
import type { PipelineStageRun } from "@shared/types/pipeline";

defineProps<{
  stage: PipelineStageRun;
}>();

const emit = defineEmits<{
  (e: "rerun"): void;
  (e: "skip"): void;
  (e: "force-pass"): void;
}>();

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

const statusBadgeColor: Record<string, string> = {
  pending: "neutral",
  running: "primary",
  passed: "success",
  failed: "error",
  skipped: "neutral",
  "waiting-approval": "warning",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  running: "Running",
  passed: "Passed",
  failed: "Failed",
  skipped: "Skipped",
  "waiting-approval": "Waiting Approval",
};
</script>

<template>
  <div class="flex flex-col">
    <!-- Title Bar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-default bg-muted/20">
      <div class="flex items-center gap-3">
        <h3 class="text-base font-semibold text-default">{{ stage.name }}</h3>
        <UBadge :color="statusBadgeColor[stage.status] as any" size="sm" variant="soft">
          {{ statusLabel[stage.status] }}
        </UBadge>
        <span v-if="stage.durationMs > 0" class="text-xs text-muted">
          {{ formatDuration(stage.durationMs) }}
        </span>
        <span v-if="stage.tokensUsed > 0" class="text-xs text-muted">
          {{ stage.tokensUsed.toLocaleString() }} tokens
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <UTooltip text="Rerun Stage">
          <UButton variant="ghost" size="xs" color="neutral" @click="emit('rerun')">
            <UIcon name="i-lucide-rotate-ccw" class="w-4 h-4" />
          </UButton>
        </UTooltip>
        <UTooltip text="Skip Stage">
          <UButton variant="ghost" size="xs" color="neutral" @click="emit('skip')">
            <UIcon name="i-lucide-skip-forward" class="w-4 h-4" />
          </UButton>
        </UTooltip>
        <UTooltip v-if="stage.status === 'failed'" text="Force Pass">
          <UButton variant="ghost" size="xs" color="warning" @click="emit('force-pass')">
            <UIcon name="i-lucide-check-check" class="w-4 h-4" />
          </UButton>
        </UTooltip>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1">
      <slot />
    </div>
  </div>
</template>
