<script setup lang="ts">
import { usePipelineStore } from "@renderer/stores/pipeline";

const pipelineStore = usePipelineStore();

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getStageDotClass(status: string): string {
  switch (status) {
    case "passed":
      return "bg-success";
    case "running":
      return "bg-primary animate-pulse";
    case "failed":
      return "bg-error";
    case "skipped":
      return "bg-neutral opacity-40";
    case "waiting-approval":
      return "bg-warning";
    default:
      return "bg-neutral opacity-20";
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- New Run Button -->
    <div class="p-3 border-b border-default">
      <UButton
        color="primary"
        variant="outline"
        class="w-full justify-center gap-2"
        @click="pipelineStore.openNewRunModal()"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" />
        新建运行
      </UButton>
    </div>

    <!-- Run List -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="run in pipelineStore.sortedRuns"
        :key="run.id"
        class="group cursor-pointer border-b border-default transition-colors"
        :class="pipelineStore.selectedRunId === run.id ? 'bg-primary/5' : 'hover:bg-muted/30'"
        @click="pipelineStore.selectRun(run.id)"
      >
        <div class="px-3 py-2.5">
          <!-- Title Row -->
          <div class="flex items-center gap-2">
            <!-- Running Indicator -->
            <div
              v-if="run.status === 'running'"
              class="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"
            />
            <div v-else class="w-2 h-2 shrink-0" />

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate text-default">
                {{ run.title }}
              </p>
              <p class="text-xs text-muted truncate">
                {{ run.templateName }}
              </p>
            </div>
          </div>

          <!-- Stage Progress Dots -->
          <div class="flex items-center gap-1 mt-1.5 ml-4">
            <template v-for="(stage, idx) in run.stages" :key="stage.id">
              <div
                class="w-2 h-2 rounded-full transition-colors"
                :class="getStageDotClass(stage.status)"
              />
              <div v-if="idx < run.stages.length - 1" class="w-2 h-px bg-default" />
            </template>
          </div>

          <!-- Time -->
          <p class="text-xs text-muted mt-1 ml-4">
            {{ formatTime(run.updatedAt) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
