<script setup lang="ts">
import { ref } from "vue";
import { usePipelineStore } from "@renderer/stores/pipeline";
import type { PipelineTemplate } from "@shared/types/pipeline";

const pipelineStore = usePipelineStore();
const hoveredTemplateId = ref<string | null>(null);

function getStageSummary(template: PipelineTemplate): string {
  const names = template.stages.map((s) => s.name);
  return `${template.stages.length} stages: ${names.join(" → ")}`;
}

function handleDuplicate(templateId: string, e: Event): void {
  e.stopPropagation();
  pipelineStore.duplicateTemplate(templateId);
}

function handleDelete(templateId: string, e: Event): void {
  e.stopPropagation();
  pipelineStore.deleteTemplate(templateId);
}

function handleSetDefault(templateId: string, e: Event): void {
  e.stopPropagation();
  pipelineStore.setDefaultTemplate(templateId);
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- New Template Button -->
    <div class="p-3 border-b border-default">
      <UButton
        color="primary"
        variant="outline"
        class="w-full justify-center gap-2"
        @click="pipelineStore.createNewTemplateEditor()"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" />
        新建模板
      </UButton>
    </div>

    <!-- Template List -->
    <div class="flex-1 overflow-y-auto">
      <!-- Built-in Section -->
      <div v-if="pipelineStore.builtinTemplates.length > 0" class="px-3 pt-3 pb-1">
        <p class="text-xs font-semibold text-muted uppercase tracking-wider">Built-in</p>
      </div>
      <div
        v-for="template in pipelineStore.builtinTemplates"
        :key="template.id"
        class="group cursor-pointer mx-2 mb-1 rounded-md border border-default bg-muted/20 transition-colors relative"
        :class="
          pipelineStore.selectedTemplateId === template.id
            ? 'ring-1 ring-primary bg-primary/5'
            : 'hover:bg-muted/40'
        "
        @click="pipelineStore.selectTemplate(template.id)"
        @mouseenter="hoveredTemplateId = template.id"
        @mouseleave="hoveredTemplateId = null"
      >
        <div class="px-3 py-2.5">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate text-default">{{ template.name }}</p>
              <p class="text-xs text-muted truncate">{{ getStageSummary(template) }}</p>
            </div>
            <!-- Hover Actions -->
            <div
              v-if="hoveredTemplateId === template.id"
              class="flex items-center gap-0.5 ml-2 shrink-0"
            >
              <UTooltip text="Duplicate">
                <UButton
                  variant="ghost"
                  size="xs"
                  color="neutral"
                  class="w-6 h-6 p-0 justify-center"
                  @click="handleDuplicate(template.id, $event)"
                >
                  <UIcon name="i-lucide-copy" class="w-3.5 h-3.5" />
                </UButton>
              </UTooltip>
            </div>
          </div>
          <div v-if="template.isDefault" class="mt-1">
            <UBadge size="xs" color="primary" variant="soft">Default</UBadge>
          </div>
        </div>
      </div>

      <!-- Custom Section -->
      <div v-if="pipelineStore.customTemplates.length > 0" class="px-3 pt-4 pb-1">
        <p class="text-xs font-semibold text-muted uppercase tracking-wider">Custom</p>
      </div>
      <div
        v-for="template in pipelineStore.customTemplates"
        :key="template.id"
        class="group cursor-pointer mx-2 mb-1 rounded-md border border-default bg-muted/20 transition-colors relative"
        :class="
          pipelineStore.selectedTemplateId === template.id
            ? 'ring-1 ring-primary bg-primary/5'
            : 'hover:bg-muted/40'
        "
        @click="pipelineStore.selectTemplate(template.id)"
        @mouseenter="hoveredTemplateId = template.id"
        @mouseleave="hoveredTemplateId = null"
      >
        <div class="px-3 py-2.5">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate text-default">{{ template.name }}</p>
              <p class="text-xs text-muted truncate">{{ getStageSummary(template) }}</p>
            </div>
            <!-- Hover Actions -->
            <div
              v-if="hoveredTemplateId === template.id"
              class="flex items-center gap-0.5 ml-2 shrink-0"
            >
              <UTooltip text="Duplicate">
                <UButton
                  variant="ghost"
                  size="xs"
                  color="neutral"
                  class="w-6 h-6 p-0 justify-center"
                  @click="handleDuplicate(template.id, $event)"
                >
                  <UIcon name="i-lucide-copy" class="w-3.5 h-3.5" />
                </UButton>
              </UTooltip>
              <UTooltip text="Delete">
                <UButton
                  variant="ghost"
                  size="xs"
                  color="error"
                  class="w-6 h-6 p-0 justify-center"
                  @click="handleDelete(template.id, $event)"
                >
                  <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                </UButton>
              </UTooltip>
              <UTooltip text="Set as Default">
                <UButton
                  variant="ghost"
                  size="xs"
                  color="neutral"
                  class="w-6 h-6 p-0 justify-center"
                  @click="handleSetDefault(template.id, $event)"
                >
                  <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
                </UButton>
              </UTooltip>
            </div>
          </div>
          <div v-if="template.isDefault" class="mt-1">
            <UBadge size="xs" color="primary" variant="soft">Default</UBadge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
