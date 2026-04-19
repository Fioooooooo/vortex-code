<script setup lang="ts">
import { computed } from "vue";
import type { PipelineStageRun } from "@renderer/types/pipeline";

const props = defineProps<{
  stage: PipelineStageRun;
}>();

const testResult = computed(() => props.stage.output?.testResult);
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Summary Card -->
    <div v-if="testResult" class="rounded-lg border border-default bg-muted/30 p-4">
      <h4 class="text-sm font-semibold text-default mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-test-tube" class="w-4 h-4 text-primary" />
        Test Results
      </h4>

      <div class="grid grid-cols-3 gap-3 mb-3">
        <div class="text-center p-3 rounded-md bg-success/10">
          <p class="text-2xl font-bold text-success">{{ testResult.passed }}</p>
          <p class="text-xs text-muted">Passed</p>
        </div>
        <div class="text-center p-3 rounded-md" :class="testResult.failed > 0 ? 'bg-error/10' : 'bg-muted/20'">
          <p class="text-2xl font-bold" :class="testResult.failed > 0 ? 'text-error' : 'text-muted'">
            {{ testResult.failed }}
          </p>
          <p class="text-xs text-muted">Failed</p>
        </div>
        <div class="text-center p-3 rounded-md bg-muted/20">
          <p class="text-2xl font-bold text-default">{{ testResult.coverage }}%</p>
          <p class="text-xs text-muted">Coverage</p>
        </div>
      </div>
    </div>

    <!-- Failures -->
    <div v-if="testResult && testResult.failures.length > 0" class="space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-error" />
        Failures ({{ testResult.failures.length }})
      </h4>
      <div class="space-y-2">
        <div
          v-for="failure in testResult.failures"
          :key="failure.testName"
          class="rounded-md border border-error/30 bg-error/5 p-3"
        >
          <div class="flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-x-circle" class="w-4 h-4 text-error" />
            <span class="text-sm font-medium text-default">{{ failure.testName }}</span>
          </div>
          <p class="text-xs text-muted mb-1">{{ failure.filePath }}:{{ failure.lineNumber }}</p>
          <p class="text-sm text-error">{{ failure.errorMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Repair Attempts -->
    <div v-if="testResult && testResult.repairAttempts && testResult.repairAttempts.length > 0" class="space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-wrench" class="w-4 h-4 text-warning" />
        Auto-Repair Attempts
      </h4>
      <div class="space-y-1.5">
        <div
          v-for="attempt in testResult.repairAttempts"
          :key="attempt.attemptNumber"
          class="flex items-center gap-2 px-3 py-2 rounded-md border border-default bg-muted/20 text-sm"
        >
          <UIcon
            :name="attempt.success ? 'i-lucide-check' : 'i-lucide-x'"
            class="w-4 h-4"
            :class="attempt.success ? 'text-success' : 'text-error'"
          />
          <span class="text-default">Attempt #{{ attempt.attemptNumber }}: {{ attempt.description }}</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!testResult" class="text-center py-8">
      <UIcon name="i-lucide-test-tube" class="w-8 h-8 text-muted mx-auto mb-2" />
      <p class="text-sm text-muted">No test results yet.</p>
    </div>
  </div>
</template>
