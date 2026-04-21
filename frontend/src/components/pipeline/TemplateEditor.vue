<script setup lang="ts">
import { computed, ref } from "vue";
import { usePipelineStore } from "@renderer/stores/pipeline";
import type { PipelineStageConfig } from "@shared/types/pipeline";
import { createDefaultStage } from "@renderer/stores/pipeline.mock";
import StageEditorRow from "./StageEditorRow.vue";
import StageEditorExpanded from "./StageEditorExpanded.vue";

const pipelineStore = usePipelineStore();

const template = computed(() => pipelineStore.editingTemplate);
const isNewTemplate = computed(() => !pipelineStore.selectedTemplateId);
const isBuiltIn = computed(() => {
  if (!pipelineStore.selectedTemplateId) return false;
  const t = pipelineStore.templates.find((t) => t.id === pipelineStore.selectedTemplateId);
  return t?.source === "built-in";
});

const expandedIndex = ref<number | null>(null);
const dragSourceIndex = ref<number | null>(null);

const localStages = computed<PipelineStageConfig[]>({
  get: () => template.value?.stages ?? [],
  set: (stages) => {
    pipelineStore.updateEditingTemplateStages(stages);
  },
});

function handleUpdateStage(index: number, stage: PipelineStageConfig): void {
  const updated = [...localStages.value];
  updated[index] = stage;
  localStages.value = updated;
}

function handleDeleteStage(index: number): void {
  const updated = [...localStages.value];
  updated.splice(index, 1);
  localStages.value = updated;
  if (expandedIndex.value === index) {
    expandedIndex.value = null;
  } else if (expandedIndex.value !== null && expandedIndex.value > index) {
    expandedIndex.value--;
  }
}

function toggleExpand(index: number): void {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

function handleAddStage(): void {
  const newStage = createDefaultStage("discuss", localStages.value.length);
  localStages.value = [...localStages.value, newStage];
  expandedIndex.value = localStages.value.length - 1;
}

// Drag and Drop
function handleDragStart(index: number): void {
  dragSourceIndex.value = index;
}

function handleDragOver(index: number): void {
  if (dragSourceIndex.value === null || dragSourceIndex.value === index) return;
}

function handleDrop(index: number): void {
  if (dragSourceIndex.value === null || dragSourceIndex.value === index) return;

  const stages = [...localStages.value];
  const [removed] = stages.splice(dragSourceIndex.value, 1);
  stages.splice(index, 0, removed);
  localStages.value = stages;

  // Adjust expanded index
  if (expandedIndex.value === dragSourceIndex.value) {
    expandedIndex.value = index;
  } else if (expandedIndex.value !== null) {
    const old = dragSourceIndex.value;
    const exp = expandedIndex.value;
    if (old < exp && index >= exp) {
      expandedIndex.value = exp - 1;
    } else if (old > exp && index <= exp) {
      expandedIndex.value = exp + 1;
    }
  }

  dragSourceIndex.value = null;
}

function handleDragEnd(): void {
  dragSourceIndex.value = null;
}

function handleSave(): void {
  if (!template.value) return;
  pipelineStore.saveTemplate({
    name: template.value.name,
    description: template.value.description,
    stages: template.value.stages.map((s) => ({ ...s })),
  });
}

function handleCancel(): void {
  pipelineStore.cancelTemplateEdit();
  expandedIndex.value = null;
}
</script>

<template>
  <div v-if="template" class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 px-4 py-3 border-b border-default bg-muted/20 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-default">
          {{
            isNewTemplate ? "New Template" : isBuiltIn ? `${template.name} (Copy)` : "Edit Template"
          }}
        </h2>
      </div>

      <div class="space-y-2">
        <UInput
          :model-value="template.name"
          placeholder="Template name"
          @update:model-value="pipelineStore.updateEditingTemplateName($event)"
        />
        <UInput
          :model-value="template.description"
          placeholder="Description (optional)"
          @update:model-value="pipelineStore.updateEditingTemplateDescription($event)"
        />
      </div>
    </div>

    <!-- Stage List -->
    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      <StageEditorRow
        v-for="(stage, index) in localStages"
        :key="stage.id"
        :stage="stage"
        :index="index"
        :is-expanded="expandedIndex === index"
        @update="handleUpdateStage(index, $event)"
        @delete="handleDeleteStage"
        @toggle-expand="toggleExpand"
        @drag-start="handleDragStart"
        @drag-over="handleDragOver"
        @drop="handleDrop"
        @drag-end="handleDragEnd"
      />
      <StageEditorExpanded
        v-if="expandedIndex !== null && localStages[expandedIndex]"
        :stage="localStages[expandedIndex]"
        @update="handleUpdateStage(expandedIndex, $event)"
      />

      <UButton block variant="soft" color="primary" size="sm" class="mt-2" @click="handleAddStage">
        <UIcon name="i-lucide-plus" class="w-4 h-4 mr-1.5" />
        Add Stage
      </UButton>
    </div>

    <!-- Save / Cancel -->
    <div
      class="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-default bg-muted/20"
    >
      <UButton variant="ghost" color="neutral" @click="handleCancel">Cancel</UButton>
      <UButton color="primary" @click="handleSave">
        {{ isBuiltIn ? "Save as Custom" : "Save" }}
      </UButton>
    </div>
  </div>
</template>
