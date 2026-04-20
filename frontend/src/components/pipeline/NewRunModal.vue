<script setup lang="ts">
import { computed, ref } from "vue";
import { usePipelineStore } from "@renderer/stores/pipeline";

const pipelineStore = usePipelineStore();

const selectedTemplateId = ref("");
const triggerDescription = ref("");

const canSubmit = computed(
  () => selectedTemplateId.value.trim().length > 0 && triggerDescription.value.trim().length > 0
);

function handleSubmit(): void {
  if (!canSubmit.value) return;
  pipelineStore.createRun({
    templateId: selectedTemplateId.value,
    triggerDescription: triggerDescription.value,
  });
  selectedTemplateId.value = "";
  triggerDescription.value = "";
  pipelineStore.closeNewRunModal();
}

function handleClose(): void {
  selectedTemplateId.value = "";
  triggerDescription.value = "";
  pipelineStore.closeNewRunModal();
}
</script>

<template>
  <UModal v-model:open="pipelineStore.newRunModalOpen" :ui="{ content: 'max-w-lg' }">
    <template #content>
      <div class="p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-default">New Pipeline Run</h3>
          <UButton
            variant="ghost"
            size="sm"
            color="neutral"
            class="w-8 h-8 p-0 justify-center"
            @click="handleClose"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </UButton>
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-default">Select Template</label>
            <div class="space-y-2">
              <div
                v-for="template in pipelineStore.templates"
                :key="template.id"
                class="flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors"
                :class="
                  selectedTemplateId === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-default hover:bg-muted/30'
                "
                @click="selectedTemplateId = template.id"
              >
                <div
                  class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  :class="selectedTemplateId === template.id ? 'border-primary' : 'border-muted'"
                >
                  <div
                    v-if="selectedTemplateId === template.id"
                    class="w-2 h-2 rounded-full bg-primary"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-default">{{ template.name }}</p>
                  <p class="text-xs text-muted">{{ template.stages.length }} stages</p>
                </div>
                <UBadge v-if="template.isDefault" size="xs" color="primary" variant="soft"
                  >Default</UBadge
                >
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-default">Trigger Description</label>
            <UTextarea
              v-model="triggerDescription"
              placeholder="Describe what you want to accomplish, e.g. 'Implement user avatar upload feature'"
              :rows="3"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" @click="handleClose">Cancel</UButton>
          <UButton color="primary" :disabled="!canSubmit" @click="handleSubmit">Start Run</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
