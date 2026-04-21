<script setup lang="ts">
import { computed } from "vue";
import type { PipelineStageRun } from "@shared/types/pipeline";

const props = defineProps<{
  stage: PipelineStageRun;
}>();

const messages = computed(() => props.stage.output?.messages ?? []);
const fileChanges = computed(() => props.stage.output?.fileChanges ?? []);

const expandedFiles = ref<Set<string>>(new Set());

import { ref } from "vue";

function toggleFile(filePath: string): void {
  if (expandedFiles.value.has(filePath)) {
    expandedFiles.value.delete(filePath);
  } else {
    expandedFiles.value.add(filePath);
  }
}

const changeTypeIcon: Record<string, string> = {
  added: "i-lucide-plus",
  modified: "i-lucide-pencil",
  deleted: "i-lucide-minus",
};

const changeTypeColor: Record<string, string> = {
  added: "text-success",
  modified: "text-warning",
  deleted: "text-error",
};
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Execution Process -->
    <div v-if="messages.length > 0" class="space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-terminal" class="w-4 h-4" />
        Execution
      </h4>
      <div class="space-y-2">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="rounded-md border border-default bg-muted/20 p-3 text-sm"
        >
          <template v-if="msg.type === 'file-op'">
            <div class="flex items-center gap-2 text-muted text-xs mb-1">
              <UIcon name="i-lucide-file-code" class="w-3.5 h-3.5" />
              File Operations
            </div>
            <div class="space-y-1">
              <div
                v-for="op in msg.operations"
                :key="op.filePath"
                class="flex items-center gap-2 text-sm"
              >
                <UIcon
                  :name="changeTypeIcon[op.changeType] ?? 'i-lucide-file'"
                  class="w-3.5 h-3.5"
                  :class="changeTypeColor[op.changeType] ?? 'text-default'"
                />
                <span class="text-default">{{ op.filePath }}</span>
                <span class="text-xs text-muted">{{ op.summary }}</span>
              </div>
            </div>
          </template>
          <template v-else-if="msg.type === 'command'">
            <div class="flex items-center gap-2 text-muted text-xs mb-1">
              <UIcon name="i-lucide-terminal" class="w-3.5 h-3.5" />
              Command
            </div>
            <code class="block bg-default rounded px-2 py-1 text-xs text-default">{{
              msg.command
            }}</code>
            <p class="text-xs mt-1" :class="msg.success ? 'text-success' : 'text-error'">
              {{ msg.output }}
            </p>
          </template>
          <template v-else-if="msg.type === 'user' || msg.type === 'text'">
            <p class="text-default whitespace-pre-wrap">{{ msg.content }}</p>
          </template>
          <template v-else-if="msg.type === 'confirm'">
            <p class="text-xs text-muted">{{ msg.description }}</p>
          </template>
          <template v-else>
            <p class="text-xs text-muted">{{ msg.type }}</p>
          </template>
        </div>
      </div>
    </div>

    <!-- File Changes -->
    <div v-if="fileChanges.length > 0" class="space-y-2">
      <h4 class="text-sm font-semibold text-default flex items-center gap-2">
        <UIcon name="i-lucide-files" class="w-4 h-4" />
        File Changes ({{ fileChanges.length }})
      </h4>
      <div class="space-y-1">
        <div
          v-for="change in fileChanges"
          :key="change.filePath"
          class="rounded-md border border-default overflow-hidden"
        >
          <button
            class="w-full flex items-center gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
            @click="toggleFile(change.filePath)"
          >
            <UIcon
              :name="
                expandedFiles.has(change.filePath)
                  ? 'i-lucide-chevron-down'
                  : 'i-lucide-chevron-right'
              "
              class="w-3.5 h-3.5 text-muted"
            />
            <UIcon
              :name="changeTypeIcon[change.changeType] ?? 'i-lucide-file'"
              class="w-3.5 h-3.5"
              :class="changeTypeColor[change.changeType] ?? 'text-default'"
            />
            <span class="text-sm text-default">{{ change.filePath }}</span>
            <span class="text-xs text-muted ml-auto">{{ change.summary }}</span>
          </button>

          <!-- Inline Diff Preview -->
          <div
            v-if="expandedFiles.has(change.filePath)"
            class="bg-default px-3 py-2 text-xs font-mono space-y-0.5"
          >
            <div
              v-for="(line, idx) in change.diffLines"
              :key="idx"
              class="px-1 rounded"
              :class="{
                'bg-success/10 text-success': line.type === 'added',
                'bg-error/10 text-error': line.type === 'removed',
                'text-muted': line.type === 'context',
              }"
            >
              <span class="inline-block w-6 text-right mr-2 text-muted select-none">
                {{ line.type === "removed" ? line.oldLineNumber : line.newLineNumber }}
              </span>
              <span class="mr-1 select-none">{{
                line.type === "added" ? "+" : line.type === "removed" ? "-" : " "
              }}</span>
              <span>{{ line.content }}</span>
            </div>
            <div v-if="change.diffLines.length === 0" class="text-muted py-2">
              Diff content not available in mock data.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="messages.length === 0 && fileChanges.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-code" class="w-8 h-8 text-muted mx-auto mb-2" />
      <p class="text-sm text-muted">No code execution records yet.</p>
    </div>
  </div>
</template>
