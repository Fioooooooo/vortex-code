import { ipcRenderer } from "electron";
import type { IpcResponse } from "@shared/types/ipc";
import { PipelineChannels, PipelineEventChannels } from "@shared/types/channels";
import type {
  PipelineTemplate,
  PipelineRun,
  CreateRunForm,
  CreateTemplateForm,
  StageStatus,
} from "@shared/types/pipeline";

export interface StageChangedPayload {
  runId: string;
  stageId: string;
  status: StageStatus;
  timestamp: string;
}

export interface RunCompletedPayload {
  runId: string;
  status: "completed" | "failed" | "aborted";
  timestamp: string;
}

export const pipelineApi = {
  listTemplates(query?: { projectId?: string }): Promise<IpcResponse<PipelineTemplate[]>> {
    return ipcRenderer.invoke(PipelineChannels.listTemplates, query ?? {});
  },

  getTemplate(id: string): Promise<IpcResponse<PipelineTemplate | null>> {
    return ipcRenderer.invoke(PipelineChannels.getTemplate, { id });
  },

  createTemplate(input: CreateTemplateForm): Promise<IpcResponse<PipelineTemplate>> {
    return ipcRenderer.invoke(PipelineChannels.createTemplate, input);
  },

  updateTemplate(
    id: string,
    patch: Partial<PipelineTemplate>
  ): Promise<IpcResponse<PipelineTemplate>> {
    return ipcRenderer.invoke(PipelineChannels.updateTemplate, { id, patch });
  },

  removeTemplate(id: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(PipelineChannels.removeTemplate, { id });
  },

  listRuns(projectId: string): Promise<IpcResponse<PipelineRun[]>> {
    return ipcRenderer.invoke(PipelineChannels.listRuns, { projectId });
  },

  getRun(id: string): Promise<IpcResponse<PipelineRun | null>> {
    return ipcRenderer.invoke(PipelineChannels.getRun, { id });
  },

  createRun(input: CreateRunForm & { projectId: string }): Promise<IpcResponse<PipelineRun>> {
    return ipcRenderer.invoke(PipelineChannels.createRun, input);
  },

  abortRun(id: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(PipelineChannels.abortRun, { id });
  },

  approveStage(runId: string, stageId: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(PipelineChannels.approveStage, { runId, stageId });
  },

  onStageChanged(handler: (payload: StageChangedPayload) => void): () => void {
    const listener = (
      _event: Electron.IpcRendererEvent,
      msg: { payload: StageChangedPayload }
    ): void => {
      handler(msg.payload);
    };
    ipcRenderer.on(PipelineEventChannels.stageChanged, listener);
    return (): void => {
      ipcRenderer.removeListener(PipelineEventChannels.stageChanged, listener);
    };
  },

  onRunCompleted(handler: (payload: RunCompletedPayload) => void): () => void {
    const listener = (
      _event: Electron.IpcRendererEvent,
      msg: { payload: RunCompletedPayload }
    ): void => {
      handler(msg.payload);
    };
    ipcRenderer.on(PipelineEventChannels.runCompleted, listener);
    return (): void => {
      ipcRenderer.removeListener(PipelineEventChannels.runCompleted, listener);
    };
  },
};
