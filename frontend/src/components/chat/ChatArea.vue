<script setup lang="ts">
import { computed, ref, nextTick, watch } from "vue";
import { useChatStore } from "@renderer/stores/chat";
import type {
  UserMessage,
  ThinkingMessage,
  FileOpMessage,
  CommandMessage,
  ConfirmMessage,
  TextMessage,
} from "@shared/types/chat";
import MessageUser from "./MessageUser.vue";
import MessageThinking from "./MessageThinking.vue";
import MessageFileOp from "./MessageFileOp.vue";
import MessageCommand from "./MessageCommand.vue";
import MessageConfirm from "./MessageConfirm.vue";
import MessageText from "./MessageText.vue";
import InputBar from "./InputBar.vue";

const chatStore = useChatStore();
const messagesContainer = ref<HTMLElement | null>(null);

const messages = computed(() => chatStore.activeSession?.messages ?? []);

function scrollToBottom(): void {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <!-- Empty State -->
      <div
        v-if="messages.length === 0"
        class="h-full flex flex-col items-center justify-center text-muted"
      >
        <UIcon name="i-lucide-bot" class="w-12 h-12 mb-3 opacity-30" />
        <p class="text-sm">Start a conversation with {{ chatStore.currentAgent.name }}</p>
      </div>

      <!-- Message List -->
      <template v-else>
        <template v-for="msg in messages" :key="msg.id">
          <MessageUser v-if="msg.type === 'user'" :message="msg as UserMessage" />
          <MessageThinking v-else-if="msg.type === 'thinking'" :message="msg as ThinkingMessage" />
          <MessageFileOp v-else-if="msg.type === 'file-op'" :message="msg as FileOpMessage" />
          <MessageCommand v-else-if="msg.type === 'command'" :message="msg as CommandMessage" />
          <MessageConfirm v-else-if="msg.type === 'confirm'" :message="msg as ConfirmMessage" />
          <MessageText v-else-if="msg.type === 'text'" :message="msg as TextMessage" />
        </template>
      </template>
    </div>

    <!-- Input Area -->
    <InputBar />
  </div>
</template>
