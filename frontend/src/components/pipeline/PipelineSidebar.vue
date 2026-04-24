<script setup lang="ts">
import { ref } from "vue";

const tabs = [
  { id: "runs" as const, label: "运行", icon: "i-lucide-play" },
  { id: "templates" as const, label: "模板", icon: "i-lucide-layers" },
];

const activeTab = ref<(typeof tabs)[number]["id"]>("runs");

function updateActiveTab(payload: string | number): void {
  if (typeof payload === "number") {
    activeTab.value = tabs[payload]?.id ?? "runs";
  }
}
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
      @update:model-value="updateActiveTab"
    />

    <!-- Content -->
    <div class="flex-1 overflow-hidden flex flex-col" />
  </div>
</template>
