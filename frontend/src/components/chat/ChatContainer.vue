<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { isReasoningUIPart, isTextUIPart, isToolUIPart } from "ai";
import { isPartStreaming, isToolStreaming } from "@nuxt/ui/utils/ai";
import type { ChatAgent } from "@shared/types/chat-agent";
import { useChatStore } from "@renderer/stores/chat";
import { useSessionStore } from "@renderer/stores/session";
import ChatComark from "./ChatComark";
import ChatAgentSelect from "./ChatAgentSelect.vue";
import { getToolText, getToolSuffix, getToolOutput } from "@renderer/utils/chatTool";

const store = useChatStore();
const sessionStore = useSessionStore();
const { chatStatus } = storeToRefs(store);
const { activeSession } = storeToRefs(sessionStore);

const agent = computed<ChatAgent["acpAgentId"]>({
  get: () => store.currentAgent.acpAgentId,
  set: () => {},
});

const input = ref("");

const messages = computed(() => activeSession.value?.messages ?? []);

function handleSubmit(): void {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  store.sendMessage(text);
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex-1 overflow-y-auto py-4 px-2 relative">
      <div class="max-w-240 mx-auto">
        <UChatMessages
          should-auto-scroll
          should-scroll-to-bottom
          :auto-scroll="false"
          :messages="messages"
          :status="chatStatus"
          :user="{
            side: 'right',
            avatar: {
              icon: 'i-lucide-user',
            },
            ui: {
              container: 'flex-row-reverse justify-start',
            },
          }"
          :assistant="{
            side: 'left',
            avatar: {
              src: '/claude.webp',
              ui: {
                root: 'bg-transparent',
              },
            },
            actions: [
              {
                label: 'Copy to clipboard',
                icon: 'i-lucide-copy',
              },
            ],
          }"
        >
          <template #content="{ message }">
            <template
              v-for="(part, index) in message.parts"
              :key="`${message.id}-${part.type}-${index}`"
            >
              <UChatReasoning
                v-if="isReasoningUIPart(part)"
                :text="part.text"
                :streaming="isPartStreaming(part)"
              >
                <ChatComark :markdown="part.text" :streaming="isPartStreaming(part)" />
              </UChatReasoning>

              <UChatTool
                v-else-if="isToolUIPart(part)"
                :streaming="isToolStreaming(part)"
                :text="getToolText(part)"
                :suffix="getToolSuffix(part)"
              >
                <pre v-if="getToolOutput(part)" class="whitespace-pre-wrap text-xs">{{
                  getToolOutput(part)
                }}</pre>
              </UChatTool>

              <template v-else-if="isTextUIPart(part)">
                <ChatComark
                  v-if="message.role === 'assistant'"
                  :markdown="part.text"
                  :streaming="isPartStreaming(part)"
                />
                <p v-else-if="message.role === 'user'" class="whitespace-pre-wrap">
                  {{ part.text }}
                </p>
              </template>
            </template>
          </template>
        </UChatMessages>
      </div>
    </div>

    <div class="p-4">
      <div class="max-w-240 mx-auto">
        <UChatPrompt
          v-model="input"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt]"
          :ui="{ base: 'px-1.5' }"
          @submit="handleSubmit"
        >
          <template #footer>
            <ChatAgentSelect v-model="agent" />

            <UChatPromptSubmit :status="chatStatus" color="neutral" size="sm" />
          </template>
        </UChatPrompt>
      </div>
    </div>
  </div>
</template>
