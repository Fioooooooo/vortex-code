<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import type { ChatAgent } from "@shared/types/chat-agent";
import { useAcpAgentsStore } from "@renderer/stores/acp-agents";
import { useSessionStore } from "@renderer/stores/session";

const agent = defineModel<ChatAgent["acpAgentId"]>({ required: true });

const acpAgentsStore = useAcpAgentsStore();
const sessionStore = useSessionStore();
const { statuses, icons } = storeToRefs(acpAgentsStore);
const { activeSession } = storeToRefs(sessionStore);

const disabled = computed(() => (activeSession.value?.turnCount ?? 0) === 0);

const installedAgents = computed(() =>
  Object.entries(statuses.value)
    .filter(([, s]) => s.installed)
    .map(([id]) => ({
      value: id,
      label: id,
      icon: icons.value[id] ? undefined : "i-lucide-cpu",
      avatar: icons.value[id] ? { src: icons.value[id] } : undefined,
    }))
);

const currentIcon = computed(() => {
  if (icons.value[agent.value]) return undefined;
  return "i-lucide-cpu";
});

const currentAvatar = computed(() => {
  if (icons.value[agent.value]) return { src: icons.value[agent.value] };
  return undefined;
});
</script>

<template>
  <USelectMenu
    v-model="agent"
    :items="installedAgents"
    value-key="value"
    size="sm"
    :icon="currentIcon"
    :avatar="currentAvatar"
    :disabled="disabled"
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{
      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
    }"
  >
    <template v-if="installedAgents.length === 0" #empty>
      <div class="px-3 py-2 text-sm text-muted">暂无已安装的 Agent，请前往设置安装</div>
    </template>
  </USelectMenu>
</template>
