import type { IpcResponse } from "@shared/types/ipc";
import type { PreferencesConfig, AgentInfo } from "@shared/types/settings";

export const settingsApi = {
  get(): Promise<IpcResponse<PreferencesConfig | null>> {
    return window.api.settings.get();
  },

  update(patch: Partial<PreferencesConfig>): Promise<IpcResponse<PreferencesConfig>> {
    return window.api.settings.update(patch);
  },

  listAgents(): Promise<IpcResponse<AgentInfo[]>> {
    return window.api.settings.listAgents();
  },
};
