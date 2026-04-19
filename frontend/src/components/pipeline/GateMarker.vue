<script setup lang="ts">
import type { GateCondition } from "@renderer/types/pipeline";

defineProps<{
  gate: GateCondition | undefined;
  satisfied: boolean;
}>();
</script>

<template>
  <UTooltip v-if="gate" :text="gate.description">
    <div class="w-3 h-3 rotate-45 shrink-0 mx-0.5 cursor-help" :class="satisfied ? 'bg-success' : 'bg-error'" />
  </UTooltip>
</template>
