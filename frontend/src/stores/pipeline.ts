import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { PipelineRun, PipelineTemplate } from "@shared/types/pipeline";

export const usePipelineStore = defineStore("pipeline", () => {
  // State
  const templates = ref<PipelineTemplate[]>([]);
  const runs = ref<PipelineRun[]>([]);
  const selectedRunId = ref<string | null>(null);
  const selectedTemplateId = ref<string | null>(null);

  // Computed
  const selectedRun = computed<PipelineRun | null>(
    () => runs.value.find((r) => r.id === selectedRunId.value) ?? null
  );

  const selectedTemplate = computed<PipelineTemplate | null>(
    () => templates.value.find((t) => t.id === selectedTemplateId.value) ?? null
  );

  const sortedRuns = computed(() => {
    const running = runs.value.filter((r) => r.status === "running");
    const others = runs.value
      .filter((r) => r.status !== "running")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return [...running, ...others];
  });

  // Actions
  function selectRun(runId: string | null): void {
    selectedRunId.value = runId;
    selectedTemplateId.value = null;
  }

  function selectTemplate(templateId: string | null): void {
    selectedTemplateId.value = templateId;
    selectedRunId.value = null;
  }

  return {
    templates,
    runs,
    selectedRunId,
    selectedTemplateId,
    selectedRun,
    selectedTemplate,
    sortedRuns,
    selectRun,
    selectTemplate,
  };
});
