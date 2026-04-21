<script setup lang="ts">
import { ref } from "vue";
import type { UIMessage, ChatStatus } from "ai";
import { isReasoningUIPart, isTextUIPart, isToolUIPart, getToolName } from "ai";
import { isPartStreaming, isToolStreaming } from "@nuxt/ui/utils/ai";
import type { AgentType } from "@shared/types/chat";
import ChatComark from "./ChatComark";
import AgentSelect from "./AgentSelect.vue";

const agent = ref<AgentType>("claude-code");
const input = ref("");
const status = ref<ChatStatus>("ready");
const messages = ref<UIMessage[]>([
  {
    id: "6045235a-a435-46b8-989d-2df38ca2eb47",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Hello, how are you?",
      },
    ],
  },
  {
    id: "7a92b3c1-d5f8-4e76-b8a9-3c1e5fb2e0d8",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I am doing well, thank you for asking! How can I assist you today?",
      },
    ],
  },
  {
    id: "9c84d6a7-8b23-4f12-a1d5-e7f3b9c05e2a",
    role: "user",
    parts: [
      {
        type: "text",
        text: "What is the current weather in Tokyo?",
      },
    ],
  },
  {
    id: "b2e5f8c3-a1d9-4e67-b3f2-c9d8e7a6b5f4",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Based on the latest data, Tokyo is currently experiencing sunny weather with temperatures around 24°C (75°F). It's a beautiful day with clear skies. The forecast for the rest of the week shows a slight chance of rain on Thursday, with temperatures gradually rising to 28°C by the weekend. Humidity levels are moderate at around 65%, and wind speeds are light at 8 km/h from the southeast. Air quality is good with an index of 42. The UV index is high at 7, so it's recommended to wear sunscreen if you're planning to spend time outdoors. Sunrise was at 5:24 AM and sunset will be at 6:48 PM, giving Tokyo approximately 13 hours and 24 minutes of daylight today. The moon is currently in its waxing gibbous phase.",
      },
    ],
  },
  {
    id: "c3e5f8c3-a1d9-4e67-b3f2-c9d8e7a6b5f4",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Can you recommend some popular tourist attractions in Kyoto?",
      },
    ],
  },
  {
    id: "d4f5g8c3-a1d9-4e67-b3f2-c9d8e7a6b5f4",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Kyoto is known for its beautiful temples, traditional tea houses, and gardens. Some popular attractions include Kinkaku-ji (Golden Pavilion) with its stunning gold leaf exterior reflecting in the mirror pond, Fushimi Inari Shrine with its thousands of vermilion torii gates winding up the mountainside, Arashiyama Bamboo Grove where towering stalks create an otherworldly atmosphere, Kiyomizu-dera Temple perched on a hillside offering panoramic views of the city, and the historic Gion district where you might spot geisha hurrying to evening appointments through narrow stone-paved streets lined with traditional wooden machiya houses.",
      },
    ],
  },
]);
function handleSubmit(): void {
  console.log("User input:", input.value);
  input.value = "";
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex-1 overflow-y-auto py-4 px-2 relative">
      <UChatMessages
        :should-auto-scroll="true"
        :should-scroll-to-bottom="false"
        :auto-scroll="false"
        :messages="messages"
        :status="status"
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
              :text="getToolName(part)"
              :streaming="isToolStreaming(part)"
            />

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

    <div class="p-4">
      <UChatPrompt
        v-model="input"
        variant="subtle"
        class="sticky bottom-0 [view-transition-name:chat-prompt]"
        :ui="{ base: 'px-1.5' }"
        @submit="handleSubmit"
      >
        <template #footer>
          <AgentSelect v-model="agent" />

          <UChatPromptSubmit :status="status" color="neutral" size="sm" />
        </template>
      </UChatPrompt>
    </div>
  </div>
</template>
