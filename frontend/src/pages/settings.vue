<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useColorMode } from "@vueuse/core";
import { useSettingsStore } from "@renderer/stores/settings";
import type {
  ThemeMode,
  AgentMode,
  NotificationMethod,
  TokenStatsPeriod,
  BudgetUnit,
} from "@renderer/types/settings";

const store = useSettingsStore();
const colorMode = useColorMode();

// Active tab
const activeTab = ref<"agents" | "preferences">("agents");

// Theme mode synced with colorMode
const themeMode = computed({
  get: () => store.preferences.theme,
  set: (val: ThemeMode) => {
    store.updatePreference("theme", val);
    colorMode.value = val === "system" ? "auto" : val;
  },
});

// Sync colorMode → store when changed externally (e.g. header toggle)
watch(
  () => colorMode.value,
  (val) => {
    const mapped: ThemeMode = val === "auto" ? "system" : (val as ThemeMode);
    if (store.preferences.theme !== mapped) {
      store.updatePreference("theme", mapped);
    }
  }
);

const themeOptions = [
  { label: "Light", value: "light" as ThemeMode },
  { label: "Dark", value: "dark" as ThemeMode },
  { label: "System", value: "system" as ThemeMode },
];

const languageOptions = [
  { label: "English", value: "en" },
  { label: "中文", value: "zh" },
];

const agentModeOptions = [
  { label: "Auto", value: "auto" as AgentMode },
  { label: "Manual", value: "manual" as AgentMode },
];

const notificationOptions: { label: string; value: NotificationMethod }[] = [
  { label: "系统通知", value: "system" },
  { label: "声音提示", value: "sound" },
  { label: "仅应用内标记", value: "in-app" },
];

