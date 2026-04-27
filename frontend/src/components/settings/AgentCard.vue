<script setup lang="ts">
import type { Agent } from "@renderer/types/settings";

defineProps<{
  agent: Agent;
  icon?: string;
}>();
</script>

<template>
  <UCard :ui="{ body: 'p-0!' }">
    <div class="flex flex-col gap-3 p-4">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden border border-default"
        >
          <img v-if="icon" :src="icon" :alt="agent.name" class="w-full h-full object-cover" />
          <UIcon v-else name="i-lucide-terminal" class="w-4 h-4 text-muted" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-highlighted truncate">{{ agent.name }}</p>
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-muted/60">v{{ agent.version }}</span>
            <span class="text-xs text-muted/40">·</span>
            <span class="text-xs text-muted/60 truncate">{{ agent.license }}</span>
          </div>
        </div>
        <UButton size="xs" variant="outline" color="neutral" class="shrink-0">
          <UIcon name="i-lucide-download" class="w-3 h-3 mr-1" />
          安装
        </UButton>
      </div>
      <p class="text-xs text-muted line-clamp-2">{{ agent.description }}</p>
      <span class="text-xs text-muted/60 truncate">{{ agent.authors.join(", ") }}</span>
    </div>
  </UCard>
</template>
