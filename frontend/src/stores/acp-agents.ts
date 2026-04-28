import { ref } from "vue";
import { defineStore } from "pinia";
import { acpAgentsApi } from "@renderer/api/acp-agents";
import type { AcpAgentStatus, AcpInstallProgress, AcpRegistry } from "@shared/types/acp-agent";

export const useAcpAgentsStore = defineStore("acp-agents", () => {
  const registry = ref<AcpRegistry | null>(null);
  const icons = ref<Record<string, string>>({});
  const statuses = ref<Record<string, AcpAgentStatus>>({});
  const installProgress = ref<Record<string, AcpInstallProgress>>({});
  const registryLoading = ref(false);
  const registryError = ref<string | null>(null);

  let stopRegistryUpdatedListener: (() => void) | null = null;
  let stopInstallProgressListener: (() => void) | null = null;

  function mapStatuses(items: AcpAgentStatus[]): Record<string, AcpAgentStatus> {
    return items.reduce<Record<string, AcpAgentStatus>>((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});
  }

  function ensureAgentListeners(): void {
    if (!stopRegistryUpdatedListener) {
      stopRegistryUpdatedListener = acpAgentsApi.onRegistryUpdated((nextRegistry) => {
        registry.value = nextRegistry;
        registryError.value = null;
        void loadIcons();
        void refreshStatus();
      });
    }

    if (!stopInstallProgressListener) {
      stopInstallProgressListener = acpAgentsApi.onInstallProgress((progress) => {
        installProgress.value = {
          ...installProgress.value,
          [progress.agentId]: progress,
        };
      });
    }
  }

  async function loadRegistry(): Promise<void> {
    ensureAgentListeners();
    registryLoading.value = true;

    const response = await acpAgentsApi.getRegistry();
    if (response.ok) {
      registry.value = response.data;
      registryError.value = null;
    } else if (!registry.value) {
      registryError.value = response.error.message;
    }

    registryLoading.value = false;
  }

  async function loadIcons(): Promise<void> {
    ensureAgentListeners();
    const response = await acpAgentsApi.getIcons();
    if (!response.ok) {
      return;
    }

    icons.value = {
      ...icons.value,
      ...response.data,
    };
  }

  async function refreshStatus(): Promise<void> {
    ensureAgentListeners();
    const response = await acpAgentsApi.detectStatus();
    if (!response.ok) {
      return;
    }

    statuses.value = mapStatuses(response.data);
  }

  async function installAgent(agentId: string): Promise<void> {
    ensureAgentListeners();

    const response = await acpAgentsApi.install(agentId);
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

    await refreshStatus();
    installProgress.value = {
      ...installProgress.value,
      [agentId]: {
        agentId,
        status: "done",
      },
    };
  }

  return {
    registry,
    icons,
    statuses,
    installProgress,
    registryLoading,
    registryError,
    ensureAgentListeners,
    loadRegistry,
    loadIcons,
    refreshStatus,
    installAgent,
  };
});
