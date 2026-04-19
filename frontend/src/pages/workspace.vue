<script setup lang="ts">
import { ref } from "vue";
import { useWorkspaceStore } from "@renderer/stores/workspace";
import AppHeader from "@renderer/components/workspace/AppHeader.vue";
import ActivityBar from "@renderer/components/workspace/ActivityBar.vue";
import Sidebar from "@renderer/components/workspace/Sidebar.vue";
import ChatArea from "@renderer/components/workspace/ChatArea.vue";
import DiffPanel from "@renderer/components/workspace/DiffPanel.vue";

const workspaceStore = useWorkspaceStore();
const showProjectSwitcher = ref(false);
const activeNavItem = ref("workspace");

function handleToggleProjectSwitcher(): void {
  showProjectSwitcher.value = !showProjectSwitcher.value;
}

function handleToggleSidebar(): void {
  workspaceStore.toggleSidebar();
}
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden bg-default">
    <AppHeader @toggle-project-switcher="handleToggleProjectSwitcher" />

    <div class="flex-1 flex overflow-hidden relative">
      <ActivityBar :active-item="activeNavItem" @toggle-sidebar="handleToggleSidebar" />

      <!-- Sidebar: responsive overlay on small screens -->
      <div
        class="absolute lg:relative z-20 h-full transition-transform duration-300 ease-in-out"
        :class="workspaceStore.sidebarCollapsed ? '-translate-x-full lg:hidden' : 'translate-x-0'"
      >
        <Sidebar />
      </div>

      <!-- Backdrop for mobile sidebar -->
      <div
        v-if="!workspaceStore.sidebarCollapsed"
        class="absolute inset-0 bg-black/20 z-10 lg:hidden"
        @click="workspaceStore.toggleSidebar()"
      />

      <main class="flex-1 flex flex-col min-w-0 bg-default relative">
        <ChatArea />
      </main>

      <!-- DiffPanel: responsive overlay on <xl -->
      <div
        class="absolute xl:relative z-20 h-full right-0 top-0 transition-transform duration-300 ease-in-out"
        :class="workspaceStore.diffPanelOpen ? 'translate-x-0' : 'translate-x-full'"
      >
        <DiffPanel />
      </div>

      <!-- Backdrop for diff panel overlay -->
      <div
        v-if="workspaceStore.diffPanelOpen"
        class="absolute inset-0 bg-black/20 z-10 xl:hidden"
        @click="workspaceStore.closeDiffPanel()"
      />
    </div>
  </div>
</template>
