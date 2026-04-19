<script setup lang="ts">
import { computed } from "vue";
import type { PipelineStageRun } from "@renderer/types/pipeline";

const props = defineProps<{
  stage: PipelineStageRun;
}>();

const deployLog = computed(() => props.stage.output?.deployLog);
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Target Info -->
    <div v-if="deployLog" class="rounded-lg border border-default bg-muted/30 p-4 space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-rocket" class="w-4 h-4 text-primary" />
        Deployment Target
      </h4>
      <div class="flex items-center gap-4 text-sm">
        <div>
          <span class="text-muted">Environment:</span>
          <span class="text-default ml-1">{{ deployLog.target.environment }}</span>
        </div>
        <div>
          <span class="text-muted">URL:</span>
          <a :href="deployLog.target.url" target="_blank" class="text-primary hover:underline ml-1">
            {{ deployLog.target.url }}
          </a>
        </div>
      </div>
    </div>

    <!-- Result Badge -->
    <div v-if="deployLog" class="flex items-center gap-2">
      <UBadge :color="deployLog.result === 'success' ? 'success' : 'error'" size="sm" variant="soft" class="text-sm">
        <UIcon
          :name="deployLog.result === 'success' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
          class="w-4 h-4 mr-1"
        />
        {{ deployLog.result === "success" ? "Deployment Successful" : "Deployment Failed" }}
      </UBadge>
    </div>

    <!-- Log Stream -->
    <div v-if="deployLog && deployLog.logs.length > 0" class="space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-scroll-text" class="w-4 h-4" />
        Deployment Logs
      </h4>
      <div class="rounded-md border border-default bg-default p-3 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
        <p v-for="(log, idx) in deployLog.logs" :key="idx" class="text-muted">
          {{ log }}
        </p>
      </div>
    </div>

    <!-- Verification Results -->
    <div v-if="deployLog?.verificationResult" class="space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
        Post-Deployment Verification
      </h4>
      <div class="space-y-1">
        <div
          v-for="check in deployLog.verificationResult.checks"
          :key="check.name"
          class="flex items-center gap-2 px-3 py-2 rounded-md border border-default bg-muted/20 text-sm"
        >
          <UIcon
            :name="check.passed ? 'i-lucide-check' : 'i-lucide-x'"
            class="w-4 h-4"
            :class="check.passed ? 'text-success' : 'text-error'"
          />
          <span class="text-default">{{ check.name }}</span>
          <span v-if="check.message" class="text-xs text-muted ml-auto">{{ check.message }}</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!deployLog" class="text-center py-8">
      <UIcon name="i-lucide-rocket" class="w-8 h-8 text-muted mx-auto mb-2" />
      <p class="text-sm text-muted">No deployment records yet.</p>
    </div>
  </div>
</template>
