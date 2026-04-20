<script setup lang="ts">
import { usePipelineStore } from "@renderer/stores/pipeline";
import RunList from "./RunList.vue";
import TemplateList from "./TemplateList.vue";

const pipelineStore = usePipelineStore();

const tabs = [
  { id: "runs" as const, label: "运行", icon: "i-lucide-play" },
  { id: "templates" as const, label: "模板", icon: "i-lucide-layers" },
];
</script>

<template>
  <div class="w-65 h-full flex flex-col border-r border-default bg-default shrink-0">
    <!-- Tab Switcher -->
    <UTabs
      :items="tabs"
      variant="link"
      :content="false"
      :ui="{
        trigger: 'flex-1',
        leadingIcon: 'size-3.5',
        label: 'text-sm',
      }"
      @update:model-value="
        (payload: string | number) => pipelineStore.setSidebarTab(tabs[payload as number].id)
      "
    />

    <!-- Content -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <RunList v-if="pipelineStore.sidebarTab === 'runs'" />
      <TemplateList v-else />
    </div>
  </div>
</template>
