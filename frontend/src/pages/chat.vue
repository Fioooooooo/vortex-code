<script setup lang="ts">
import ChatContainer from "@renderer/components/chat/ChatContainer.vue";
import Sidebar from "@renderer/components/chat/Sidebar.vue";
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <div class="h-full shrink-0">
      <Sidebar />
    </div>

    <main class="flex-1 flex flex-col min-w-0 bg-default">
      <ChatContainer />
    </main>
  </div>
</template>
