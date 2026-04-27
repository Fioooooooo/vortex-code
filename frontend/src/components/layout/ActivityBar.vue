<script setup lang="ts">
import { computed } from "vue";
import { useRoute, type RouteLocationRaw } from "vue-router";
import { useProjectStore } from "@renderer/stores/project";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  to: RouteLocationRaw;
}

const route = useRoute();
const projectStore = useProjectStore();

const hasProject = computed(() => projectStore.hasCurrentProject);

const items: NavItem[] = [
  { id: "chat", icon: "i-lucide-message-circle-more", label: "对话", to: "/chat" },
  { id: "task", icon: "i-lucide-list-checks", label: "任务", to: "/task" },
  { id: "proposal", icon: "i-lucide-file-pen", label: "提案", to: "/proposal" },
  { id: "workflow", icon: "i-lucide-workflow", label: "工作流", to: "/workflow" },
  { id: "cron", icon: "i-lucide-calendar-days", label: "定时任务", to: "/cron" },
  { id: "integration", icon: "i-lucide-plug", label: "集成", to: "/integration" },
];

const bottomItems: NavItem[] = [
  { id: "setting", icon: "i-lucide-settings", label: "设置", to: "/settings" },
];

const activeItem = computed(() => {
  if (route.path.startsWith("/task")) return "task";
  if (route.path.startsWith("/proposal")) return "proposal";
  if (route.path.startsWith("/workflow")) return "workflow";
  if (route.path.startsWith("/cron")) return "cron";
  if (route.path.startsWith("/integration")) return "integration";
  if (route.path.startsWith("/settings")) return "setting";
  if (route.path.startsWith("/chat")) return "chat";
  return "chat";
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
          :to="hasProject ? item.to : undefined"
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
          :to="item.to"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
        </UButton>
      </UTooltip>
    </div>
  </div>
</template>
