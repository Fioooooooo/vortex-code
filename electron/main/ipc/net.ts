import { ipcMain, net } from "electron";
import { NetChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";

export function registerNetHandlers(): void {
  ipcMain.handle(NetChannels.fetch, (_event, url: string) =>
    wrapHandler(async () => {
      const res = await net.fetch(url);
      return res.json();
    })
  );

  ipcMain.handle(NetChannels.fetchImage, (_event, url: string) =>
    wrapHandler(async () => {
      const res = await net.fetch(url);
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") ?? "image/png";
      const base64 = Buffer.from(buffer).toString("base64");
      return `data:${contentType};base64,${base64}`;
    })
  );
}
