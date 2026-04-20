<script setup lang="ts">
import ChatArea from "@renderer/components/workspace/ChatArea.vue";
import DiffPanel from "@renderer/components/workspace/DiffPanel.vue";
import Sidebar from "@renderer/components/workspace/Sidebar.vue";
import { useWorkspaceStore } from "@renderer/stores/workspace";

const workspaceStore = useWorkspaceStore();
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <div class="h-full shrink-0">
      <Sidebar />
    </div>

    <main class="flex-1 flex flex-col min-w-0 bg-default">
      <ChatArea />
    </main>

    <div v-if="workspaceStore.diffPanelOpen" class="h-full shrink-0">
      <DiffPanel />
    </div>
  </div>
</template>
