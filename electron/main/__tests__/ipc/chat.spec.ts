import { beforeEach, describe, expect, it, vi } from "vitest";
import { ipcMain } from "electron";
import { ChatChannels, ChatStreamChannels } from "@shared/types/channels";
import { IpcErrorCodes } from "@shared/constants/error-codes";
import type { SessionEvent } from "@main/domain/chat/session-events";
import type { AcpSessionOpts } from "@main/services/chat/acp-session";

const mocks = vi.hoisted(() => {
  let eventHandler: ((ev: SessionEvent) => void) | null = null;
  let onReady:
    | ((sink: {
        sendChunk: ReturnType<typeof vi.fn>;
        sendDone: ReturnType<typeof vi.fn>;
        sendError: ReturnType<typeof vi.fn>;
      }) => unknown)
    | null = null;

  return {
    appendMessage: vi.fn(),
    prependReminderToLastUserMessage: vi.fn(),
    persistSessionMessage: vi.fn(),
    resolveProjectPath: vi.fn(),
    loadSessionMeta: vi.fn(),
    saveSessionMeta: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    cancel: vi.fn(),
    get eventHandler() {
      return eventHandler;
    },
    set eventHandler(next) {
      eventHandler = next;
    },
    get onReady() {
      return onReady;
    },
    set onReady(next) {
      onReady = next;
    },
  };
});

vi.mock("@main/services/chat/chat-service", () => ({
  createSession: vi.fn(),
  listSessions: vi.fn(),
  loadSessionMessages: vi.fn(),
  persistSessionMessage: mocks.persistSessionMessage,
  removeSession: vi.fn(),
  resolveProjectPath: mocks.resolveProjectPath,
  updateSession: vi.fn(),
}));

vi.mock("@main/infra/storage/session-store", () => ({
  appendMessage: mocks.appendMessage,
  loadSessionMeta: mocks.loadSessionMeta,
  saveSessionMeta: mocks.saveSessionMeta,
  sessionMessagesPath: vi.fn(
    (projectPath: string, sessionId: string) => `${projectPath}/${sessionId}.messages.jsonl`
  ),
}));

vi.mock("@main/infra/storage/message-reminder-store", () => ({
  prependReminderToLastUserMessage: mocks.prependReminderToLastUserMessage,
}));

vi.mock("@main/services/chat/session-registry", () => ({
  sessionRegistry: {
    register: mocks.register,
    unregister: mocks.unregister,
    cancel: mocks.cancel,
  },
}));

vi.mock("@main/services/chat/acp-session", () => ({
  AcpSession: vi.fn(function () {
    return {
      on: vi.fn((_event: "event", handler: (ev: SessionEvent) => void) => {
        mocks.eventHandler = handler;
      }),
      start: vi.fn(),
      cancel: vi.fn(),
    };
  }),
}));

vi.mock("@main/ipc/_kit/stream-channel", () => ({
  makeStreamChannel: vi.fn((options) => {
    mocks.onReady = options.onReady;
    return { ok: true, data: null };
  }),
}));

