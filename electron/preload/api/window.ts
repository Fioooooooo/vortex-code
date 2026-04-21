import { ipcRenderer } from "electron";
import { WindowChannels } from "@shared/types/channels";

export const windowApi = {
  minimize(): Promise<void> {
    return ipcRenderer.invoke(WindowChannels.minimize);
  },

  maximize(): Promise<void> {
    return ipcRenderer.invoke(WindowChannels.maximize);
  },

  close(): Promise<void> {
    return ipcRenderer.invoke(WindowChannels.close);
  },

  toggleDevTools(): Promise<void> {
    return ipcRenderer.invoke(WindowChannels.toggleDevTools);
  },

  isMaximized(): Promise<boolean> {
    return ipcRenderer.invoke(WindowChannels.isMaximized);
  },
};
