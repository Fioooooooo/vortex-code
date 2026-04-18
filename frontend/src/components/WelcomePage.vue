<script setup lang="ts">
import { computed } from "vue";
import { useWelcomeStore } from "@renderer/stores/welcome";
import { useTimeAgo } from "@vueuse/core";
import type { RecentProject } from "@renderer/types/project";
import CreateProjectModal from "./CreateProjectModal.vue";

const welcomeStore = useWelcomeStore();

const recentProjects = computed(() => welcomeStore.recentProjects);

function handleOpenFolder(): void {
  welcomeStore.openFolder();
}

function handleCreateProject(): void {
  welcomeStore.toggleCreateProjectModal(true);
}

function handleOpenRecent(project: RecentProject): void {
  welcomeStore.openRecentProject(project);
}

function handleRemove(projectId: string): void {
  welcomeStore.removeRecentProject(projectId);
}

function formatTime(date: Date): string {
  return useTimeAgo(date).value;
}
</script>

<template>
  <div class="h-screen w-full flex items-center justify-center bg-default">
    <div class="flex flex-col items-center max-w-xl w-full px-6 py-8">
      <!-- Brand Identity -->
      <div class="text-center mb-10">
        <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary flex items-center justify-center">
          <UIcon name="i-lucide-code-2" class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-highlighted">Vortex Code</h1>
        <p class="text-muted mt-1">Autonomous Coding Pipeline</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 w-full mb-10">
        <UButton
          icon="i-lucide-folder-open"
          color="primary"
          size="lg"
          class="flex-1 justify-center"
          @click="handleOpenFolder"
        >
          Open Folder
        </UButton>
        <UButton
          icon="i-lucide-plus"
          variant="outline"
          color="neutral"
          size="lg"
          class="flex-1 justify-center"
          @click="handleCreateProject"
        >
          Create Project
        </UButton>
      </div>

      <!-- Recent Projects -->
      <div class="w-full">
        <h2 class="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Recent Projects</h2>

        <!-- Empty State -->
        <div v-if="recentProjects.length === 0" class="text-center text-muted py-8">
          No recent projects. Open a folder or create a new project to get started.
        </div>

        <!-- Project List -->
        <div v-else class="max-h-80 overflow-y-auto space-y-1">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="group flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            @click="handleOpenRecent(project)"
          >
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-highlighted truncate">
                {{ project.name }}
              </div>
              <div class="text-xs text-muted truncate">{{ project.path }}</div>
            </div>
            <div class="flex items-center gap-3 ml-4">
              <span class="text-xs text-muted whitespace-nowrap">
                {{ formatTime(project.lastOpenedAt) }}
              </span>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                size="xs"
                color="neutral"
                class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                @click.stop="handleRemove(project.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <CreateProjectModal />
</template>
