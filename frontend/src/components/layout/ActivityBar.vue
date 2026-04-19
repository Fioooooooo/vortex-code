<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  to: RouteLocationRaw;
}

const items: NavItem[] = [
  { id: "workspace", icon: "i-lucide-layout-grid", label: "Workspace", to: "/workspace" },
  { id: "pipeline", icon: "i-lucide-git-branch", label: "Pipeline", to: "/pipeline" },
  { id: "integration", icon: "i-lucide-puzzle", label: "Integrations", to: "/integration" },
];

const props = defineProps<{
  activeItem: string;
}>();

const bottomItems: NavItem[] = [{ id: "setting", icon: "i-lucide-settings", label: "Setting", to: "/setting" }];
</script>

<template>
  <div class="w-12 flex flex-col items-center py-3 border-r border-default bg-muted/30 shrink-0">
    <!-- Top Nav Items -->
    <div class="flex flex-col gap-1">
      <UTooltip v-for="item in items" :key="item.id" :text="item.label" :delay-duration="200">
        <UButton
          variant="ghost"
          size="sm"
          class="w-9 h-9 justify-center"
          :color="props.activeItem === item.id ? 'primary' : 'neutral'"
          :to="item.to"
        >
          <UIcon :name="item.icon" class="w-4 h-4" />
        </UButton>
      </UTooltip>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Bottom Items -->
    <div class="flex flex-col gap-1">
      <UTooltip v-for="item in bottomItems" :key="item.id" :text="item.label" :delay-duration="200">
        <UButton variant="ghost" size="sm" color="neutral" class="w-9 h-9 justify-center" :to="item.to">
          <UIcon :name="item.icon" class="w-4 h-4" />
        </UButton>
      </UTooltip>
    </div>
  </div>
</template>
