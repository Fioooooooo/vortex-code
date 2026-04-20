<script setup lang="ts">
import { useChatStore } from "@renderer/stores/chat";
import type { ConfirmMessage } from "@renderer/types/workspace";

const props = defineProps<{
  message: ConfirmMessage;
}>();

const chatStore = useChatStore();

function handleAllow(): void {
  chatStore.resolveConfirm(props.message.id, true);
}

function handleDeny(): void {
  chatStore.resolveConfirm(props.message.id, false);
}
</script>

<template>
  <div class="flex gap-3">
    <div class="w-7 h-7 rounded-full bg-warning flex items-center justify-center shrink-0 mt-0.5">
      <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-white" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 space-y-3">
        <div class="flex items-start gap-2">
          <UIcon name="i-lucide-shield-question" class="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p class="text-sm text-highlighted">{{ message.description }}</p>
        </div>
        <div class="flex gap-2 justify-end">
          <UButton variant="outline" color="neutral" size="sm" @click="handleDeny"> Deny </UButton>
          <UButton color="primary" size="sm" @click="handleAllow"> Allow </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
