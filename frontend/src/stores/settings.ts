import { ref } from "vue";
import { defineStore } from "pinia";
import { agentsApi } from "@renderer/api/settings";
import type { AgentRegistry, AgentStatus, InstallProgress } from "@shared/types/agents";
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
  const agentRegistry = ref<AgentRegistry | null>(null);
  const agentIcons = ref<Record<string, string>>({});
  const agentStatuses = ref<Record<string, AgentStatus>>({});
  const installProgress = ref<Record<string, InstallProgress>>({});
  const registryLoading = ref(false);
  const registryError = ref<string | null>(null);

  let stopRegistryUpdatedListener: (() => void) | null = null;
  let stopInstallProgressListener: (() => void) | null = null;

  function mapStatuses(items: AgentStatus[]): Record<string, AgentStatus> {
    return items.reduce<Record<string, AgentStatus>>((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});
  }

  function ensureAgentListeners(): void {
    if (!stopRegistryUpdatedListener) {
      stopRegistryUpdatedListener = agentsApi.onRegistryUpdated((registry) => {
        agentRegistry.value = registry;
        registryError.value = null;
        void loadIcons();
        void refreshAgentStatus();
      });
    }

    if (!stopInstallProgressListener) {
      stopInstallProgressListener = agentsApi.onInstallProgress((progress) => {
        installProgress.value = {
          ...installProgress.value,
          [progress.agentId]: progress,
        };
      });
    }
  }

  function updatePreference<K extends keyof PreferencesConfig>(
    key: K,
    value: PreferencesConfig[K]
  ): void {
    preferences.value[key] = value;
  }

  async function clearAllHistory(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  async function loadRegistry(): Promise<void> {
    ensureAgentListeners();
    registryLoading.value = true;

    const response = await agentsApi.getRegistry();
    if (response.ok) {
      agentRegistry.value = response.data;
      registryError.value = null;
    } else if (!agentRegistry.value) {
      registryError.value = response.error.message;
    }

    registryLoading.value = false;
  }

  async function loadIcons(): Promise<void> {
    ensureAgentListeners();
    const response = await agentsApi.getIcons();
    if (!response.ok) {
      return;
    }

    agentIcons.value = {
      ...agentIcons.value,
      ...response.data,
    };
  }

  async function refreshAgentStatus(): Promise<void> {
    ensureAgentListeners();
    const response = await agentsApi.detectStatus();
    if (!response.ok) {
      return;
    }

    agentStatuses.value = mapStatuses(response.data);
  }

  async function installAgent(agentId: string): Promise<void> {
    ensureAgentListeners();

    const response = await agentsApi.install(agentId);
    if (!response.ok) {
      installProgress.value = {
        ...installProgress.value,
        [agentId]: {
          agentId,
          status: "error",
          message: response.error.message,
        },
      };
      return;
    }

    await refreshAgentStatus();
    installProgress.value = {
      ...installProgress.value,
      [agentId]: {
        agentId,
        status: "done",
      },
    };
  }

  return {
    preferences,
    agentRegistry,
    agentIcons,
    agentStatuses,
    installProgress,
    registryLoading,
    registryError,
    updatePreference,
    clearAllHistory,
    loadRegistry,
    loadIcons,
    refreshAgentStatus,
    installAgent,
  };
});
