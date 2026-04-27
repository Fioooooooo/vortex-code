import { ipcRenderer } from "electron";
import type { IpcResponse } from "@shared/types/ipc";
import { AgentsChannels, SettingsChannels } from "@shared/types/channels";
import type {
  AgentRegistry,
  AgentStatus,
  InstallProgress,
  InstalledAgentRecord,
} from "@shared/types/agents";
import type { PreferencesConfig } from "@shared/types/settings";

function subscribeToChannel<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, payload: T): void => {
    listener(payload);
  };

  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.off(channel, handler);
  };
}

export const settingsApi = {
  get(): Promise<IpcResponse<PreferencesConfig | null>> {
    return ipcRenderer.invoke(SettingsChannels.get);
  },

  update(patch: Partial<PreferencesConfig>): Promise<IpcResponse<PreferencesConfig>> {
    return ipcRenderer.invoke(SettingsChannels.update, patch);
  },

  agents: {
    getRegistry(): Promise<IpcResponse<AgentRegistry>> {
      return ipcRenderer.invoke(AgentsChannels.getRegistry);
    },

    refreshRegistry(): Promise<IpcResponse<AgentRegistry>> {
      return ipcRenderer.invoke(AgentsChannels.refreshRegistry);
    },

    getIcons(): Promise<IpcResponse<Record<string, string>>> {
      return ipcRenderer.invoke(AgentsChannels.getIcons);
    },

    detectStatus(): Promise<IpcResponse<AgentStatus[]>> {
      return ipcRenderer.invoke(AgentsChannels.detectStatus);
    },

    install(agentId: string): Promise<IpcResponse<InstalledAgentRecord>> {
      return ipcRenderer.invoke(AgentsChannels.install, agentId);
    },

    onRegistryUpdated(listener: (registry: AgentRegistry) => void): () => void {
      return subscribeToChannel(AgentsChannels.registryUpdated, listener);
    },

    onInstallProgress(listener: (progress: InstallProgress) => void): () => void {
      return subscribeToChannel(AgentsChannels.installProgress, listener);
    },
  },
};
