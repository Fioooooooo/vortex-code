<script setup lang="ts">
import { computed, ref } from "vue";
import { usePipelineStore } from "@renderer/stores/pipeline";
import StageFlow from "./StageFlow.vue";
import StageDetailLayout from "./StageDetailLayout.vue";
import DiscussStageDetail from "./DiscussStageDetail.vue";
import CodeStageDetail from "./CodeStageDetail.vue";
import TestStageDetail from "./TestStageDetail.vue";
import ReviewStageDetail from "./ReviewStageDetail.vue";
import DeployStageDetail from "./DeployStageDetail.vue";

const pipelineStore = usePipelineStore();

const activeStageId = ref<string | null>(null);

const activeStage = computed(() => {
  if (!pipelineStore.selectedRun) return null;
  if (activeStageId.value) {
    return pipelineStore.selectedRun.stages.find((s) => s.id === activeStageId.value) ?? null;
  }
  // Default to current running stage or first stage
  const current = pipelineStore.selectedRun.stages[pipelineStore.selectedRun.currentStageIndex];
  return current ?? pipelineStore.selectedRun.stages[0] ?? null;
});

function handleSelectStage(stageId: string): void {
  activeStageId.value = stageId;
}

function handleApprove(stageId: string): void {
  if (pipelineStore.selectedRun) {
    pipelineStore.approveGate(pipelineStore.selectedRun.id, stageId);
  }
}

function handleReject(stageId: string): void {
  if (pipelineStore.selectedRun) {
    pipelineStore.rejectGate(pipelineStore.selectedRun.id, stageId);
  }
}
</script>

<template>
  <div v-if="pipelineStore.selectedRun" class="flex flex-col h-full overflow-hidden">
    <!-- Stage Flow -->
    <div class="shrink-0 border-b border-default">
      <StageFlow
        :stages="pipelineStore.selectedRun.stages"
        :active-stage-id="activeStage?.id ?? null"
        @select-stage="handleSelectStage"
        @approve="handleApprove"
        @reject="handleReject"
      />
    </div>

    <!-- Stage Detail -->
    <div class="flex-1 overflow-y-auto">
      <StageDetailLayout
        v-if="activeStage"
        :stage="activeStage"
        @rerun="pipelineStore.rerunStage(pipelineStore.selectedRun!.id, activeStage.id)"
        @skip="pipelineStore.skipStage(pipelineStore.selectedRun!.id, activeStage.id)"
        @force-pass="pipelineStore.forcePassStage(pipelineStore.selectedRun!.id, activeStage.id)"
      >
        <DiscussStageDetail v-if="activeStage.type === 'discuss'" :stage="activeStage" />
        <CodeStageDetail v-else-if="activeStage.type === 'code'" :stage="activeStage" />
        <TestStageDetail v-else-if="activeStage.type === 'test'" :stage="activeStage" />
        <ReviewStageDetail v-else-if="activeStage.type === 'review'" :stage="activeStage" />
        <DeployStageDetail v-else-if="activeStage.type === 'deploy'" :stage="activeStage" />
        <div v-else class="p-4 text-sm text-muted">No detail view for this stage type.</div>
      </StageDetailLayout>
    </div>
  </div>
</template>
