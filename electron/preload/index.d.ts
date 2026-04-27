import { ElectronAPI } from "@electron-toolkit/preload";
import type { chatApi } from "./api/chat";
import type { projectApi } from "./api/project";
import type { integrationApi } from "./api/integration";
import type { settingsApi } from "./api/settings";
import type { windowApi } from "./api/window";
import type { netApi } from "./api/net";

export interface AppApi {
  chat: typeof chatApi;
  project: typeof projectApi;
  integration: typeof integrationApi;
  settings: typeof settingsApi;
  window: typeof windowApi;
  net: typeof netApi;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: AppApi;
  }
}
