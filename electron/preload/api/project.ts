import { ipcRenderer } from "electron";
import type { IpcResponse } from "@shared/types/ipc";
import { ProjectChannels } from "@shared/types/channels";
import type { ProjectInfo, CreateProjectForm } from "@shared/types/project";

export const projectApi = {
  list(): Promise<IpcResponse<ProjectInfo[]>> {
    return ipcRenderer.invoke(ProjectChannels.list);
  },

  getById(id: string): Promise<IpcResponse<ProjectInfo | null>> {
    return ipcRenderer.invoke(ProjectChannels.getById, { id });
  },

  getDefaultPath(): Promise<IpcResponse<string>> {
    return ipcRenderer.invoke(ProjectChannels.getDefaultPath);
  },

  create(input: CreateProjectForm): Promise<IpcResponse<ProjectInfo>> {
    return ipcRenderer.invoke(ProjectChannels.create, input);
  },

  update(id: string, patch: Partial<ProjectInfo>): Promise<IpcResponse<ProjectInfo>> {
    return ipcRenderer.invoke(ProjectChannels.update, { id, patch });
  },

  remove(id: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(ProjectChannels.remove, { id });
  },

  openFolder(): Promise<IpcResponse<ProjectInfo | null>> {
    return ipcRenderer.invoke(ProjectChannels.openFolder);
  },
};
