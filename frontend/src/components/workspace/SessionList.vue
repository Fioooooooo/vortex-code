<script setup lang="ts">
import { computed } from "vue";
import { useWorkspaceStore } from "@renderer/stores/workspace";
import type { Session } from "@renderer/types/workspace";

const workspaceStore = useWorkspaceStore();

const sessions = computed(() => workspaceStore.sessions);

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else if (days === 1) {
    return "Yesterday";
  } else {
    return `${days}d ago`;
  }
}

function handleNewSession(): void {
  workspaceStore.createSession();
}

function handleSelectSession(sessionId: string): void {
  workspaceStore.selectSession(sessionId);
}

function handleRename(session: Session): void {
  const newTitle = prompt("Rename session:", session.title);
  if (newTitle && newTitle.trim()) {
    workspaceStore.renameSession(session.id, newTitle.trim());
  }
}

function handleDelete(sessionId: string): void {
  if (confirm("Are you sure you want to delete this session?")) {
    workspaceStore.deleteSession(sessionId);
  }
}

function handleArchive(sessionId: string): void {
  workspaceStore.archiveSession(sessionId);
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- New Session Button -->
    <div class="p-3 border-b border-default">
      <UButton
        color="primary"
        variant="outline"
        class="w-full justify-center gap-2"
        @click="handleNewSession"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" />
        New Session
      </UButton>
    </div>

    <!-- Empty State -->
    <div
      v-if="sessions.length === 0"
      class="flex-1 flex items-center justify-center px-6 text-center"
    >
      <p class="text-sm text-muted">Start a new session to begin working with your agent.</p>
    </div>

    <!-- Session List -->
    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="group relative flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors border-b border-default/50 last:border-b-0"
        :class="
          workspaceStore.activeSessionId === session.id ? 'bg-primary/5' : 'hover:bg-muted/50'
        "
        @click="handleSelectSession(session.id)"
      >
        <!-- Status Dot -->
        <div class="mt-1.5 shrink-0">
          <span
            class="w-2 h-2 rounded-full block"
            :class="
              session.status === 'running'
                ? 'bg-success animate-pulse'
                : 'bg-neutral-300 dark:bg-neutral-600'
            "
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate text-highlighted">
            {{ session.title }}
          </div>
          <div class="text-xs text-muted mt-0.5 flex items-center gap-1">
            <span>{{ formatTime(session.updatedAt) }}</span>
            <span>·</span>
            <span>{{ session.turnCount }} turns</span>
          </div>
        </div>

        <!-- Actions (hover) -->
        <div class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <UDropdownMenu
            :items="[
              {
                label: 'Rename',
                icon: 'i-lucide-pencil',
                onSelect: () => handleRename(session),
              },
              {
                label: 'Archive',
                icon: 'i-lucide-archive',
                onSelect: () => handleArchive(session.id),
              },
              {
                label: 'Delete',
                icon: 'i-lucide-trash-2',
                color: 'error',
                onSelect: () => handleDelete(session.id),
              },
            ]"
          >
            <UButton variant="ghost" color="neutral" size="xs" class="text-muted" @click.stop>
              <UIcon name="i-lucide-more-vertical" class="w-4 h-4" />
            </UButton>
          </UDropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>
