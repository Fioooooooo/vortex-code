import { ipcMain } from "electron";
import { IntegrationChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";

export function registerIntegrationHandlers(): void {
  ipcMain.handle(IntegrationChannels.listTools, () =>
    wrapHandler(async () => {
      return [];
    })
  );

  ipcMain.handle(IntegrationChannels.getConnection, ({ toolId }: { toolId: string }) =>
    wrapHandler(async () => {
      void toolId;
      return null;
    })
  );

  ipcMain.handle(
    IntegrationChannels.connect,
    (input: { toolId: string; credentials: Record<string, string> }) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  ipcMain.handle(IntegrationChannels.disconnect, ({ toolId }: { toolId: string }) =>
    wrapHandler(async () => {
      void toolId;
    })
  );

  ipcMain.handle(IntegrationChannels.listProjectConfigs, ({ projectId }: { projectId: string }) =>
    wrapHandler(async () => {
      void projectId;
      return [];
    })
  );

  ipcMain.handle(
    IntegrationChannels.setProjectConfig,
    (input: {
      projectId: string;
      toolId: string;
      enabled: boolean;
      overrides: Record<string, unknown>;
    }) =>
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
    (input: { name: string; mcpServerUrl: string; skillConfig: string }) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  ipcMain.handle(IntegrationChannels.removeCustom, ({ id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
    })
  );
}
