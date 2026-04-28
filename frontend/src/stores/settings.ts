import { ref } from "vue";
import { defineStore } from "pinia";
import type { PreferencesConfig } from "@shared/types/settings";

const defaultPreferences: PreferencesConfig = {
  theme: "system",
  language: "en",
  defaultAgentMode: "auto",
  notificationMethods: ["in-app"],
  autoSaveSession: true,
  tokenStatsPeriod: "monthly",
  budgetAlert: { value: 100000, unit: "tokens" },
};

export const useSettingsStore = defineStore("settings", () => {
  const preferences = ref<PreferencesConfig>({ ...defaultPreferences });

  function updatePreference<K extends keyof PreferencesConfig>(
    key: K,
    value: PreferencesConfig[K]
  ): void {
    preferences.value[key] = value;
  }

  async function clearAllHistory(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  return {
    preferences,
    updatePreference,
    clearAllHistory,
  };
});
