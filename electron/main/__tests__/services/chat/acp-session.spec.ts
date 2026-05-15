import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionNotification } from "@agentclientprotocol/sdk";
import type { TextUIPart } from "ai";

const mocks = vi.hoisted(() => {
  const sessionHandlers = new Map<string, (notification: SessionNotification) => void>();
  const connection = {
    resumeSession: vi.fn(),
    newSession: vi.fn(),
    prompt: vi.fn(),
    cancel: vi.fn(),
  };

  return {
    connection,
    sessionHandlers,
    getOrStartProcess: vi.fn(),
    loadSessionMeta: vi.fn(),
    patchSessionMeta: vi.fn(),
    upsertSessionMeta: vi.fn(),
    getBundledMcpServers: vi.fn(),
    toAcpMcpServerEnv: vi.fn(),
    resolveSystemReminder: vi.fn(),
    logger: {
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock("@main/infra/process/acp-process-pool", () => ({
  getOrStartProcess: mocks.getOrStartProcess,
}));

vi.mock("@main/infra/storage/session-store", () => ({
  loadSessionMeta: mocks.loadSessionMeta,
  patchSessionMeta: mocks.patchSessionMeta,
  upsertSessionMeta: mocks.upsertSessionMeta,
}));

vi.mock("@main/infra/mcp/bundled-mcp-servers", () => ({
  getBundledMcpServers: mocks.getBundledMcpServers,
  toAcpMcpServerEnv: mocks.toAcpMcpServerEnv,
}));

vi.mock("@main/services/chat/system-reminder", () => ({
  resolveSystemReminder: mocks.resolveSystemReminder,
}));

vi.mock("@main/infra/logger", () => ({
  default: mocks.logger,
}));

vi.mock("@main/services/chat/acp-mapper", () => ({
  mapSessionUpdate: vi.fn(() => null),
}));

describe("AcpSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionHandlers.clear();
    mocks.getOrStartProcess.mockResolvedValue({
      connection: mocks.connection,
      sessionHandlers: mocks.sessionHandlers,
    });
    mocks.connection.resumeSession.mockResolvedValue(undefined);
    mocks.connection.newSession.mockResolvedValue({ sessionId: "acp-new" });
    mocks.connection.prompt.mockResolvedValue({ usage: { outputTokens: 12 } });
    mocks.loadSessionMeta.mockResolvedValue({
      sessionId: "session-1",
      acpSessionId: undefined,
      agentId: "claude-acp",
      title: "Session",
      turnCount: 0,
      tokenUsage: { used: 0, size: 0 },
      createdAt: "2026-05-08T00:00:00.000Z",
      updatedAt: "2026-05-08T00:00:00.000Z",
    });
    mocks.upsertSessionMeta.mockImplementation(async (_projectPath, _sessionId, create, update) => {
      const current = await mocks.loadSessionMeta();
      const base = current ?? create();
      const next = typeof update === "function" ? update(base) : update;
      return { ...base, ...next };
    });
    mocks.patchSessionMeta.mockImplementation(async (_projectPath, _sessionId, update) => {
      const current = await mocks.loadSessionMeta();
      if (!current) return null;
      return typeof update === "function"
        ? { ...current, ...update(current) }
        : { ...current, ...update };
    });
    mocks.getBundledMcpServers.mockReturnValue([]);
    mocks.toAcpMcpServerEnv.mockImplementation((env: unknown) => env);
    mocks.resolveSystemReminder.mockResolvedValue(null);
  });

  async function createSession(
    overrides: Partial<import("@main/services/chat/acp-session").AcpSessionOpts> = {}
  ): Promise<import("@main/services/chat/acp-session").AcpSession> {
    const { AcpSession } = await import("@main/services/chat/acp-session");
    return new AcpSession({
      fylloSessionId: "session-1",
      agentId: "claude-acp",
      projectPath: "/tmp/project",
      cwd: "/tmp/project",
      owner: "chat",
      ...overrides,
    });
  }

  it("injects reminder and calls the hook on a fresh newSession", async () => {
    const reminderPart: TextUIPart = {
      type: "text",
      text: "<system-reminder>\nbody\n</system-reminder>",
    };
    const onReminderInjected = vi.fn().mockResolvedValue(undefined);
    mocks.resolveSystemReminder.mockResolvedValue(reminderPart);

    const session = await createSession({ onReminderInjected });
    await session.start("hello");

    expect(mocks.connection.newSession).toHaveBeenCalledTimes(1);
    expect(mocks.resolveSystemReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "chat",
        fylloSessionId: "session-1",
        agentId: "claude-acp",
      })
    );
    expect(onReminderInjected).toHaveBeenCalledWith(reminderPart);
    expect(mocks.connection.prompt).toHaveBeenCalledWith({
      sessionId: "acp-new",
      prompt: [reminderPart, { type: "text", text: "hello" }],
    });
  });

  it("skips reminder resolution on successful resume", async () => {
    mocks.loadSessionMeta.mockResolvedValue({
      sessionId: "session-1",
      acpSessionId: "acp-existing",
      agentId: "claude-acp",
      title: "Session",
      turnCount: 1,
      tokenUsage: { used: 0, size: 0 },
      createdAt: "2026-05-08T00:00:00.000Z",
      updatedAt: "2026-05-08T00:00:00.000Z",
    });

    const session = await createSession({ onReminderInjected: vi.fn() });
    await session.start("hello");

    expect(mocks.connection.resumeSession).toHaveBeenCalledWith({
      sessionId: "acp-existing",
      cwd: "/tmp/project",
      mcpServers: [],
    });
    expect(mocks.resolveSystemReminder).not.toHaveBeenCalled();
    expect(mocks.connection.prompt).toHaveBeenCalledWith({
      sessionId: "acp-existing",
      prompt: [{ type: "text", text: "hello" }],
    });
  });

  it("injects reminder after resume fallback triggers newSession", async () => {
    mocks.loadSessionMeta.mockResolvedValue({
      sessionId: "session-1",
      acpSessionId: "acp-existing",
      agentId: "claude-acp",
      title: "Session",
      turnCount: 1,
      tokenUsage: { used: 0, size: 0 },
      createdAt: "2026-05-08T00:00:00.000Z",
      updatedAt: "2026-05-08T00:00:00.000Z",
    });
    mocks.connection.resumeSession.mockRejectedValue(new Error("resume failed"));
    const reminderPart: TextUIPart = {
      type: "text",
      text: "<system-reminder>\nbody\n</system-reminder>",
    };
    mocks.resolveSystemReminder.mockResolvedValue(reminderPart);

    const session = await createSession();
    await session.start("hello");

    expect(mocks.connection.newSession).toHaveBeenCalledTimes(1);
    expect(mocks.resolveSystemReminder).toHaveBeenCalledTimes(1);
    expect(mocks.connection.prompt).toHaveBeenCalledWith({
      sessionId: "acp-new",
      prompt: [reminderPart, { type: "text", text: "hello" }],
    });
  });

  it("logs hook failures and still prompts with the reminder first", async () => {
    const reminderPart: TextUIPart = {
      type: "text",
      text: "<system-reminder>\nbody\n</system-reminder>",
    };
    mocks.resolveSystemReminder.mockResolvedValue(reminderPart);
    const onReminderInjected = vi.fn().mockRejectedValue(new Error("disk failed"));

    const session = await createSession({ onReminderInjected });
    await session.start("hello");

    expect(mocks.logger.error).toHaveBeenCalledWith(
      "[acp-session] onReminderInjected failed",
      expect.any(Error)
    );
    expect(mocks.connection.prompt).toHaveBeenCalledWith({
      sessionId: "acp-new",
      prompt: [reminderPart, { type: "text", text: "hello" }],
    });
  });

  it("keeps a single user block when reminder resolution returns null", async () => {
    const session = await createSession();
    await session.start("hello");

    expect(mocks.connection.prompt).toHaveBeenCalledWith({
      sessionId: "acp-new",
      prompt: [{ type: "text", text: "hello" }],
    });
  });

  it("preserves available_commands when start persists the next turn", async () => {
    mocks.loadSessionMeta.mockResolvedValue({
      sessionId: "session-1",
      acpSessionId: "acp-existing",
      agentId: "claude-acp",
      title: "Session",
      turnCount: 1,
      tokenUsage: { used: 0, size: 0 },
      available_commands: [{ name: "review", description: "Review code" }],
      createdAt: "2026-05-08T00:00:00.000Z",
      updatedAt: "2026-05-08T00:00:00.000Z",
    });

    const session = await createSession();
    await session.start("hello");

    expect(mocks.upsertSessionMeta).toHaveBeenCalledWith(
      "/tmp/project",
      "session-1",
      expect.any(Function),
      expect.objectContaining({
        acpSessionId: "acp-existing",
        agentId: "claude-acp",
        turnCount: 2,
      })
    );
  });
});
