<script setup lang="ts">
import { computed } from "vue";
import PipelineSidebar from "@renderer/components/pipeline/PipelineSidebar.vue";
import PipelineEmptyState from "@renderer/components/pipeline/PipelineEmptyState.vue";
import RunDetailView from "@renderer/components/pipeline/RunDetailView.vue";
import TemplateEditor from "@renderer/components/pipeline/TemplateEditor.vue";
import NewRunModal from "@renderer/components/pipeline/NewRunModal.vue";
import { usePipelineStore } from "@renderer/stores/pipeline";

const pipelineStore = usePipelineStore();

const centralContent = computed(() => {
  if (pipelineStore.selectedRun) return "run-detail";
  if (pipelineStore.editingTemplate) return "template-editor";
  return "empty";
});
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <div class="h-full shrink-0">
      <PipelineSidebar />
    </div>

    <main class="flex-1 flex flex-col min-w-0 bg-default overflow-hidden">
      <PipelineEmptyState v-if="centralContent === 'empty'" />
      <RunDetailView v-else-if="centralContent === 'run-detail'" />
      <TemplateEditor v-else-if="centralContent === 'template-editor'" />
    </main>
  </div>

  <NewRunModal />
</template>
