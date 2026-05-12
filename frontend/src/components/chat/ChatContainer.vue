<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useChatStore } from "@renderer/stores/chat";
import { useSessionStore } from "@renderer/stores/session";
import type { AcpAvailableCommand } from "@shared/types/chat";
import ChatAgentSelect from "./ChatAgentSelect.vue";
import ContextUsageRing from "./ContextUsageRing.vue";
import UIMessageList from "@renderer/components/shared/UIMessageList.vue";

const store = useChatStore();
const sessionStore = useSessionStore();
const { chatStatus } = storeToRefs(store);
const { activeSession, draftAgentId } = storeToRefs(sessionStore);

type CommandTriggerSource = "button" | "slash" | null;

interface CommandMenuItem {
  id: string;
  label: string;
  description: string;
  command: AcpAvailableCommand;
}

const agent = computed<string | undefined>({
  get: () => activeSession.value?.agentId ?? draftAgentId.value ?? undefined,
  set: (agentId) => {
    if (!agentId) {
      return;
    }

    if (activeSession.value) {
      void sessionStore.setSessionAgent(agentId).catch((error: unknown) => {
        console.error("Failed to update session agent:", error);
      });
      return;
    }

    sessionStore.setDraftAgent(agentId);
  },
});

const isAgentLocked = computed(() => (activeSession.value?.messages.length ?? 0) > 0);
const availableCommands = computed(() => activeSession.value?.availableCommands ?? []);
const hasAvailableCommands = computed(() => availableCommands.value.length > 0);
const commandMenuGroups = computed(() => [
  {
    id: "available-commands",
    items: availableCommands.value.map<CommandMenuItem>((command) => ({
      id: command.name,
      label: `/${command.name}`,
      description: command.description,
      command,
    })),
  },
]);

const input = ref("");
const promptShellRef = ref<HTMLElement | null>(null);
const commandMenuOpen = ref(false);
const commandSearchTerm = ref("");
const commandTriggerSource = ref<CommandTriggerSource>(null);
const pendingSlashOpen = ref(false);
const temporaryPlaceholder = ref<string | undefined>(undefined);
const hintBaseline = ref<string | null>(null);

function getPromptTextarea(): HTMLTextAreaElement | null {
  return promptShellRef.value?.querySelector("textarea") ?? null;
}

function focusPromptTextarea(cursor?: number): void {
  const textarea = getPromptTextarea();
  if (!textarea) {
    return;
  }

  textarea.focus();
  if (typeof cursor === "number") {
    textarea.setSelectionRange(cursor, cursor);
  }
}

function clearTemporaryPlaceholder(): void {
  temporaryPlaceholder.value = undefined;
  hintBaseline.value = null;
}

function applyTemporaryPlaceholder(hint: string | undefined, baseline: string): void {
  if (typeof hint !== "string" || hint.trim() === "") {
    clearTemporaryPlaceholder();
    return;
  }

  temporaryPlaceholder.value = hint;
  hintBaseline.value = baseline;
}

function isCursorAtLineStart(textarea: HTMLTextAreaElement): boolean {
  const text = textarea.value;
  const cursor = textarea.selectionStart ?? 0;
  const prefix = text.slice(0, cursor);
  const linePrefix = prefix.includes("\n") ? prefix.slice(prefix.lastIndexOf("\n") + 1) : prefix;
  return /^[ \t]*$/.test(linePrefix);
}

function openCommandMenu(source: Exclude<CommandTriggerSource, null>): void {
  if (!hasAvailableCommands.value) {
    return;
  }

  commandTriggerSource.value = source;
  commandSearchTerm.value = "";
  commandMenuOpen.value = true;
}

function closeCommandMenu(): void {
  commandMenuOpen.value = false;
}

function handleSlashButtonClick(): void {
  openCommandMenu("button");
}

function insertCommand(command: AcpAvailableCommand): void {
  const textarea = getPromptTextarea();
  const currentValue = input.value;
  const selectionStart = textarea?.selectionStart ?? currentValue.length;
  const selectionEnd = textarea?.selectionEnd ?? selectionStart;
  const replacement = `/${command.name} `;

  let nextValue = currentValue;
  let nextCursor = selectionStart;

  if (commandTriggerSource.value === "slash") {
    const slashIndex = currentValue.slice(0, selectionStart).lastIndexOf("/");
    if (slashIndex >= 0) {
      nextValue =
        currentValue.slice(0, slashIndex) + replacement + currentValue.slice(selectionEnd);
      nextCursor = slashIndex + replacement.length;
    } else {
      nextValue =
        currentValue.slice(0, selectionStart) + replacement + currentValue.slice(selectionEnd);
      nextCursor = selectionStart + replacement.length;
    }
  } else {
    const prefix = currentValue.slice(0, selectionStart);
    const suffix = currentValue.slice(selectionEnd);
    const needsLeadingSpace = prefix.length > 0 && /\S$/.test(prefix);
    const insertion = `${needsLeadingSpace ? " " : ""}${replacement}`;
    nextValue = prefix + insertion + suffix;
    nextCursor = prefix.length + insertion.length;
  }

  input.value = nextValue;
  closeCommandMenu();
  commandTriggerSource.value = null;
  applyTemporaryPlaceholder(command.hint, nextValue);

  void nextTick(() => {
    focusPromptTextarea(nextCursor);
  });
}

