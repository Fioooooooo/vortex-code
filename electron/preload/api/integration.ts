import { ipcRenderer } from "electron";
import type { IpcResponse } from "@shared/types/ipc";
import { IntegrationChannels } from "@shared/types/channels";
import type {
  IntegrationTool,
  ToolConnection,
  ProjectToolConfig,
  CustomIntegration,
  YunxiaoOrganization,
} from "@shared/types/integration";

export const integrationApi = {
  listTools(): Promise<IpcResponse<IntegrationTool[]>> {
    return ipcRenderer.invoke(IntegrationChannels.listTools);
  },

  getConnections(): Promise<IpcResponse<ToolConnection[]>> {
    return ipcRenderer.invoke(IntegrationChannels.getConnections);
  },

  getConnection(toolId: string): Promise<IpcResponse<ToolConnection | null>> {
    return ipcRenderer.invoke(IntegrationChannels.getConnection, { toolId });
  },

  connect(
    toolId: string,
    credentials: Record<string, string>
  ): Promise<IpcResponse<ToolConnection>> {
    return ipcRenderer.invoke(IntegrationChannels.connect, { toolId, credentials });
  },

  disconnect(toolId: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(IntegrationChannels.disconnect, { toolId });
  },

  listProjectConfigs(projectId: string): Promise<IpcResponse<ProjectToolConfig[]>> {
    return ipcRenderer.invoke(IntegrationChannels.listProjectConfigs, { projectId });
  },

  setProjectConfig(
    projectId: string,
    toolId: string,
    enabled: boolean,
    overrides: Record<string, unknown>
  ): Promise<IpcResponse<ProjectToolConfig>> {
    return ipcRenderer.invoke(IntegrationChannels.setProjectConfig, {
      projectId,
      toolId,
      enabled,
      overrides,
    });
  },

  listCustom(): Promise<IpcResponse<CustomIntegration[]>> {
    return ipcRenderer.invoke(IntegrationChannels.listCustom);
  },

  createCustom(input: {
    name: string;
    mcpServerUrl: string;
    skillConfig: string;
  }): Promise<IpcResponse<CustomIntegration>> {
    return ipcRenderer.invoke(IntegrationChannels.createCustom, input);
  },

  removeCustom(id: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(IntegrationChannels.removeCustom, { id });
  },

  yunxiaoSetToken(token: string): Promise<IpcResponse<YunxiaoOrganization[]>> {
    return ipcRenderer.invoke(IntegrationChannels.yunxiaoSetToken, { token });
  },

  yunxiaoSetOrganization(organizationId: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(IntegrationChannels.yunxiaoSetOrganization, { organizationId });
  },
};
