<script setup lang="ts">
import ChatContainer from "@renderer/components/chat/ChatContainer.vue";
import DiffPanel from "@renderer/components/chat/DiffPanel.vue";
import Sidebar from "@renderer/components/chat/Sidebar.vue";
import { useChatStore } from "@renderer/stores/chat";

const chatStore = useChatStore();
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <div class="h-full shrink-0">
      <Sidebar />
    </div>

    <main class="flex-1 flex flex-col min-w-0 bg-default">
      <ChatContainer />
    </main>

    <div v-if="chatStore.diffPanelOpen" class="h-full shrink-0">
      <DiffPanel />
    </div>
  </div>
</template>
