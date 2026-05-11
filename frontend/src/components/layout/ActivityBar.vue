<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useProjectStore } from "@renderer/stores/project";
import { activityBarItems } from "@renderer/config/activity-bar";

const route = useRoute();
const projectStore = useProjectStore();

const hasProject = computed(() => projectStore.hasCurrentProject);

const items = computed(() => activityBarItems.filter((i) => i.group === "top"));
const bottomItems = computed(() => activityBarItems.filter((i) => i.group === "bottom"));

const activeItem = computed(() => {
  const matches = activityBarItems.filter((i) => route.path.startsWith(i.path));
  if (matches.length === 0) return null;
  // longest prefix wins (e.g. /proposal vs /proposal/:id)
  matches.sort((a, b) => b.path.length - a.path.length);
  return matches[0].id;
});
</script>

<template>
  <div
    class="w-12 h-full flex flex-col items-center py-3 border-r border-default bg-muted/30 shrink-0"
  >
    <!-- Top Nav Items -->
    <div class="flex flex-col gap-2">
      <UTooltip v-for="item in items" :key="item.id" :text="item.label" :delay-duration="200">
        <UButton
          variant="ghost"
          size="sm"
          class="w-9 h-9 justify-center p-0"
          :color="activeItem === item.id ? 'primary' : 'neutral'"
          :disabled="!hasProject"
          :to="hasProject ? item.path : undefined"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
        </UButton>
      </UTooltip>
    </div>

    <!-- Spacer -->
    <div class="flex-1 w-full" />

    <!-- Bottom Items -->
    <div class="flex flex-col gap-2">
      <UTooltip v-for="item in bottomItems" :key="item.id" :text="item.label" :delay-duration="200">
        <UButton
          variant="ghost"
          size="sm"
          class="w-9 h-9 justify-center p-0"
          :color="activeItem === item.id ? 'primary' : 'neutral'"
          :to="item.path"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
        </UButton>
      </UTooltip>
    </div>
  </div>
</template>
