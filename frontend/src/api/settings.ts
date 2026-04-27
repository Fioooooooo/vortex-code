import type { IpcResponse } from "@shared/types/ipc";
import type {
  AgentRegistry,
  AgentStatus,
  InstallProgress,
  InstalledAgentRecord,
} from "@shared/types/agents";
import type { PreferencesConfig } from "@shared/types/settings";

export const agentsApi = {
  getRegistry(): Promise<IpcResponse<AgentRegistry>> {
    return window.api.settings.agents.getRegistry();
  },

  refreshRegistry(): Promise<IpcResponse<AgentRegistry>> {
    return window.api.settings.agents.refreshRegistry();
  },

  getIcons(): Promise<IpcResponse<Record<string, string>>> {
    return window.api.settings.agents.getIcons();
  },

  detectStatus(): Promise<IpcResponse<AgentStatus[]>> {
    return window.api.settings.agents.detectStatus();
  },

  install(agentId: string): Promise<IpcResponse<InstalledAgentRecord>> {
    return window.api.settings.agents.install(agentId);
  },

  onRegistryUpdated(listener: (registry: AgentRegistry) => void): () => void {
    return window.api.settings.agents.onRegistryUpdated(listener);
  },

  onInstallProgress(listener: (progress: InstallProgress) => void): () => void {
    return window.api.settings.agents.onInstallProgress(listener);
  },
};

export const settingsApi = {
  get(): Promise<IpcResponse<PreferencesConfig | null>> {
    return window.api.settings.get();
  },

  update(patch: Partial<PreferencesConfig>): Promise<IpcResponse<PreferencesConfig>> {
    return window.api.settings.update(patch);
  },

  agents: agentsApi,
};
