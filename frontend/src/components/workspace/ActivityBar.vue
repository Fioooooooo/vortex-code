<script setup lang="ts">
interface NavItem {
  id: string;
  icon: string;
  label: string;
}

const items: NavItem[] = [
  { id: "workspace", icon: "i-lucide-layout-grid", label: "Workspace" },
  { id: "pipeline", icon: "i-lucide-git-branch", label: "Pipeline" },
  { id: "plugins", icon: "i-lucide-puzzle", label: "Plugins" },
  { id: "history", icon: "i-lucide-history", label: "History" },
];

const props = defineProps<{
  activeItem: string;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "toggle-sidebar"): void;
}>();

const bottomItems: NavItem[] = [{ id: "settings", icon: "i-lucide-settings", label: "Settings" }];

function handleToggleSidebar(): void {
  emit("toggle-sidebar");
}
</script>

<template>
  <div class="w-12 flex flex-col items-center py-3 border-r border-default bg-muted/30 shrink-0">
    <!-- Toggle Sidebar (mobile) -->
    <div class="mb-2 lg:hidden">
      <UTooltip text="Toggle Sidebar" :delay-duration="200">
        <UButton variant="ghost" size="sm" color="neutral" class="w-9 h-9 justify-center" @click="handleToggleSidebar">
          <UIcon name="i-lucide-panel-left" class="w-4 h-4" />
        </UButton>
      </UTooltip>
    </div>

    <!-- Top Nav Items -->
    <div class="flex flex-col gap-1">
      <UTooltip v-for="item in items" :key="item.id" :text="item.label" :delay-duration="200">
        <UButton
          variant="ghost"
          size="sm"
          class="w-9 h-9 justify-center"
          :color="props.activeItem === item.id ? 'primary' : 'neutral'"
          @click="emit('select', item.id)"
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
        <UButton
          variant="ghost"
          size="sm"
          color="neutral"
          class="w-9 h-9 justify-center"
          @click="emit('select', item.id)"
        >
          <UIcon :name="item.icon" class="w-4 h-4" />
        </UButton>
      </UTooltip>
    </div>
  </div>
</template>
