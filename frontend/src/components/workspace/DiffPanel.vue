<script setup lang="ts">
import { computed } from "vue";
import { useWorkspaceStore } from "@renderer/stores/workspace";

const workspaceStore = useWorkspaceStore();

const isOpen = computed(() => workspaceStore.diffPanelOpen);
const filePath = computed(() => workspaceStore.diffPanelFilePath);
const viewMode = computed(() => workspaceStore.diffViewMode);
const currentChange = computed(() => workspaceStore.currentFileChange);
const changedPaths = computed(() => workspaceStore.changedFilePaths);

function handleClose(): void {
  workspaceStore.closeDiffPanel();
}

function handleToggleViewMode(): void {
  workspaceStore.setDiffViewMode(viewMode.value === "side-by-side" ? "inline" : "side-by-side");
}

function handleSelectFile(path: string): void {
  workspaceStore.openDiffPanel(path);
}

function getLineClass(type: string): string {
  switch (type) {
    case "added":
      return "bg-success/10 text-success border-l-2 border-success";
    case "removed":
      return "bg-error/10 text-error border-l-2 border-error line-through";
    case "context":
      return "text-muted";
    default:
      return "text-muted";
  }
}
</script>

<template>
  <div
    class="relative shrink-0 transition-all duration-300 ease-in-out h-full"
    :class="isOpen ? 'w-[400px]' : 'w-0'"
  >
    <!-- Collapsed Handle -->
    <div
      v-if="!isOpen"
      class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-4 h-16 flex items-center justify-center cursor-pointer hover:bg-muted/50 rounded-l-md border border-default border-r-0 transition-colors z-10"
      @click="workspaceStore.toggleDiffPanel()"
    >
      <UIcon name="i-lucide-chevron-left" class="w-3 h-3 text-muted" />
    </div>

    <!-- Panel Content -->
    <div v-if="isOpen" class="w-full h-full flex flex-col border-l border-default bg-default">
      <!-- Header -->
      <div
        class="flex items-center justify-between gap-2 px-3 py-2 border-b border-default min-h-10"
      >
        <!-- File Selector -->
        <UDropdownMenu
          v-if="changedPaths.length > 1"
          :items="
            changedPaths.map((path) => ({
              label: path,
              onSelect: () => handleSelectFile(path),
            }))
          "
        >
          <UButton variant="ghost" color="neutral" size="xs" class="gap-1 max-w-[200px]">
            <code class="text-xs font-mono truncate">{{ filePath }}</code>
            <UIcon name="i-lucide-chevron-down" class="w-3 h-3 shrink-0" />
          </UButton>
        </UDropdownMenu>
        <code v-else class="text-xs font-mono truncate flex-1">{{ filePath }}</code>

        <!-- View Mode Toggle -->
        <div>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            class="shrink-0"
            @click="handleToggleViewMode"
          >
            <UIcon
              :name="viewMode === 'side-by-side' ? 'i-lucide-columns-2' : 'i-lucide-align-justify'"
              class="w-3.5 h-3.5"
            />
          </UButton>

          <!-- Close -->
          <UButton variant="ghost" color="neutral" size="xs" class="shrink-0" @click="handleClose">
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </UButton>
        </div>
      </div>

      <!-- Diff Content -->
      <div class="flex-1 overflow-auto">
        <div v-if="!currentChange" class="p-4 text-sm text-muted text-center">
          No changes available
        </div>

        <!-- Side-by-side -->
        <div v-else-if="viewMode === 'side-by-side'" class="min-w-full">
          <div class="flex">
            <!-- Old -->
            <div class="flex-1 border-r border-default">
              <div
                class="sticky top-0 bg-muted/50 px-3 py-1 text-xs font-medium text-muted border-b border-default"
              >
                Before
              </div>
              <div
                v-for="(line, idx) in currentChange.diffLines"
                :key="`old-${idx}`"
                class="px-3 py-0.5 text-xs font-mono whitespace-pre"
                :class="
                  line.type === 'removed'
                    ? 'bg-error/10 text-error'
                    : line.type === 'added'
                      ? 'opacity-30'
                      : 'text-muted'
                "
              >
                <span class="inline-block w-8 text-right pr-2 text-neutral-400 select-none">
                  {{ line.oldLineNumber ?? " " }}
                </span>
                {{ line.type === "added" ? "" : line.content }}
              </div>
            </div>
            <!-- New -->
            <div class="flex-1">
              <div
                class="sticky top-0 bg-muted/50 px-3 py-1 text-xs font-medium text-muted border-b border-default"
              >
                After
              </div>
              <div
                v-for="(line, idx) in currentChange.diffLines"
                :key="`new-${idx}`"
                class="px-3 py-0.5 text-xs font-mono whitespace-pre"
                :class="
                  line.type === 'added'
                    ? 'bg-success/10 text-success'
                    : line.type === 'removed'
                      ? 'opacity-30'
                      : 'text-muted'
                "
              >
                <span class="inline-block w-8 text-right pr-2 text-neutral-400 select-none">
                  {{ line.newLineNumber ?? " " }}
                </span>
                {{ line.type === "removed" ? "" : line.content }}
              </div>
            </div>
          </div>
        </div>

        <!-- Inline -->
        <div v-else class="min-w-full">
          <div
            v-for="(line, idx) in currentChange.diffLines"
            :key="`inline-${idx}`"
            class="px-3 py-0.5 text-xs font-mono whitespace-pre flex items-center gap-2"
            :class="getLineClass(line.type)"
          >
            <span class="inline-block w-6 text-right text-neutral-400 select-none shrink-0">
              {{ line.type === "added" ? "+" : line.type === "removed" ? "-" : " " }}
            </span>
            <span>{{ line.content }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
