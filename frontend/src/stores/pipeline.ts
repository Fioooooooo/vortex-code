import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type {
  PipelineRun,
  PipelineTemplate,
  PipelineStageConfig,
  PipelineSidebarTab,
  CreateRunForm,
  CreateTemplateForm,
} from "@renderer/types/pipeline";
import { generateMockTemplates, generateMockRuns, createDefaultStage } from "./pipeline.mock";

export const usePipelineStore = defineStore("pipeline", () => {
  // State
  const templates = ref<PipelineTemplate[]>(generateMockTemplates());
  const runs = ref<PipelineRun[]>([]);
  const selectedRunId = ref<string | null>(null);
  const selectedTemplateId = ref<string | null>(null);
  const sidebarTab = ref<PipelineSidebarTab>("runs");
  const newRunModalOpen = ref(false);
  const editingTemplate = ref<PipelineTemplate | null>(null);

  // Initialize runs after templates are loaded
  runs.value = generateMockRuns(templates.value);

  // Computed
  const selectedRun = computed<PipelineRun | null>(
    () => runs.value.find((r) => r.id === selectedRunId.value) ?? null
  );

  const selectedTemplate = computed<PipelineTemplate | null>(
    () => templates.value.find((t) => t.id === selectedTemplateId.value) ?? null
  );

  const builtinTemplates = computed(() => templates.value.filter((t) => t.source === "built-in"));
  const customTemplates = computed(() => templates.value.filter((t) => t.source === "custom"));

  const defaultTemplate = computed(() => templates.value.find((t) => t.isDefault) ?? null);

  const runningRuns = computed(() => runs.value.filter((r) => r.status === "running"));
  const completedRuns = computed(() => runs.value.filter((r) => r.status !== "running"));

  const sortedRuns = computed(() => {
    return [
      ...runningRuns.value,
      ...completedRuns.value.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    ];
  });

  // Actions
  function selectRun(runId: string | null): void {
    selectedRunId.value = runId;
    selectedTemplateId.value = null;
    editingTemplate.value = null;
  }

  function selectTemplate(templateId: string | null): void {
    selectedTemplateId.value = templateId;
    selectedRunId.value = null;
    if (templateId) {
      const template = templates.value.find((t) => t.id === templateId);
      editingTemplate.value = template
        ? { ...template, stages: template.stages.map((s) => ({ ...s })) }
        : null;
    } else {
      editingTemplate.value = null;
    }
  }

  function setSidebarTab(tab: PipelineSidebarTab): void {
    sidebarTab.value = tab;
  }

  function openNewRunModal(): void {
    newRunModalOpen.value = true;
  }

  function closeNewRunModal(): void {
    newRunModalOpen.value = false;
  }

  function createRun(form: CreateRunForm): PipelineRun {
    const template = templates.value.find((t) => t.id === form.templateId);
    const templateName = template?.name ?? "Unknown";
    const stageConfigs = template?.stages ?? [];

    const run: PipelineRun = {
      id: `run-${Date.now()}`,
      projectId: "project-1",
      title:
        form.triggerDescription.slice(0, 30) + (form.triggerDescription.length > 30 ? "..." : ""),
      templateId: form.templateId,
      templateName,
      triggerDescription: form.triggerDescription,
      status: "running",
      stages: stageConfigs.map((config, index) => ({
        id: `run-stage-${config.id}-${Date.now()}`,
        configId: config.id,
        name: config.name,
        type: config.type,
        status: index === 0 ? "running" : "pending",
        startedAt: index === 0 ? new Date() : null,
        endedAt: null,
        durationMs: 0,
        tokensUsed: 0,
        output: null,
      })),
      currentStageIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    runs.value.unshift(run);
    selectedRunId.value = run.id;
    selectedTemplateId.value = null;
    editingTemplate.value = null;
    return run;
  }

  function createNewTemplateEditor(): void {
    selectedRunId.value = null;
    selectedTemplateId.value = null;
    editingTemplate.value = {
      id: `template-draft-${Date.now()}`,
      name: "New Template",
      description: "",
      source: "custom",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stages: [createDefaultStage("discuss", 0)],
    };
  }

  function saveTemplate(form: CreateTemplateForm): void {
    const now = new Date();
    const isEditingCustom =
      selectedTemplateId.value &&
      templates.value.some((t) => t.id === selectedTemplateId.value && t.source === "custom");

    if (isEditingCustom && selectedTemplateId.value) {
      // Update existing custom template
      const idx = templates.value.findIndex((t) => t.id === selectedTemplateId.value);
      if (idx !== -1) {
        templates.value[idx] = {
          ...templates.value[idx],
          name: form.name,
          description: form.description,
          stages: form.stages.map((s) => ({ ...s })),
          updatedAt: now,
        };
        editingTemplate.value = { ...templates.value[idx] };
      }
    } else {
      // Create new custom template (or save copy of built-in)
      const newTemplate: PipelineTemplate = {
        id: `template-${Date.now()}`,
        name: form.name,
        description: form.description,
        source: "custom",
        isDefault: false,
        createdAt: now,
        updatedAt: now,
        stages: form.stages.map((s) => ({ ...s })),
      };
      templates.value.push(newTemplate);
      selectedTemplateId.value = newTemplate.id;
      editingTemplate.value = { ...newTemplate };
    }
  }

  function deleteTemplate(templateId: string): void {
    const template = templates.value.find((t) => t.id === templateId);
    if (template?.source === "built-in") return;
    templates.value = templates.value.filter((t) => t.id !== templateId);
    if (selectedTemplateId.value === templateId) {
      selectedTemplateId.value = null;
      editingTemplate.value = null;
    }
  }

  function duplicateTemplate(templateId: string): void {
    const template = templates.value.find((t) => t.id === templateId);
    if (!template) return;

    const newTemplate: PipelineTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      source: "custom",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stages: template.stages.map((s) => ({
        ...s,
        id: `stage-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      })),
    };
    templates.value.push(newTemplate);
  }

  function setDefaultTemplate(templateId: string): void {
    templates.value.forEach((t) => {
      t.isDefault = t.id === templateId;
    });
  }

  function updateEditingTemplateStages(stages: PipelineStageConfig[]): void {
    if (editingTemplate.value) {
      editingTemplate.value.stages = stages.map((s) => ({ ...s }));
    }
  }

  function updateEditingTemplateName(name: string): void {
    if (editingTemplate.value) {
      editingTemplate.value.name = name;
    }
  }

  function updateEditingTemplateDescription(description: string): void {
    if (editingTemplate.value) {
      editingTemplate.value.description = description;
    }
  }

  function cancelTemplateEdit(): void {
    if (selectedTemplateId.value) {
      const template = templates.value.find((t) => t.id === selectedTemplateId.value);
      editingTemplate.value = template
        ? { ...template, stages: template.stages.map((s) => ({ ...s })) }
        : null;
    } else {
      editingTemplate.value = null;
    }
  }

  // Run actions
  function approveGate(runId: string, stageId: string): void {
    const run = runs.value.find((r) => r.id === runId);
    if (!run) return;
    const stage = run.stages.find((s) => s.id === stageId);
    if (!stage || stage.status !== "waiting-approval") return;

    stage.status = "passed";
    stage.endedAt = new Date();
    stage.durationMs = stage.startedAt ? Date.now() - stage.startedAt.getTime() : 0;
    run.updatedAt = new Date();

    // Advance to next stage
    advanceRunStage(run);
  }

  function rejectGate(runId: string, stageId: string): void {
    const run = runs.value.find((r) => r.id === runId);
    if (!run) return;
    const stage = run.stages.find((s) => s.id === stageId);
    if (!stage || stage.status !== "waiting-approval") return;

    stage.status = "failed";
    stage.endedAt = new Date();
    stage.durationMs = stage.startedAt ? Date.now() - stage.startedAt.getTime() : 0;
    run.status = "failed";
    run.updatedAt = new Date();
  }

  function rerunStage(runId: string, stageId: string): void {
    const run = runs.value.find((r) => r.id === runId);
    if (!run) return;
    const stage = run.stages.find((s) => s.id === stageId);
    if (!stage) return;

    stage.status = "running";
    stage.startedAt = new Date();
    stage.endedAt = null;
    stage.durationMs = 0;
    stage.tokensUsed = 0;
    run.status = "running";
    run.updatedAt = new Date();
  }

  function skipStage(runId: string, stageId: string): void {
    const run = runs.value.find((r) => r.id === runId);
    if (!run) return;
    const stage = run.stages.find((s) => s.id === stageId);
    if (!stage) return;

    stage.status = "skipped";
    stage.endedAt = new Date();
    stage.durationMs = 0;
    run.updatedAt = new Date();

    advanceRunStage(run);
  }

  function forcePassStage(runId: string, stageId: string): void {
    const run = runs.value.find((r) => r.id === runId);
    if (!run) return;
    const stage = run.stages.find((s) => s.id === stageId);
    if (!stage || stage.status !== "failed") return;

    stage.status = "passed";
    stage.endedAt = new Date();
    stage.durationMs = stage.startedAt ? Date.now() - stage.startedAt.getTime() : 0;
    run.updatedAt = new Date();

    advanceRunStage(run);
  }

  function advanceRunStage(run: PipelineRun): void {
    const nextIndex = run.stages.findIndex((s) => s.status === "pending" || s.status === "running");
    if (nextIndex === -1) {
      run.status = run.stages.every((s) => s.status === "passed" || s.status === "skipped")
        ? "completed"
        : "failed";
      run.currentStageIndex = run.stages.length - 1;
    } else {
      run.currentStageIndex = nextIndex;
      const nextStage = run.stages[nextIndex];
      if (nextStage.status === "pending") {
        nextStage.status = "running";
        nextStage.startedAt = new Date();
      }
    }
    run.updatedAt = new Date();
  }

  // Simulation: advance running stages periodically
  function simulateProgress(): void {
    runs.value.forEach((run) => {
      if (run.status !== "running") return;

      const currentStage = run.stages[run.currentStageIndex];
      if (!currentStage || currentStage.status !== "running") return;

      // Simulate token usage growth
      currentStage.tokensUsed += Math.floor(Math.random() * 50) + 10;
      run.updatedAt = new Date();

      // Randomly complete stage (5% chance per tick)
      if (Math.random() < 0.05) {
        const shouldWaitApproval =
          currentStage.type === "discuss" || currentStage.type === "review";
        if (shouldWaitApproval && Math.random() < 0.5) {
          currentStage.status = "waiting-approval";
        } else {
          currentStage.status = Math.random() < 0.9 ? "passed" : "failed";
          currentStage.endedAt = new Date();
          currentStage.durationMs = currentStage.startedAt
            ? Date.now() - currentStage.startedAt.getTime()
            : 0;

          if (currentStage.status === "failed") {
            const config = templates.value
              .find((t) => t.id === run.templateId)
              ?.stages.find((s) => s.id === currentStage.configId);
            if (config?.failureStrategy === "abort") {
              run.status = "failed";
              return;
            }
          }

          advanceRunStage(run);
        }
      }
    });
  }

  let simulationInterval: ReturnType<typeof setInterval> | null = null;

  function startSimulation(): void {
    if (simulationInterval) return;
    simulationInterval = setInterval(simulateProgress, 2000);
  }

  function stopSimulation(): void {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
  }

  // Auto-start simulation
  startSimulation();

  return {
    // State
    templates,
    runs,
    selectedRunId,
    selectedTemplateId,
    sidebarTab,
    newRunModalOpen,
    editingTemplate,
    // Computed
    selectedRun,
    selectedTemplate,
    builtinTemplates,
    customTemplates,
    defaultTemplate,
    sortedRuns,
    // Actions
    selectRun,
    selectTemplate,
    setSidebarTab,
    openNewRunModal,
    closeNewRunModal,
    createRun,
    createNewTemplateEditor,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
    updateEditingTemplateStages,
    updateEditingTemplateName,
    updateEditingTemplateDescription,
    cancelTemplateEdit,
    approveGate,
    rejectGate,
    rerunStage,
    skipStage,
    forcePassStage,
    startSimulation,
    stopSimulation,
  };
});
