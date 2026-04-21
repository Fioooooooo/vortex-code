import { ipcMain } from "electron";
import { ProjectChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";

export function registerProjectHandlers(): void {
  ipcMain.handle(ProjectChannels.list, () =>
    wrapHandler(async () => {
      // TODO: implement project listing
      return [];
    })
  );

  ipcMain.handle(ProjectChannels.getById, ({ id }: { id: string }) =>
    wrapHandler(async () => {
      // TODO: implement project retrieval
      void id;
      return null;
    })
  );

  ipcMain.handle(
    ProjectChannels.create,
    (input: { name: string; path: string; template: string; gitUrl?: string }) =>
      wrapHandler(async () => {
        // TODO: implement project creation
        void input;
        return null;
      })
  );

  ipcMain.handle(
    ProjectChannels.update,
    ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      wrapHandler(async () => {
        // TODO: implement project update
        void id;
        void patch;
        return null;
      })
  );

  ipcMain.handle(ProjectChannels.remove, ({ id }: { id: string }) =>
    wrapHandler(async () => {
      // TODO: implement project removal
      void id;
    })
  );

  ipcMain.handle(ProjectChannels.setActive, ({ id }: { id: string }) =>
    wrapHandler(async () => {
      // TODO: set active project
      void id;
      return null;
    })
  );
}
