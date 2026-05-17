import { beforeEach, describe, expect, it, vi } from "vitest";
import { ipcMain } from "electron";
import { TaskChannels } from "@shared/types/channels";
import { IpcErrorCodes } from "@shared/constants/error-codes";

const mocks = vi.hoisted(() => ({
  listTasks: vi.fn(),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  resolveTaskProjectPath: vi.fn(),
}));

vi.mock("@main/services/task/task-aggregator", () => ({
  listTasks: mocks.listTasks,
  getTask: mocks.getTask,
}));

vi.mock("@main/services/task/task-service", () => ({
  createTask: mocks.createTask,
  updateTask: mocks.updateTask,
  deleteTask: mocks.deleteTask,
  resolveTaskProjectPath: mocks.resolveTaskProjectPath,
}));

describe("registerTaskHandlers", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.getTask.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      title: "任务 1",
      description: "详情",
      status: "open",
      source: "local",
      sourceMeta: { source: "local" },
      labels: [],
      createdAt: new Date("2026-05-17T00:00:00.000Z"),
      updatedAt: new Date("2026-05-17T00:00:00.000Z"),
    });

    const { registerTaskHandlers } = await import("@main/ipc/task");
    registerTaskHandlers();
  });

  function handler(channel: string): (event: unknown, input: unknown) => Promise<unknown> {
    const call = vi
      .mocked(ipcMain.handle)
      .mock.calls.find(([registeredChannel]) => registeredChannel === channel);
    expect(call).toBeTruthy();
    return call![1] as (event: unknown, input: unknown) => Promise<unknown>;
  }

  it("returns task detail for task:get", async () => {
    const result = await handler(TaskChannels.get)(
      {},
      { projectId: "project-1", taskId: "task-1" }
    );

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        id: "task-1",
        description: "详情",
      }),
    });
    expect(mocks.getTask).toHaveBeenCalledWith("project-1", "task-1");
  });

  it("returns validation error for invalid task:get payload", async () => {
    const result = await handler(TaskChannels.get)({}, { projectId: "project-1", taskId: "" });

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: IpcErrorCodes.VALIDATION_ERROR,
      }),
    });
    expect(mocks.getTask).not.toHaveBeenCalled();
  });

  it("returns task not found when task:get resolves null", async () => {
    mocks.getTask.mockResolvedValueOnce(null);

    const result = await handler(TaskChannels.get)(
      {},
      { projectId: "project-1", taskId: "missing" }
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: IpcErrorCodes.TASK_NOT_FOUND,
      }),
    });
  });
});