function isCommandMenuItem(item: unknown): item is CommandMenuItem {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  return "command" in item;
}

function handleCommandSelect(item: unknown): void {
  if (!isCommandMenuItem(item)) {
    return;
  }

  insertCommand(item.command);
}

function handlePromptKeydown(event: KeyboardEvent): void {
  if (event.key !== "/" || !hasAvailableCommands.value) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement) || !isCursorAtLineStart(target)) {
    return;
  }

  pendingSlashOpen.value = true;
  commandTriggerSource.value = "slash";
  void nextTick(() => {
    if (!pendingSlashOpen.value) {
      return;
    }

    pendingSlashOpen.value = false;
    openCommandMenu("slash");
  });
}

function handlePromptFocusOut(event: FocusEvent): void {
  if (event.target instanceof HTMLTextAreaElement) {
    clearTemporaryPlaceholder();
  }
}

watch(input, (value) => {
  if (hintBaseline.value !== null && value !== hintBaseline.value) {
    clearTemporaryPlaceholder();
  }
});

watch(hasAvailableCommands, (nextHasCommands) => {
  if (!nextHasCommands) {
    closeCommandMenu();
  }
});

watch(commandMenuOpen, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    commandSearchTerm.value = "";
    void nextTick(() => {
      focusPromptTextarea();
    });
  }
});

async function handleSubmit(): Promise<void> {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await store.sendMessage(text);
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex-1 overflow-y-auto py-4 px-2 relative">
      <div class="max-w-240 mx-auto">
        <UIMessageList
          :messages="activeSession?.messages ?? []"
          :status="chatStatus"
          type="chat"
          :agent-id="activeSession?.agentId"
        />
      </div>
    </div>

    <div class="p-4">
      <div class="max-w-240 mx-auto">
        <div
          ref="promptShellRef"
          @keydown.capture="handlePromptKeydown"
          @focusout="handlePromptFocusOut"
        >
          <UChatPrompt
            v-model="input"
            :placeholder="temporaryPlaceholder"
            variant="subtle"
            class="sticky bottom-0 [view-transition-name:chat-prompt]"
            :ui="{ base: 'px-1.5' }"
            @submit="handleSubmit"
          >
            <template #footer>
              <div class="inline-flex items-center gap-2 min-w-0">
                <ContextUsageRing
                  v-if="activeSession"
                  :used="activeSession.tokenUsage.used"
                  :size="activeSession.tokenUsage.size"
                  :cost="activeSession.tokenUsage.cost"
                />
                <UPopover
                  v-model:open="commandMenuOpen"
                  :portal="false"
                  :content="{ align: 'start', side: 'top' }"
                  :ui="{
                    content: 'w-[min(32rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-0',
                  }"
                >
                  <template #default>
                    <UButton
                      v-if="hasAvailableCommands"
                      data-test="slash-button"
                      variant="ghost"
                      size="sm"
                      type="button"
                      @click="handleSlashButtonClick"
                    >
                      <UIcon name="i-lucide-slash-square" />
                    </UButton>
                  </template>

                  <template #content>
                    <UCommandPalette
                      v-if="commandMenuOpen"
                      v-model:search-term="commandSearchTerm"
                      data-test="slash-menu"
                      class="max-h-[min(24rem,calc(100vh-8rem))] overflow-hidden"
                      :groups="commandMenuGroups"
                      :autofocus="true"
                      placeholder="Search commands"
                      :ui="{
                        root: 'w-full max-w-full',
                        content: 'max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto',
                      }"
                      @update:model-value="handleCommandSelect"
                      @update:open="commandMenuOpen = $event"
                    />
                  </template>
                </UPopover>
                <ChatAgentSelect v-if="!isAgentLocked" v-model="agent" />
              </div>

              <UChatPromptSubmit
                :status="chatStatus"
                color="neutral"
                size="sm"
                @stop="store.cancelStream()"
              />
            </template>
          </UChatPrompt>
        </div>
      </div>
    </div>
  </div>
</template>
