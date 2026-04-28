<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAcpAgentsStore } from "@renderer/stores/acp-agents";
import AgentCard from "./AgentCard.vue";

const store = useAcpAgentsStore();
const refreshing = ref(false);

const agents = computed(() => store.registry?.agents ?? []);
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
  await Promise.all([store.loadIcons(), store.refreshStatus()]);
});

async function refreshStatuses(): Promise<void> {
  refreshing.value = true;
  await store.refreshStatus();
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
        icon="i-lucide-refresh-cw"
        :loading="refreshing"
        @click="refreshStatuses"
      >
        刷新
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
        :icon="store.icons[agent.id]"
        :agent-status="store.statuses[agent.id]"
        :install-progress="store.installProgress[agent.id]"
        :is-installing="currentInstallAgentId === agent.id"
        :action-disabled="!!currentInstallAgentId && currentInstallAgentId !== agent.id"
        @install="store.installAgent"
      />
    </div>
  </div>
</template>
