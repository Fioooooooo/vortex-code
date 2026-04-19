<script setup lang="ts">
import { useWorkspaceStore } from "@renderer/stores/workspace";
import SessionList from "./SessionList.vue";
import FileTree from "./FileTree.vue";

const workspaceStore = useWorkspaceStore();

const tabs = [
  { id: "sessions" as const, label: "Sessions", icon: "i-lucide-message-square" },
  { id: "files" as const, label: "Files", icon: "i-lucide-folder-tree" },
];
</script>

<template>
  <div class="w-[260px] flex flex-col border-r border-default bg-default shrink-0">
    <!-- Tab Switcher -->
    <div class="flex border-b border-default">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
        :class="
          workspaceStore.sidebarTab === tab.id
            ? 'text-primary border-b-2 border-primary bg-primary/5'
            : 'text-muted hover:text-highlighted hover:bg-muted/50'
        "
        @click="workspaceStore.setSidebarTab(tab.id)"
      >
        <UIcon :name="tab.icon" class="w-3.5 h-3.5" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <SessionList v-if="workspaceStore.sidebarTab === 'sessions'" />
      <FileTree v-else />
    </div>
  </div>
</template>
