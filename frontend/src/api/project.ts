import type { IpcResponse } from "@shared/types/ipc";
import type { ProjectInfo, CreateProjectForm } from "@shared/types/project";

export const projectApi = {
  list(): Promise<IpcResponse<ProjectInfo[]>> {
    return window.api.project.list();
  },

  getById(id: string): Promise<IpcResponse<ProjectInfo | null>> {
    return window.api.project.getById(id);
  },

  getDefaultPath(): Promise<IpcResponse<string>> {
    return window.api.project.getDefaultPath();
  },

  create(input: CreateProjectForm): Promise<IpcResponse<ProjectInfo>> {
    return window.api.project.create(input);
  },

  update(id: string, patch: Partial<ProjectInfo>): Promise<IpcResponse<ProjectInfo>> {
    return window.api.project.update(id, patch);
  },

  remove(id: string): Promise<IpcResponse<void>> {
    return window.api.project.remove(id);
  },

  openFolder(): Promise<IpcResponse<ProjectInfo | null>> {
    return window.api.project.openFolder();
  },
};
