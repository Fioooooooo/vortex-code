<script setup lang="ts">
import { usePipelineStore } from "@renderer/stores/pipeline";

const pipelineStore = usePipelineStore();

const hasTemplates = pipelineStore.templates.length > 0;
</script>

<template>
  <div class="flex-1 flex items-center justify-center bg-default">
    <div class="text-center space-y-6 max-w-md px-6">
      <div class="space-y-2">
        <UIcon name="i-lucide-git-branch" class="mx-auto w-12 h-12 text-muted" />
        <h2 class="text-xl font-semibold text-default">Pipeline</h2>
        <p class="text-sm text-muted">Automate your workflow from requirement to deployment.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          class="group flex flex-col items-center gap-2 p-5 rounded-lg border border-default bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all text-left"
          @click="pipelineStore.createNewTemplateEditor()"
        >
          <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-layers" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-sm font-medium text-default">Create Template</p>
            <p class="text-xs text-muted mt-0.5">Design your pipeline stages</p>
          </div>
        </button>

        <button
          class="group flex flex-col items-center gap-2 p-5 rounded-lg border border-default bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all text-left"
          @click="pipelineStore.openNewRunModal()"
        >
          <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <UIcon name="i-lucide-play" class="w-5 h-5 text-success" />
          </div>
          <div>
            <p class="text-sm font-medium text-default">Start a Run</p>
            <p class="text-xs text-muted mt-0.5">Trigger a new pipeline</p>
          </div>
        </button>
      </div>

      <p v-if="hasTemplates" class="text-xs text-muted">
        You have {{ pipelineStore.templates.length }} templates ready. Start a run to automate your workflow.
      </p>
    </div>
  </div>
</template>
