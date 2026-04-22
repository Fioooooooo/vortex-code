import { ipcMain } from "electron";
import { SettingsChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";

export function registerSettingsHandlers(): void {
  ipcMain.handle(SettingsChannels.get, () =>
    wrapHandler(async () => {
      // TODO: read preferences from persistent storage
      return null;
    })
  );

  ipcMain.handle(SettingsChannels.update, (_event, patch: Record<string, unknown>) =>
    wrapHandler(async () => {
      // TODO: persist preferences
      void patch;
      return null;
    })
  );

  ipcMain.handle(SettingsChannels.listAgents, () =>
    wrapHandler(async () => {
      // TODO: detect installed CLI agents (claude-code, codex)
      return [];
    })
  );
}
