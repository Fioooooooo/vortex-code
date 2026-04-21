import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { chatApi } from "./api/chat";
import { projectApi } from "./api/project";
import { pipelineApi } from "./api/pipeline";
import { integrationApi } from "./api/integration";
import { settingsApi } from "./api/settings";
import { windowApi } from "./api/window";

const api = {
  chat: chatApi,
  project: projectApi,
  pipeline: pipelineApi,
  integration: integrationApi,
  settings: settingsApi,
  window: windowApi,
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
