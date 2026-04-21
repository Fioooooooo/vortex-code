import { ipcMain, BrowserWindow } from "electron";
import { WindowChannels } from "@shared/types/channels";

export function registerWindowHandlers(): void {
  ipcMain.handle(WindowChannels.minimize, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle(WindowChannels.maximize, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });

  ipcMain.handle(WindowChannels.close, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle(WindowChannels.toggleDevTools, (event) => {
    event.sender.toggleDevTools();
  });

  ipcMain.handle(WindowChannels.isMaximized, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
  });
}
