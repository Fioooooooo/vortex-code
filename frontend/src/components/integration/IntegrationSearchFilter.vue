<script setup lang="ts">
import type { FilterOption } from "@renderer/types/integration";

const props = defineProps<{
  modelValue: string;
  filter: FilterOption;
  hasProject: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:filter": [value: FilterOption];
}>();

const filterOptions: { label: string; value: FilterOption; disabled?: boolean }[] = [
  { label: "All", value: "all" },
  { label: "Connected", value: "connected" },
  { label: "Enabled in Project", value: "enabled-in-project", disabled: !props.hasProject },
];

function onSearchInput(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}

function onFilterChange(value: string): void {
  emit("update:filter", value as FilterOption);
}
</script>

<template>
  <div class="flex items-center gap-3">
    <UInput
      :model-value="modelValue"
      placeholder="Search integrations..."
      class="w-64"
      size="sm"
      @input="onSearchInput"
    >
      <template #leading>
        <UIcon name="i-lucide-search" class="w-4 h-4 text-muted" />
      </template>
    </UInput>

    <USelect :model-value="filter" :items="filterOptions" size="sm" class="w-44" @update:model-value="onFilterChange" />
  </div>
</template>
