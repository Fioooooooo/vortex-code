<script setup lang="ts">
import { computed } from "vue";
import type { PipelineStageRun } from "@renderer/types/pipeline";

const props = defineProps<{
  stage: PipelineStageRun;
}>();

const reviewComments = computed(() => props.stage.output?.reviewComments ?? []);

const categoryIcon: Record<string, string> = {
  bug: "i-lucide-bug",
  style: "i-lucide-palette",
  performance: "i-lucide-zap",
  security: "i-lucide-shield-alert",
};

const categoryColor: Record<string, string> = {
  bug: "error",
  style: "primary",
  performance: "warning",
  security: "error",
};

const severityColor: Record<string, string> = {
  critical: "error",
  major: "warning",
  minor: "primary",
  info: "neutral",
};
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Summary -->
    <div
      v-if="reviewComments.length > 0"
      class="flex items-center gap-4 px-4 py-2 rounded-md border border-default bg-muted/20"
    >
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-error" />
        <span class="text-sm text-default"
          >{{ reviewComments.filter((c) => c.severity === "critical").length }} Critical</span
        >
      </div>
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-warning" />
        <span class="text-sm text-default"
          >{{ reviewComments.filter((c) => c.severity === "major").length }} Major</span
        >
      </div>
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-info" class="w-4 h-4 text-primary" />
        <span class="text-sm text-default"
          >{{ reviewComments.filter((c) => c.severity === "minor").length }} Minor</span
        >
      </div>
    </div>

    <!-- Review Comments -->
    <div v-if="reviewComments.length > 0" class="space-y-2">
      <div
        v-for="comment in reviewComments"
        :key="comment.id"
        class="rounded-md border border-default bg-muted/20 p-3 space-y-2"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              :name="categoryIcon[comment.category] ?? 'i-lucide-file-text'"
              class="w-4 h-4"
              :class="`text-${categoryColor[comment.category] ?? 'default'}`"
            />
            <UBadge :color="categoryColor[comment.category] as any" size="xs" variant="soft">
              {{ comment.category }}
            </UBadge>
            <UBadge :color="severityColor[comment.severity] as any" size="xs" variant="soft">
              {{ comment.severity }}
            </UBadge>
          </div>
        </div>

        <button class="text-sm text-primary hover:underline text-left">
          {{ comment.filePath }}:{{ comment.lineStart }}
          <span v-if="comment.lineEnd > comment.lineStart">-{{ comment.lineEnd }}</span>
        </button>

        <p class="text-sm text-default">{{ comment.description }}</p>

        <div v-if="comment.fixed" class="flex items-center gap-1.5 text-xs text-success">
          <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
          Fixed
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="reviewComments.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-clipboard-check" class="w-8 h-8 text-muted mx-auto mb-2" />
      <p class="text-sm text-muted">No review comments.</p>
    </div>
  </div>
</template>
