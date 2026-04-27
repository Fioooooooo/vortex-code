import { ipcRenderer } from "electron";
import { NetChannels } from "@shared/types/channels";

export const netApi = {
  fetch: (url: string) => ipcRenderer.invoke(NetChannels.fetch, url),
  fetchImage: (url: string) => ipcRenderer.invoke(NetChannels.fetchImage, url),
};
