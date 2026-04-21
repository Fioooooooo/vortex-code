import type { IpcResponse } from "@shared/types/ipc";
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
    return window.api.pipeline.listTemplates(query);
  },

  getTemplate(id: string): Promise<IpcResponse<PipelineTemplate | null>> {
    return window.api.pipeline.getTemplate(id);
  },

  createTemplate(input: CreateTemplateForm): Promise<IpcResponse<PipelineTemplate>> {
    return window.api.pipeline.createTemplate(input);
  },

  updateTemplate(
    id: string,
    patch: Partial<PipelineTemplate>
  ): Promise<IpcResponse<PipelineTemplate>> {
    return window.api.pipeline.updateTemplate(id, patch);
  },

  removeTemplate(id: string): Promise<IpcResponse<void>> {
    return window.api.pipeline.removeTemplate(id);
  },

  listRuns(projectId: string): Promise<IpcResponse<PipelineRun[]>> {
    return window.api.pipeline.listRuns(projectId);
  },

  getRun(id: string): Promise<IpcResponse<PipelineRun | null>> {
    return window.api.pipeline.getRun(id);
  },

  createRun(input: CreateRunForm & { projectId: string }): Promise<IpcResponse<PipelineRun>> {
    return window.api.pipeline.createRun(input);
  },

  abortRun(id: string): Promise<IpcResponse<void>> {
    return window.api.pipeline.abortRun(id);
  },

  approveStage(runId: string, stageId: string): Promise<IpcResponse<void>> {
    return window.api.pipeline.approveStage(runId, stageId);
  },

  onStageChanged(handler: (payload: StageChangedPayload) => void): () => void {
    return window.api.pipeline.onStageChanged(handler);
  },

  onRunCompleted(handler: (payload: RunCompletedPayload) => void): () => void {
    return window.api.pipeline.onRunCompleted(handler);
  },
};
