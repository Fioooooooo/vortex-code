<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useProjectStore } from "@renderer/stores/project";
import { useWorkspaceStore } from "@renderer/stores/workspace";
import { useWelcomeStore } from "@renderer/stores/welcome";
import { useColorMode } from "@vueuse/core";
import CreateProjectModal from "@renderer/components/CreateProjectModal.vue";
import type { RecentProject } from "@renderer/types/project";

const router = useRouter();
const projectStore = useProjectStore();
const workspaceStore = useWorkspaceStore();
const welcomeStore = useWelcomeStore();
const colorMode = useColorMode();

const dropdownItems = computed(() => {
  const projectItems = projectStore.recentProjects.map((project: RecentProject) => ({
    label: project.name,
    onSelect: () => {
      projectStore.openRecentProject(project);
      void router.push("/workspace");
    },
  }));

  return [
    ...projectItems,
    { type: "separator" as const },
    {
      label: "创建新项目",
      icon: "i-lucide-plus",
      onSelect: () => welcomeStore.toggleCreateProjectModal(true),
    },
  ];
});

function toggleTheme(): void {
  colorMode.value = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <header
    class="h-8.75 flex items-center border-b border-default bg-default shrink-0"
    style="-webkit-app-region: drag"
  >
    <!-- Left: Empty placeholder for macOS traffic lights -->
    <div class="w-[20%] h-full" />

    <!-- Center: Project Switcher -->
    <div class="w-[60%] h-full flex items-center justify-center">
      <UDropdownMenu
        :items="dropdownItems"
        :content="{
          align: 'center',
          side: 'bottom',
          sideOffset: 4,
        }"
        :ui="{
          content: 'w-full max-h-80 overflow-y-auto',
        }"
      >
        <div
          class="flex items-center gap-2 px-3 py-0.5 rounded-md border border-default cursor-pointer hover:bg-muted/50 transition-colors"
          style="-webkit-app-region: no-drag"
        >
          <span class="truncate max-w-50 text-sm font-normal text-muted">
            {{ projectStore.currentProject?.name ?? "未选择项目" }}
          </span>
          <UBadge size="xs" variant="subtle" color="primary" class="text-[10px]">
            {{ workspaceStore.currentAgent.name }}
          </UBadge>
          <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-muted" />
        </div>
      </UDropdownMenu>
    </div>

    <!-- Right: Controls -->
    <div class="w-[20%] h-full flex items-center justify-end pr-2">
      <div class="flex items-center justify-end gap-1" style="-webkit-app-region: no-drag">
        <!-- System Bell -->
        <UButton
          variant="ghost"
          color="neutral"
          class="w-5.5 h-5.5 flex items-center justify-center text-muted p-0"
        >
          <UIcon name="i-lucide-bell" class="w-4 h-4" />
        </UButton>
        <!-- Theme Toggle -->
        <UButton
          variant="ghost"
          color="neutral"
          class="w-5.5 h-5.5 flex items-center justify-center text-muted p-0"
          @click="toggleTheme"
        >
          <UIcon :name="colorMode === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
        </UButton>
      </div>
    </div>
  </header>

  <CreateProjectModal />
</template>
