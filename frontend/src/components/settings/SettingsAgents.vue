<script setup lang="ts">
import { ref, onMounted } from "vue";
import { netApi } from "@renderer/api/net";
import type { Agent } from "@renderer/types/settings";
import AgentCard from "./AgentCard.vue";

const REGISTRY_URL = "https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json";

const agents = ref<Agent[]>([]);
const loading = ref(true);
const error = ref(false);
const iconMap = ref<Record<string, string>>({});

onMounted(async () => {
  try {
    const res = await netApi.fetch(REGISTRY_URL);
    if (res.ok) {
      const list: Agent[] = (res.data as { agents: Agent[] }).agents ?? [];
      agents.value = list;
      await Promise.allSettled(
        list
          .filter((a) => a.icon)
          .map(async (a) => {
            const imgRes = await netApi.fetchImage(a.icon!);
            if (imgRes.ok) iconMap.value[a.id] = imgRes.data as string;
          })
      );
    } else {
      error.value = true;
    }
  } catch (err) {
    error.value = true;
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">ACP Agents</h2>
        <p class="text-sm text-muted mt-0.5">支持 Agent Client Protocol 的 CLI Agent。</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="w-6 h-6 text-muted animate-spin" />
    </div>

    <div v-else-if="error" class="flex items-center justify-center py-16">
      <p class="text-sm text-muted">加载失败，请检查网络连接。</p>
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <AgentCard v-for="agent in agents" :key="agent.id" :agent="agent" :icon="iconMap[agent.id]" />
    </div>
  </div>
</template>
