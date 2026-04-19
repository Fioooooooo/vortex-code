<script setup lang="ts">
defineProps<{
  status: "completed" | "in-progress" | "pending";
}>();
</script>

<template>
  <div class="flex-1 flex items-center px-1">
    <div
      class="h-0.5 w-full transition-all"
      :class="{
        'bg-success': status === 'completed',
        'border-t-2 border-dashed border-primary animate-pulse': status === 'in-progress',
        'border-t-2 border-dashed border-muted': status === 'pending',
      }"
    />
  </div>
</template>
