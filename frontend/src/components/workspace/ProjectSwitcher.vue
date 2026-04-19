<script setup lang="ts">
import { useWorkspaceStore } from "@renderer/stores/workspace";

const workspaceStore = useWorkspaceStore();

function switchProject(projectId: string): void {
  // Mock: just log for now
  console.log("Switch to project:", projectId);
}

function createNewProject(): void {
  // Navigate to welcome page for project creation
  window.location.href = "/";
}

function openProjectSettings(): void {
  console.log("Open project settings");
}
</script>

<template>
  <UCard class="w-72 shadow-lg">
    <div class="space-y-1">
      <div
        v-for="project in workspaceStore.projects"
        :key="project.id"
        class="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
        :class="{ 'bg-muted/70': project.id === workspaceStore.activeProject?.id }"
        @click="switchProject(project.id)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-folder" class="w-4 h-4 text-muted shrink-0" />
          <span class="text-sm truncate">{{ project.name }}</span>
        </div>
        <UBadge size="xs" variant="subtle" color="primary" class="text-[10px] shrink-0">
          {{ project.agent.name }}
        </UBadge>
      </div>
    </div>

    <template #footer>
      <div class="space-y-1">
        <UButton variant="ghost" color="neutral" size="sm" class="w-full justify-start gap-2" @click="createNewProject">
          <UIcon name="i-lucide-plus" class="w-4 h-4" />
          <span>New Project</span>
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          class="w-full justify-start gap-2"
          @click="openProjectSettings"
        >
          <UIcon name="i-lucide-settings" class="w-4 h-4" />
          <span>Project Settings</span>
        </UButton>
      </div>
    </template>
  </UCard>
</template>
