<script setup lang="ts">
import { ref } from "vue";

const expanded = ref(false);
const mcpServerUrl = ref("");
const skillConfig = ref("");

function toggleExpanded(): void {
  expanded.value = !expanded.value;
}

function saveCustomIntegration(): void {
  // Mock save — no actual persistence in MVP
  expanded.value = false;
  mcpServerUrl.value = "";
  skillConfig.value = "";
}
</script>

<template>
  <div class="border-t border-default pt-6">
    <button
      class="flex items-center gap-2 text-sm text-muted hover:text-highlighted transition-colors"
      @click="toggleExpanded"
    >
      <UIcon
        :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        class="w-4 h-4"
      />
      <span>Advanced — Custom Integration</span>
    </button>

    <div v-if="expanded" class="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg border border-default">
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-highlighted">MCP Server URL</label>
        <UInput v-model="mcpServerUrl" placeholder="http://localhost:3000/sse" size="sm" />
        <p class="text-xs text-muted">自定义 MCP Server 的 SSE 端点地址</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium text-highlighted">Custom Skill Config (JSON)</label>
        <UTextarea
          v-model="skillConfig"
          placeholder='{ "name": "my-skill", "endpoint": "..." }'
          size="sm"
          :rows="4"
        />
        <p class="text-xs text-muted">自定义 Skill 的 JSON 配置</p>
      </div>

      <div class="flex justify-end">
        <UButton size="sm" variant="soft" @click="saveCustomIntegration">
          Save Configuration
        </UButton>
      </div>
    </div>
  </div>
</template>