describe("registerChatHandlers", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.eventHandler = null;
    mocks.onReady = null;
    mocks.resolveProjectPath.mockResolvedValue("/tmp/project");
    mocks.loadSessionMeta.mockResolvedValue({
      sessionId: "session-1",
      agentId: "claude-acp",
      title: "Session",
      turnCount: 0,
      tokenUsage: { used: 0, size: 0 },
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z",
    });
    const { registerChatHandlers } = await import("@main/ipc/chat");
    registerChatHandlers();
  });

  function handler(channel: string): (event: unknown, input: unknown) => unknown {
    const call = vi
      .mocked(ipcMain.handle)
      .mock.calls.find(([registeredChannel]) => registeredChannel === channel);
    expect(call).toBeTruthy();
    return call![1] as (event: unknown, input: unknown) => unknown;
  }

  it("rejects assistant messages in persistMessage", async () => {
    const result = await handler(ChatChannels.persistMessage)(
      {},
      {
        sessionId: "session-1",
        projectId: "project-1",
        message: {
          id: "message-1",
          role: "assistant",
          parts: [],
        },
      }
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: IpcErrorCodes.VALIDATION_ERROR }),
    });
    expect(mocks.persistSessionMessage).not.toHaveBeenCalled();
  });

  it("persists assembled assistant message before sending done", async () => {
    handler(ChatStreamChannels.streamMessage)(
      { sender: { postMessage: vi.fn() } },
      {
        sessionId: "session-1",
        projectId: "project-1",
        agentId: "claude-acp",
        prompt: "hello",
      }
    );

    const sink = {
      sendChunk: vi.fn(),
      sendDone: vi.fn(),
      sendError: vi.fn(),
    };
    await mocks.onReady!(sink);

    mocks.eventHandler!({ type: "text_delta", text: "assistant" });
    mocks.eventHandler!({ type: "done", totalTokens: 4 });

    await vi.waitFor(() => {
      expect(mocks.appendMessage).toHaveBeenCalledTimes(1);
      expect(sink.sendDone).toHaveBeenCalledWith(4);
    });
    expect(mocks.appendMessage).toHaveBeenCalledWith(
      "/tmp/project",
      "session-1",
      expect.objectContaining({
        role: "assistant",
        parts: [{ type: "text", text: "assistant" }],
      })
    );
  });

  it("forwards usage_update chunks and persists token usage", async () => {
    handler(ChatStreamChannels.streamMessage)(
      { sender: { postMessage: vi.fn() } },
      {
        sessionId: "session-1",
        projectId: "project-1",
        agentId: "claude-acp",
        prompt: "hello",
      }
    );

    const sink = {
      sendChunk: vi.fn(),
      sendDone: vi.fn(),
      sendError: vi.fn(),
    };
    await mocks.onReady!(sink);

    mocks.eventHandler!({
      type: "usage_update",
      used: 29017,
      size: 1000000,
      cost: { amount: 0.145305, currency: "USD" },
    });

    expect(sink.sendChunk).toHaveBeenCalledWith({
      kind: "usage_update",
      used: 29017,
      size: 1000000,
      cost: { amount: 0.145305, currency: "USD" },
    });
    await vi.waitFor(() => {
      expect(mocks.saveSessionMeta).toHaveBeenCalledWith(
        "/tmp/project",
        expect.objectContaining({
          tokenUsage: {
            used: 29017,
            size: 1000000,
            cost: { amount: 0.145305, currency: "USD" },
          },
        })
      );
    });
    expect(mocks.appendMessage).not.toHaveBeenCalled();
  });

  it("increments persisted token usage on done", async () => {
    mocks.loadSessionMeta.mockResolvedValue({
      sessionId: "session-1",
      agentId: "claude-acp",
      title: "Session",
      turnCount: 0,
      tokenUsage: {
        used: 29017,
        size: 1000000,
        cost: { amount: 0.145305, currency: "USD" },
      },
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z",
    });

    handler(ChatStreamChannels.streamMessage)(
      { sender: { postMessage: vi.fn() } },
      {
        sessionId: "session-1",
        projectId: "project-1",
        agentId: "claude-acp",
        prompt: "hello",
      }
    );

    const sink = {
      sendChunk: vi.fn(),
      sendDone: vi.fn(),
      sendError: vi.fn(),
    };
    await mocks.onReady!(sink);

    mocks.eventHandler!({ type: "done", totalTokens: 4 });

    await vi.waitFor(() => {
      expect(mocks.saveSessionMeta).toHaveBeenCalledWith(
        "/tmp/project",
        expect.objectContaining({
          tokenUsage: {
            used: 29021,
            size: 1000000,
            cost: { amount: 0.145305, currency: "USD" },
          },
        })
      );
      expect(sink.sendDone).toHaveBeenCalledWith(4);
    });
  });

  it("passes chat owner and reminder hook without sending sink chunks", async () => {
    const reminderPart = {
      type: "text",
      text: "<system-reminder>\nbody\n</system-reminder>",
    } as const;

    handler(ChatStreamChannels.streamMessage)(
      { sender: { postMessage: vi.fn() } },
      {
        sessionId: "session-1",
        projectId: "project-1",
        agentId: "claude-acp",
        prompt: "hello",
      }
    );

    const sink = {
      sendChunk: vi.fn(),
      sendDone: vi.fn(),
      sendError: vi.fn(),
    };
    await mocks.onReady!(sink);

    const acpSessionMock = vi.mocked((await import("@main/services/chat/acp-session")).AcpSession);
    const opts = acpSessionMock.mock.calls[0]?.[0] as AcpSessionOpts | undefined;
    expect(opts).toBeDefined();
    if (!opts?.onReminderInjected) {
      throw new Error("Expected onReminderInjected hook");
    }

    expect(opts).toEqual(
      expect.objectContaining({
        owner: "chat",
        projectPath: "/tmp/project",
      })
    );

    await opts.onReminderInjected(reminderPart);

    expect(mocks.prependReminderToLastUserMessage).toHaveBeenCalledWith(
      "/tmp/project/session-1.messages.jsonl",
      reminderPart
    );
    expect(sink.sendChunk).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: "user_message" })
    );
  });
});
