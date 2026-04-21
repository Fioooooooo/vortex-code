<script setup lang="ts">
import type { PipelineStageRun } from "@shared/types/pipeline";

defineProps<{
  stages: PipelineStageRun[];
  activeStageId: string | null;
}>();

const emit = defineEmits<{
  (e: "select-stage", stageId: string): void;
  (e: "approve", stageId: string): void;
  (e: "reject", stageId: string): void;
}>();

function getConnectorStatus(
  sourceStage: PipelineStageRun,
  targetStage: PipelineStageRun
): "completed" | "in-progress" | "pending" {
  if (sourceStage.status === "passed" && targetStage.status !== "pending") {
    return "completed";
  }
  if (sourceStage.status === "running") {
    return "in-progress";
  }
  return "pending";
}
</script>

<template>
  <div class="flex items-start px-4 py-4 overflow-x-auto">
    <template v-for="(stage, index) in stages" :key="stage.id">
      <StageNode
        :stage="stage"
        :is-active="activeStageId === stage.id"
        :is-last="index === stages.length - 1"
        @click="emit('select-stage', $event)"
        @approve="emit('approve', $event)"
        @reject="emit('reject', $event)"
      />
      <StageConnector
        v-if="index < stages.length - 1"
        :status="getConnectorStatus(stage, stages[index + 1])"
      />
    </template>
  </div>
</template>
