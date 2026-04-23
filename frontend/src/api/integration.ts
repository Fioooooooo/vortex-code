import type { IpcResponse } from "@shared/types/ipc";
import type {
  IntegrationTool,
  ToolConnection,
  ProjectToolConfig,
  CustomIntegration,
  YunxiaoOrganization,
} from "@shared/types/integration";

export const integrationApi = {
  listTools(): Promise<IpcResponse<IntegrationTool[]>> {
    return window.api.integration.listTools();
  },

  getConnections(): Promise<IpcResponse<ToolConnection[]>> {
    return window.api.integration.getConnections();
  },

  getConnection(toolId: string): Promise<IpcResponse<ToolConnection | null>> {
    return window.api.integration.getConnection(toolId);
  },

  connect(
    toolId: string,
    credentials: Record<string, string>
  ): Promise<IpcResponse<ToolConnection>> {
    return window.api.integration.connect(toolId, credentials);
  },

  disconnect(toolId: string): Promise<IpcResponse<void>> {
    return window.api.integration.disconnect(toolId);
  },

  listProjectConfigs(projectId: string): Promise<IpcResponse<ProjectToolConfig[]>> {
    return window.api.integration.listProjectConfigs(projectId);
  },

  setProjectConfig(
    projectId: string,
    toolId: string,
    enabled: boolean,
    overrides: Record<string, unknown>
  ): Promise<IpcResponse<ProjectToolConfig>> {
    return window.api.integration.setProjectConfig(projectId, toolId, enabled, overrides);
  },

  listCustom(): Promise<IpcResponse<CustomIntegration[]>> {
    return window.api.integration.listCustom();
  },

  createCustom(input: {
    name: string;
    mcpServerUrl: string;
    skillConfig: string;
  }): Promise<IpcResponse<CustomIntegration>> {
    return window.api.integration.createCustom(input);
  },

  removeCustom(id: string): Promise<IpcResponse<void>> {
    return window.api.integration.removeCustom(id);
  },

  yunxiaoSetToken(token: string): Promise<IpcResponse<YunxiaoOrganization[]>> {
    return window.api.integration.yunxiaoSetToken(token);
  },

  yunxiaoSetOrganization(organizationId: string): Promise<IpcResponse<void>> {
    return window.api.integration.yunxiaoSetOrganization(organizationId);
  },
};
