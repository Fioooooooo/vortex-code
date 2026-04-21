import type { IpcResponse } from "@shared/types/ipc";
import type { ProjectInfo, ProjectSummary, CreateProjectForm } from "@shared/types/project";

export const projectApi = {
  list(): Promise<IpcResponse<ProjectSummary[]>> {
    return window.api.project.list();
  },

  getById(id: string): Promise<IpcResponse<ProjectInfo | null>> {
    return window.api.project.getById(id);
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

  setActive(id: string): Promise<IpcResponse<ProjectInfo>> {
    return window.api.project.setActive(id);
  },
};
