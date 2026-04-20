<script setup lang="ts">
import { ref } from "vue";
import { useChatStore } from "@renderer/stores/chat";
import type { FileNode } from "@renderer/types/chat";

const chatStore = useChatStore();

const expandedDirs = ref<Set<string>>(new Set(["root", "components", "auth", "utils", "styles"]));

function toggleDir(nodeId: string): void {
  if (expandedDirs.value.has(nodeId)) {
    expandedDirs.value.delete(nodeId);
  } else {
    expandedDirs.value.add(nodeId);
  }
}

function isExpanded(nodeId: string): boolean {
  return expandedDirs.value.has(nodeId);
}

function getChangeColor(changeType: string | undefined): string {
  switch (changeType) {
    case "added":
      return "text-success";
    case "modified":
      return "text-warning";
    case "deleted":
      return "text-error line-through";
    default:
      return "";
  }
}

function getChangeIcon(changeType: string | undefined): string {
  switch (changeType) {
    case "added":
      return "i-lucide-plus-circle";
    case "modified":
      return "i-lucide-pencil";
    case "deleted":
      return "i-lucide-minus-circle";
    default:
      return "";
  }
}

function handleFileClick(node: FileNode): void {
  if (node.type === "directory") {
    toggleDir(node.id);
    return;
  }
  // Check if this file has changes in current session
  const hasChanges = chatStore.changedFilePaths.includes(node.path);
  if (hasChanges) {
    chatStore.openDiffPanel(node.path);
  } else {
    chatStore.openDiffPanel(node.path);
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-2">
    <!-- Recursive File Tree -->
    <ul class="space-y-0.5">
      <template v-for="node in chatStore.fileTree" :key="node.id">
        <li>
          <!-- Directory -->
          <div
            v-if="node.type === 'directory'"
            class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
            @click="toggleDir(node.id)"
          >
            <UIcon
              :name="isExpanded(node.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="w-3.5 h-3.5 text-muted shrink-0"
            />
            <UIcon name="i-lucide-folder" class="w-4 h-4 text-warning shrink-0" />
            <span class="text-sm">{{ node.name }}</span>
          </div>

          <!-- File -->
          <div
            v-else
            class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
            @click="handleFileClick(node)"
          >
            <span class="w-3.5 shrink-0" />
            <UIcon name="i-lucide-file" class="w-4 h-4 text-muted shrink-0" />
            <span class="text-sm" :class="getChangeColor(node.changeType)">
              {{ node.name }}
            </span>
            <UIcon
              v-if="node.changeType"
              :name="getChangeIcon(node.changeType)"
              class="w-3 h-3 shrink-0 ml-auto"
              :class="getChangeColor(node.changeType)"
            />
          </div>

          <!-- Children -->
          <ul
            v-if="node.type === 'directory' && node.children && isExpanded(node.id)"
            class="ml-4 space-y-0.5"
          >
            <li v-for="child in node.children" :key="child.id">
              <!-- Directory Child -->
              <div
                v-if="child.type === 'directory'"
                class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                @click="toggleDir(child.id)"
              >
                <UIcon
                  :name="isExpanded(child.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="w-3.5 h-3.5 text-muted shrink-0"
                />
                <UIcon name="i-lucide-folder" class="w-4 h-4 text-warning shrink-0" />
                <span class="text-sm">{{ child.name }}</span>
              </div>

              <!-- File Child -->
              <div
                v-else
                class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                @click="handleFileClick(child)"
              >
                <span class="w-3.5 shrink-0" />
                <UIcon name="i-lucide-file" class="w-4 h-4 text-muted shrink-0" />
                <span class="text-sm" :class="getChangeColor(child.changeType)">
                  {{ child.name }}
                </span>
                <UIcon
                  v-if="child.changeType"
                  :name="getChangeIcon(child.changeType)"
                  class="w-3 h-3 shrink-0 ml-auto"
                  :class="getChangeColor(child.changeType)"
                />
              </div>

              <!-- Nested Children (2 levels deep max for mock) -->
              <ul
                v-if="child.type === 'directory' && child.children && isExpanded(child.id)"
                class="ml-4 space-y-0.5"
              >
                <li
                  v-for="grandchild in child.children"
                  :key="grandchild.id"
                  class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                  @click="handleFileClick(grandchild)"
                >
                  <span class="w-3.5 shrink-0" />
                  <UIcon name="i-lucide-file" class="w-4 h-4 text-muted shrink-0" />
                  <span class="text-sm" :class="getChangeColor(grandchild.changeType)">
                    {{ grandchild.name }}
                  </span>
                  <UIcon
                    v-if="grandchild.changeType"
                    :name="getChangeIcon(grandchild.changeType)"
                    class="w-3 h-3 shrink-0 ml-auto"
                    :class="getChangeColor(grandchild.changeType)"
                  />
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </template>
    </ul>
  </div>
</template>
