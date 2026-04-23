import { ipcMain } from "electron";
import { IntegrationChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";
import {
  setYunxiaoToken,
  setYunxiaoOrganization,
  disconnectYunxiao,
} from "@main/services/integrations/yunxiao";
import {
  getConnections,
  getConnection,
  removeConnection,
} from "@main/services/integrations/connections";

export function registerIntegrationHandlers(): void {
  ipcMain.handle(IntegrationChannels.listTools, () =>
    wrapHandler(async () => {
      return [];
    })
  );

  ipcMain.handle(IntegrationChannels.getConnections, () => wrapHandler(() => getConnections()));

  ipcMain.handle(IntegrationChannels.getConnection, (_event, { toolId }: { toolId: string }) =>
    wrapHandler(() => getConnection(toolId))
  );

  ipcMain.handle(
    IntegrationChannels.connect,
    (_event, input: { toolId: string; credentials: Record<string, string> }) =>
      wrapHandler(async () => {
        if (input.toolId.startsWith("yunxiao-")) {
          return setYunxiaoToken(input.credentials["x-yunxiao-token"] ?? "");
        }
        return null;
      })
  );

  ipcMain.handle(IntegrationChannels.disconnect, (_event, { toolId }: { toolId: string }) =>
    wrapHandler(() => {
      if (toolId.startsWith("yunxiao-")) {
        disconnectYunxiao();
      } else {
        removeConnection(toolId);
      }
    })
  );

  ipcMain.handle(
    IntegrationChannels.listProjectConfigs,
    (_event, { projectId }: { projectId: string }) =>
      wrapHandler(async () => {
        void projectId;
        return [];
      })
  );

  ipcMain.handle(
    IntegrationChannels.setProjectConfig,
    (
      _event,
      input: {
        projectId: string;
        toolId: string;
        enabled: boolean;
        overrides: Record<string, unknown>;
      }
    ) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  ipcMain.handle(IntegrationChannels.listCustom, () =>
    wrapHandler(async () => {
      return [];
    })
  );

  ipcMain.handle(
    IntegrationChannels.createCustom,
    (_event, input: { name: string; mcpServerUrl: string; skillConfig: string }) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  ipcMain.handle(IntegrationChannels.removeCustom, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
    })
  );

  ipcMain.handle(IntegrationChannels.yunxiaoSetToken, (_event, { token }: { token: string }) =>
    wrapHandler(() => setYunxiaoToken(token))
  );

  ipcMain.handle(
    IntegrationChannels.yunxiaoSetOrganization,
    (_event, { organizationId }: { organizationId: string }) =>
      wrapHandler(() => setYunxiaoOrganization(organizationId))
  );
}
