<script setup lang="ts">
import { computed } from "vue";
import { useWorkspaceStore } from "@renderer/stores/workspace";
import { useColorMode } from "@vueuse/core";

const workspaceStore = useWorkspaceStore();
const colorMode = useColorMode();

defineEmits<{
  (e: "toggleProjectSwitcher"): void;
}>();

const agentStatusLabel = computed(() => {
  switch (workspaceStore.agentStatus) {
    case "idle":
      return "Idle";
    case "thinking":
      return "Thinking";
    case "executing":
      return "Executing";
    case "awaiting-confirmation":
      return "Awaiting";
    default:
      return "Idle";
  }
});

const agentStatusColor = computed(() => {
  switch (workspaceStore.agentStatus) {
    case "idle":
      return "bg-neutral-400 dark:bg-neutral-500";
    case "thinking":
      return "bg-warning";
    case "executing":
      return "bg-info";
    case "awaiting-confirmation":
      return "bg-error";
    default:
      return "bg-neutral-400 dark:bg-neutral-500";
  }
});

function toggleTheme(): void {
  colorMode.value = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <header class="h-12 flex items-center justify-between px-4 border-b border-default bg-default shrink-0">
    <!-- Left: Project Switcher -->
    <div class="flex items-center gap-2">
      <UButton variant="ghost" color="neutral" class="gap-2 font-semibold" @click="$emit('toggleProjectSwitcher')">
        <span class="truncate max-w-[200px]">{{ workspaceStore.activeProject?.name ?? "No Project" }}</span>
        <UBadge size="xs" variant="subtle" color="primary" class="text-[10px]">
          {{ workspaceStore.currentAgent.name }}
        </UBadge>
        <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-muted" />
      </UButton>
    </div>

    <!-- Right: Controls -->
    <div class="flex items-center gap-3">
      <!-- Token Usage -->
      <UPopover mode="hover">
        <UButton variant="ghost" color="neutral" size="xs" class="gap-1.5 text-muted">
          <UIcon name="i-lucide-coins" class="w-3.5 h-3.5" />
          <span class="text-xs tabular-nums">{{ workspaceStore.tokenUsage.total.toLocaleString() }}</span>
        </UButton>
        <template #content>
          <div class="p-3 space-y-2 min-w-[180px]">
            <p class="text-sm font-medium">Token Usage</p>
            <div class="space-y-1 text-xs text-muted">
              <div class="flex justify-between">
                <span>Input</span>
                <span class="tabular-nums">{{ workspaceStore.tokenUsage.input.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span>Output</span>
                <span class="tabular-nums">{{ workspaceStore.tokenUsage.output.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between font-medium text-highlighted">
                <span>Total</span>
                <span class="tabular-nums">{{ workspaceStore.tokenUsage.total.toLocaleString() }}</span>
              </div>
              <div class="border-t border-default pt-1 flex justify-between text-success">
                <span>Est. Cost</span>
                <span>{{ workspaceStore.tokenUsage.estimatedCost }}</span>
              </div>
            </div>
          </div>
        </template>
      </UPopover>

      <!-- Agent Status -->
      <div class="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
        <span class="w-2 h-2 rounded-full shrink-0" :class="agentStatusColor" />
        <span class="text-xs text-muted">{{ agentStatusLabel }}</span>
      </div>

      <!-- Theme Toggle -->
      <UButton variant="ghost" color="neutral" size="xs" class="text-muted" @click="toggleTheme">
        <UIcon :name="colorMode === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
      </UButton>
    </div>
  </header>
</template>
