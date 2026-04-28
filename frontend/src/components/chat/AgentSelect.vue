<script setup lang="ts">
import { computed } from "vue";
import type { ChatAgent } from "@shared/types/chat-agent";

type AgentOption = {
  value: ChatAgent["acpAgentId"];
  label: string;
  icon: string;
};

const agent = defineModel<ChatAgent["acpAgentId"]>({ required: true });

const agents: AgentOption[] = [
  {
    value: "claude-code",
    label: "Claude Code",
    icon: "i-lucide-cpu",
  },
  {
    value: "codex",
    label: "Codex",
    icon: "i-lucide-cpu",
  },
];

const icon = computed<string | undefined>(() => {
  return agents.find((item) => item.value === agent.value)?.icon;
});
</script>

<template>
  <USelectMenu
    v-model="agent"
    :items="agents"
    value-key="value"
    size="sm"
    :icon="icon"
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{
      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
    }"
  />
</template>