const periodOptions: { label: string; value: TokenStatsPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const budgetUnitOptions: { label: string; value: BudgetUnit }[] = [
  { label: "tokens", value: "tokens" },
  { label: "USD", value: "usd" },
];

// Clear history modal
const showClearModal = ref(false);
const isClearing = ref(false);

async function confirmClearHistory(): Promise<void> {
  isClearing.value = true;
  await store.clearAllHistory();
  isClearing.value = false;
  showClearModal.value = false;
}

// Notification multi-select helpers
function isNotificationSelected(val: NotificationMethod): boolean {
  return store.preferences.notificationMethods.includes(val);
}

function toggleNotification(val: NotificationMethod): void {
  const current = store.preferences.notificationMethods;
  const updated = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
  store.updatePreference("notificationMethods", updated);
}
</script>

<template>
  <div class="flex flex-1 overflow-hidden bg-default">
    <!-- Left vertical tab nav -->
    <nav class="w-44 shrink-0 border-r border-default py-4 px-2 flex flex-col gap-1 hidden sm:flex">
      <UButton
        variant="ghost"
        :color="activeTab === 'agents' ? 'primary' : 'neutral'"
        class="justify-start"
        @click="activeTab = 'agents'"
      >
        <UIcon name="i-lucide-bot" class="w-4 h-4 mr-2" />
        Agents
      </UButton>
      <UButton
        variant="ghost"
        :color="activeTab === 'preferences' ? 'primary' : 'neutral'"
        class="justify-start"
        @click="activeTab = 'preferences'"
      >
        <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 mr-2" />
        Preferences
      </UButton>
    </nav>

    <!-- Mobile tab select (sm and below) -->
    <div
      class="sm:hidden w-full border-b border-default px-4 py-2 flex gap-2 shrink-0 absolute top-0 left-0 bg-default z-10"
    >
      <UButton
        size="sm"
        :variant="activeTab === 'agents' ? 'solid' : 'ghost'"
        :color="activeTab === 'agents' ? 'primary' : 'neutral'"
        @click="activeTab = 'agents'"
        >Agents</UButton
      >
      <UButton
        size="sm"
        :variant="activeTab === 'preferences' ? 'solid' : 'ghost'"
        :color="activeTab === 'preferences' ? 'primary' : 'neutral'"
        @click="activeTab = 'preferences'"
        >Preferences</UButton
      >
    </div>

    <!-- Right content area -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-2xl mx-auto px-6 py-8 sm:pt-8 pt-16">
        <!-- ===== AGENTS TAB ===== -->
        <template v-if="activeTab === 'agents'">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Agents</h2>
              <p class="text-sm text-muted mt-0.5">
                Supported CLI agents and their local installation status.
              </p>
            </div>
            <UButton
              variant="outline"
              color="neutral"
              size="sm"
              :loading="store.isRefreshing"
              @click="store.refreshAgentStatus()"
            >
              <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-1.5" />
              Refresh
            </UButton>
          </div>

          <div class="flex flex-col gap-3">
            <UCard v-for="agent in store.agentStatus" :key="agent.id" class="p-0">
              <div class="flex items-center justify-between p-4">
                <!-- Left: icon + name + description -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"
                  >
                    <UIcon name="i-lucide-terminal" class="w-5 h-5 text-muted" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-highlighted">{{ agent.name }}</p>
                    <p class="text-xs text-muted">{{ agent.description }}</p>
                  </div>
                </div>

                <!-- Right: status -->
                <div class="flex flex-col items-end gap-1 shrink-0 ml-4">
                  <template v-if="agent.installed">
                    <UBadge color="success" variant="subtle" size="sm">
                      <UIcon name="i-lucide-check-circle" class="w-3 h-3 mr-1" />
                      Installed
                    </UBadge>
                    <span class="text-xs text-muted">v{{ agent.version }}</span>
                  </template>
                  <template v-else>
                    <UBadge color="neutral" variant="subtle" size="sm">
                      <UIcon name="i-lucide-circle-dashed" class="w-3 h-3 mr-1" />
                      Not Installed
                    </UBadge>
                    <a
                      :href="agent.docsUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-primary hover:underline"
                      >Install guide ↗</a
                    >
                  </template>
                </div>
              </div>
            </UCard>
          </div>
        </template>

        <!-- ===== PREFERENCES TAB ===== -->
        <template v-else>
          <h2 class="text-lg font-semibold text-highlighted mb-6">Preferences</h2>

          <!-- Appearance group -->
          <section class="mb-8">
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Appearance
            </h3>
            <UCard>
              <div class="divide-y divide-default">
                <!-- Theme mode -->
                <div class="flex items-center justify-between py-4 px-4">
                  <div>
                    <p class="text-sm font-medium text-highlighted">Theme</p>
                    <p class="text-xs text-muted">Choose light, dark, or follow system setting.</p>
                  </div>
                  <div class="flex gap-1 bg-muted/40 rounded-lg p-1">
                    <UButton
                      v-for="opt in themeOptions"
                      :key="opt.value"
                      size="xs"
                      :variant="themeMode === opt.value ? 'solid' : 'ghost'"
                      :color="themeMode === opt.value ? 'primary' : 'neutral'"
                      @click="themeMode = opt.value"
                      >{{ opt.label }}</UButton
                    >
                  </div>
                </div>

                <!-- Language -->
                <div class="flex items-center justify-between py-4 px-4">
                  <div>
                    <p class="text-sm font-medium text-highlighted">Language</p>
                    <p class="text-xs text-muted">Interface display language.</p>
                  </div>
                  <USelect
                    :model-value="store.preferences.language"
                    :items="languageOptions"
                    value-key="value"
                    label-key="label"
                    size="sm"
                    class="w-32"
                    @update:model-value="store.updatePreference('language', $event)"
                  />
                </div>
              </div>
            </UCard>
          </section>

          <!-- Behavior group -->
          <section class="mb-8">
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Behavior</h3>
            <UCard>
              <div class="divide-y divide-default">
                <!-- Default agent mode -->
                <div class="flex items-center justify-between py-4 px-4">
                  <div>
                    <p class="text-sm font-medium text-highlighted">Default Agent Mode</p>
                    <p class="text-xs text-muted">
                      Default mode for new sessions. Can be overridden per session.
                    </p>
                  </div>
                  <div class="flex gap-1 bg-muted/40 rounded-lg p-1">
                    <UButton
                      v-for="opt in agentModeOptions"
                      :key="opt.value"
                      size="xs"
                      :variant="
                        store.preferences.defaultAgentMode === opt.value ? 'solid' : 'ghost'
                      "
                      :color="
                        store.preferences.defaultAgentMode === opt.value ? 'primary' : 'neutral'
                      "
                      @click="store.updatePreference('defaultAgentMode', opt.value)"
                      >{{ opt.label }}</UButton
                    >
                  </div>
                </div>

                <!-- Notifications -->
                <div class="py-4 px-4">
                  <p class="text-sm font-medium text-highlighted mb-1">Notifications</p>
                  <p class="text-xs text-muted mb-3">
                    How to notify when pipeline completes, fails, or agent needs confirmation.
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="opt in notificationOptions"
                      :key="opt.value"
                      size="xs"
                      :variant="isNotificationSelected(opt.value) ? 'solid' : 'outline'"
                      :color="isNotificationSelected(opt.value) ? 'primary' : 'neutral'"
                      @click="toggleNotification(opt.value)"
                      >{{ opt.label }}</UButton
                    >
                  </div>
                </div>

                <!-- Auto save session -->
                <div class="flex items-center justify-between py-4 px-4">
                  <div>
                    <p class="text-sm font-medium text-highlighted">Auto-save Sessions</p>
                    <p class="text-xs text-muted">
                      When off, sessions are discarded on close and won't appear in history.
                    </p>
                  </div>
                  <UToggle
                    :model-value="store.preferences.autoSaveSession"
                    color="primary"
                    @update:model-value="store.updatePreference('autoSaveSession', $event)"
                  />
                </div>
              </div>
            </UCard>
          </section>

          <!-- Data group -->
          <section class="mb-8">
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Data</h3>
            <UCard>
              <div class="divide-y divide-default">
                <!-- Token stats period -->
                <div class="flex items-center justify-between py-4 px-4">
                  <div>
                    <p class="text-sm font-medium text-highlighted">Token Stats Period</p>
                    <p class="text-xs text-muted">Reset interval for usage statistics.</p>
                  </div>
                  <div class="flex gap-1 bg-muted/40 rounded-lg p-1">
                    <UButton
                      v-for="opt in periodOptions"
                      :key="opt.value"
                      size="xs"
                      :variant="
                        store.preferences.tokenStatsPeriod === opt.value ? 'solid' : 'ghost'
                      "
                      :color="
                        store.preferences.tokenStatsPeriod === opt.value ? 'primary' : 'neutral'
                      "
                      @click="store.updatePreference('tokenStatsPeriod', opt.value)"
                      >{{ opt.label }}</UButton
                    >
                  </div>
                </div>

                <!-- Budget alert -->
                <div class="flex items-center justify-between py-4 px-4">
                  <div>
                    <p class="text-sm font-medium text-highlighted">Budget Alert</p>
                    <p class="text-xs text-muted">
                      Show a warning when usage exceeds this threshold.
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <UInput
                      :model-value="store.preferences.budgetAlert.value"
                      type="number"
                      size="sm"
                      class="w-28"
                      @update:model-value="
                        store.updatePreference('budgetAlert', {
                          ...store.preferences.budgetAlert,
                          value: Number($event),
                        })
                      "
                    />
                    <USelect
                      :model-value="store.preferences.budgetAlert.unit"
                      :items="budgetUnitOptions"
                      value-key="value"
                      label-key="label"
                      size="sm"
                      class="w-24"
                      @update:model-value="
                        store.updatePreference('budgetAlert', {
                          ...store.preferences.budgetAlert,
                          unit: $event,
                        })
                      "
                    />
                  </div>
                </div>

                <!-- Clear history -->
                <div class="flex items-center justify-between py-4 px-4">
                  <div>
                    <p class="text-sm font-medium text-highlighted">Clear All History</p>
                    <p class="text-xs text-muted">
                      Permanently delete all session history and usage data.
                    </p>
                  </div>
                  <UButton variant="outline" color="error" size="sm" @click="showClearModal = true">
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4 mr-1.5" />
                    Clear History
                  </UButton>
                </div>
              </div>
            </UCard>
          </section>
        </template>
      </div>
    </div>
  </div>

  <!-- Clear history confirmation modal -->
  <UModal v-model:open="showClearModal">
    <template #content>
      <div class="p-6 space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-error" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-highlighted">Clear All History?</h3>
            <p class="text-sm text-muted mt-1">
              This will permanently delete all session history, token usage statistics, and related
              data. This action cannot be undone.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" @click="showClearModal = false">Cancel</UButton>
          <UButton color="error" :loading="isClearing" @click="confirmClearHistory">
            Clear All History
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
