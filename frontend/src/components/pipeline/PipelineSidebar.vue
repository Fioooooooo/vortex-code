<script setup lang="ts">
import { usePipelineStore } from "@renderer/stores/pipeline";
import RunList from "./RunList.vue";
import TemplateList from "./TemplateList.vue";

const pipelineStore = usePipelineStore();

const tabs = [
  { id: "runs" as const, label: "Runs", icon: "i-lucide-play" },
  { id: "templates" as const, label: "Templates", icon: "i-lucide-layers" },
];
</script>

<template>
  <div class="w-[260px] flex flex-col border-r border-default bg-default shrink-0">
    <!-- Tab Switcher -->
    <div class="flex border-b border-default">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
        :class="
          pipelineStore.sidebarTab === tab.id
            ? 'text-primary border-b-2 border-primary bg-primary/5'
            : 'text-muted hover:text-highlighted hover:bg-muted/50'
        "
        @click="pipelineStore.setSidebarTab(tab.id)"
      >
        <UIcon :name="tab.icon" class="w-3.5 h-3.5" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <RunList v-if="pipelineStore.sidebarTab === 'runs'" />
      <TemplateList v-else />
    </div>
  </div>
</template>
