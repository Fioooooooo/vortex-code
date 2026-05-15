import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionMeta } from "@main/infra/storage/session-store";

const mocks = vi.hoisted(() => ({
  loadProject: vi.fn(),
  listSessionMetas: vi.fn(),
  loadSessionMeta: vi.fn(),
  patchSessionMeta: vi.fn(),
  createSessionMeta: vi.fn(),
}));

vi.mock("@main/infra/storage/project-store", () => ({
  loadProject: mocks.loadProject,
}));

vi.mock("@main/infra/storage/session-store", () => ({
  appendMessage: vi.fn(),
  createSessionMeta: mocks.createSessionMeta,
  deleteSession: vi.fn(),
  listSessionMetas: mocks.listSessionMetas,
  loadMessages: vi.fn(),
  loadSessionMeta: mocks.loadSessionMeta,
  patchSessionMeta: mocks.patchSessionMeta,
}));

import { listSessions } from "@main/services/chat/chat-service";

function meta(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    sessionId: "session-1",
    agentId: "claude-acp",
    title: "Session",
    turnCount: 0,
    tokenUsage: { used: 0, size: 0 },
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("chat-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadProject.mockResolvedValue({ id: "project-1", path: "/tmp/project" });
  });

  it("maps persisted available_commands when listing sessions", async () => {
    mocks.listSessionMetas.mockResolvedValue([
      meta({
        sessionId: "with-commands",
        available_commands: [{ name: "review", description: "Review code" }],
      }),
      meta({
        sessionId: "empty-commands",
        available_commands: [],
        updatedAt: "2026-05-14T00:00:01.000Z",
      }),
      meta({
        sessionId: "legacy",
        updatedAt: "2026-05-14T00:00:02.000Z",
      }),
    ]);

    const sessions = await listSessions("project-1");

    expect(sessions.map((session) => [session.id, session.availableCommands])).toEqual([
      ["legacy", undefined],
      ["empty-commands", []],
      ["with-commands", [{ name: "review", description: "Review code" }]],
    ]);
  });
});
