import { computed, ref } from "vue";
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
  const installedAgentIds = computed<string[]>(() => {
    const installed = new Set(
      Object.values(statuses.value)
        .filter((status) => status.installed)
        .map((status) => status.id)
    );

    if (installed.size === 0) {
      return [];
    }

    const orderedFromRegistry =
      registry.value?.agents.flatMap((agent) => (installed.has(agent.id) ? [agent.id] : [])) ?? [];

    for (const agentId of Object.keys(statuses.value)) {
      if (installed.has(agentId) && !orderedFromRegistry.includes(agentId)) {
        orderedFromRegistry.push(agentId);
      }
    }

    return orderedFromRegistry;
  });

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

  function isInstalledAgent(agentId: string | null | undefined): agentId is string {
    return agentId != null && statuses.value[agentId]?.installed === true;
  }

  function resolveInstalledAgent(preferredAgentId?: string | null): string | null {
    if (isInstalledAgent(preferredAgentId)) {
      return preferredAgentId;
    }

    return installedAgentIds.value[0] ?? null;
  }

  function getAgentLabel(agentId: string): string {
    return registry.value?.agents.find((agent) => agent.id === agentId)?.name ?? agentId;
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
    installedAgentIds,
    ensureAgentListeners,
    isInstalledAgent,
    resolveInstalledAgent,
    getAgentLabel,
    loadRegistry,
    loadIcons,
    refreshStatus,
    installAgent,
  };
});
