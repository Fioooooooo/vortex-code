<script setup lang="ts">
import { ref } from "vue";
import { useChatStore } from "@renderer/stores/chat";
import type { Attachment } from "@renderer/types/workspace";

const chatStore = useChatStore();

const inputText = ref("");
const attachments = ref<Attachment[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function handleSend(): void {
  const text = inputText.value.trim();
  if (!text) return;

  chatStore.sendMessage(text);
  inputText.value = "";
  attachments.value = [];
}

function handleAttachClick(): void {
  fileInput.value?.click();
}

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files) return;

  for (const file of Array.from(files)) {
    attachments.value.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: file.type.startsWith("image/") ? "image" : "file",
      name: file.name,
    });
  }

  target.value = "";
}

function removeAttachment(id: string): void {
  attachments.value = attachments.value.filter((a) => a.id !== id);
}

function toggleMode(): void {
  chatStore.setMode(chatStore.mode === "auto" ? "manual" : "auto");
}
</script>

<template>
  <div class="border-t border-default bg-default px-4 py-3 space-y-2">
    <!-- Function Bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-bot" class="w-3.5 h-3.5 text-muted" />
        <span class="text-xs text-muted">{{ chatStore.currentAgent.name }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">Auto</span>
        <USwitch
          :model-value="chatStore.mode === 'auto'"
          size="xs"
          @update:model-value="toggleMode"
        />
      </div>
    </div>

    <!-- Attachments Preview -->
    <div v-if="attachments.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="att in attachments"
        :key="att.id"
        class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs"
      >
        <UIcon
          :name="att.type === 'image' ? 'i-lucide-image' : 'i-lucide-paperclip'"
          class="w-3.5 h-3.5 text-muted"
        />
        <span class="text-muted truncate max-w-[100px]">{{ att.name }}</span>
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          class="p-0 h-4 w-4 min-w-0"
          @click="removeAttachment(att.id)"
        >
          <UIcon name="i-lucide-x" class="w-3 h-3" />
        </UButton>
      </div>
    </div>

    <!-- Input Row -->
    <div class="flex items-end gap-2">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        class="shrink-0 text-muted"
        @click="handleAttachClick"
      >
        <UIcon name="i-lucide-paperclip" class="w-4 h-4" />
      </UButton>

      <textarea
        v-model="inputText"
        rows="1"
        placeholder="Type a message... (Shift+Enter for newline)"
        class="flex-1 min-h-[36px] max-h-[160px] px-3 py-2 text-sm bg-muted rounded-lg resize-none outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 text-highlighted placeholder:text-muted"
        @keydown="handleKeydown"
        @input="
          ($event.target as HTMLTextAreaElement).style.height = 'auto';
          ($event.target as HTMLTextAreaElement).style.height =
            ($event.target as HTMLTextAreaElement).scrollHeight + 'px';
        "
      />

      <UButton
        color="primary"
        size="sm"
        class="shrink-0"
        :disabled="!inputText.trim()"
        @click="handleSend"
      >
        <UIcon name="i-lucide-send" class="w-4 h-4" />
      </UButton>
    </div>

    <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileChange" />
  </div>
</template>
