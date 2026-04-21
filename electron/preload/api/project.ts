import { ipcRenderer } from "electron";
import type { IpcResponse } from "@shared/types/ipc";
import { ProjectChannels } from "@shared/types/channels";
import type { ProjectInfo, ProjectSummary, CreateProjectForm } from "@shared/types/project";

export const projectApi = {
  list(): Promise<IpcResponse<ProjectSummary[]>> {
    return ipcRenderer.invoke(ProjectChannels.list);
  },

  getById(id: string): Promise<IpcResponse<ProjectInfo | null>> {
    return ipcRenderer.invoke(ProjectChannels.getById, { id });
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

  setActive(id: string): Promise<IpcResponse<ProjectInfo>> {
    return ipcRenderer.invoke(ProjectChannels.setActive, { id });
  },
};
