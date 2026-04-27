<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSettingsStore } from "@renderer/stores/settings";
import AgentCard from "./AgentCard.vue";

const store = useSettingsStore();
const refreshing = ref(false);

const agents = computed(() => store.agentRegistry?.agents ?? []);
const currentInstallAgentId = computed(
  () =>
    Object.values(store.installProgress).find(
      (progress) => progress.status === "downloading" || progress.status === "installing"
    )?.agentId ?? null
);
const hasRegistryError = computed(
  () => !store.registryLoading && !agents.value.length && !!store.registryError
);

onMounted(async () => {
  await store.loadRegistry();
  await Promise.all([store.loadIcons(), store.refreshAgentStatus()]);
});

async function refreshStatuses(): Promise<void> {
  refreshing.value = true;
  await store.refreshAgentStatus();
  refreshing.value = false;
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">ACP Agents</h2>
        <p class="text-sm text-muted mt-0.5">支持 Agent Client Protocol 的 CLI Agent。</p>
      </div>
      <UButton
        size="sm"
        variant="outline"
        color="neutral"
        :loading="refreshing"
        @click="refreshStatuses"
      >
        <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-1.5" />
        Refresh
      </UButton>
    </div>

    <div
      v-if="store.registryLoading && !agents.length"
      class="flex items-center justify-center py-16"
    >
      <UIcon name="i-lucide-loader-circle" class="w-6 h-6 text-muted animate-spin" />
    </div>

    <div v-else-if="hasRegistryError" class="flex items-center justify-center py-16">
      <p class="text-sm text-muted">{{ store.registryError }}</p>
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <AgentCard
        v-for="agent in agents"
        :key="agent.id"
        :agent="agent"
        :icon="store.agentIcons[agent.id]"
        :agent-status="store.agentStatuses[agent.id]"
        :install-progress="store.installProgress[agent.id]"
        :is-installing="currentInstallAgentId === agent.id"
        :action-disabled="!!currentInstallAgentId && currentInstallAgentId !== agent.id"
        @install="store.installAgent"
      />
    </div>
  </div>
</template>
