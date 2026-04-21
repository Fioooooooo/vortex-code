import { ipcMain } from "electron";
import { PipelineChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";

export function registerPipelineHandlers(): void {
  ipcMain.handle(PipelineChannels.listTemplates, (_event, { projectId }: { projectId?: string }) =>
    wrapHandler(async () => {
      void projectId;
      return [];
    })
  );

  ipcMain.handle(PipelineChannels.getTemplate, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
      return null;
    })
  );

  ipcMain.handle(
    PipelineChannels.createTemplate,
    (_event, input: { name: string; description: string; stages: unknown[] }) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  ipcMain.handle(
    PipelineChannels.updateTemplate,
    (_event, { id, patch }: { id: string; patch: Record<string, unknown> }) =>
      wrapHandler(async () => {
        void id;
        void patch;
        return null;
      })
  );

  ipcMain.handle(PipelineChannels.removeTemplate, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
    })
  );

  ipcMain.handle(PipelineChannels.listRuns, (_event, { projectId }: { projectId: string }) =>
    wrapHandler(async () => {
      void projectId;
      return [];
    })
  );

  ipcMain.handle(PipelineChannels.getRun, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
      return null;
    })
  );

  ipcMain.handle(
    PipelineChannels.createRun,
    (_event, input: { projectId: string; templateId: string; triggerDescription: string }) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  ipcMain.handle(PipelineChannels.abortRun, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
    })
  );

  ipcMain.handle(
    PipelineChannels.approveStage,
    (_event, { runId, stageId }: { runId: string; stageId: string }) =>
      wrapHandler(async () => {
        void runId;
        void stageId;
      })
  );
}

// Called by pipeline service to push stage change events to a specific renderer
export function emitStageChanged(
  sender: Electron.WebContents,
  payload: { runId: string; stageId: string; status: string; timestamp: string }
): void {
  sender.send("pipeline:event:stageChanged", { type: "stageChanged", payload });
}

export function emitRunCompleted(
  sender: Electron.WebContents,
  payload: { runId: string; status: string; timestamp: string }
): void {
  sender.send("pipeline:event:runCompleted", { type: "runCompleted", payload });
}
