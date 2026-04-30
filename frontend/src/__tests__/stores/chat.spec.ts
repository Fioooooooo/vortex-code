import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { watch } from "vue";
import { useAcpAgentsStore } from "@renderer/stores/acp-agents";
import { useChatStore } from "@renderer/stores/chat";
import { useProjectStore } from "@renderer/stores/project";
import { useSessionStore } from "@renderer/stores/session";
import { chatApi } from "@renderer/api/chat";
import { projectApi } from "@renderer/api/project";
import type { AcpRegistry, AcpAgentStatus } from "@shared/types/acp-agent";

vi.mock("@renderer/api/chat", () => ({
  chatApi: {
    listSessions: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    removeSession: vi.fn(),
    loadMessages: vi.fn(),
    sendMessage: vi.fn(),
    persistMessage: vi.fn(),
    streamMessage: vi.fn(),
  },
}));

vi.mock("@renderer/api/project", () => ({
  projectApi: {
    list: vi.fn(),
    getById: vi.fn(),
    getDefaultPath: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    openFolder: vi.fn(),
  },
}));

const mockRegistry: AcpRegistry = {
  version: "1",
  agents: [
    {
      id: "claude-code",
      name: "Claude Code",
      version: "1.2.3",
      description: "ACP agent",
      authors: ["Anthropic"],
      license: "MIT",
      distribution: {
        npx: {
          package: "@anthropic/claude-code",
        },
      },
    },
  ],
};

const mockStatuses: Record<string, AcpAgentStatus> = {
  "claude-code": {
    id: "claude-code",
    installed: true,
    detectedVersion: "1.2.3",
    managedBy: "fyllocode",
    updateAvailable: false,
    latestVersion: "1.2.3",
  },
};

describe("useChatStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    vi.mocked(projectApi.list).mockResolvedValue({
      ok: true,
      data: [],
    });
    vi.mocked(chatApi.createSession).mockResolvedValue({
      ok: true,
      data: {
        id: "session-1",
        projectId: "project-1",
        agentId: "claude-code",
        title: "New Session",
        status: "ended",
        turnCount: 0,
        createdAt: "2026-04-30T09:00:00.000Z" as unknown as Date,
        updatedAt: "2026-04-30T09:00:00.000Z" as unknown as Date,
        messages: [],
      },
    });
    vi.mocked(chatApi.persistMessage).mockResolvedValue({
      ok: true,
      data: undefined,
    });
    vi.mocked(chatApi.streamMessage).mockReturnValue(() => {});
  });

  it("creates a real session lazily when sending the first draft message", async () => {
    const acpAgentsStore = useAcpAgentsStore();
    acpAgentsStore.registry = mockRegistry;
    acpAgentsStore.statuses = mockStatuses;

    const projectStore = useProjectStore();
    projectStore.currentProject = {
      id: "project-1",
      name: "Project 1",
      path: "/tmp/project-1",
      createdAt: new Date("2026-04-30T08:00:00.000Z"),
      lastOpenedAt: new Date("2026-04-30T08:00:00.000Z"),
    };

    const sessionStore = useSessionStore();
    sessionStore.beginDraftSession();

    const chatStore = useChatStore();
    await chatStore.sendMessage("hello world");

    expect(chatApi.createSession).toHaveBeenCalledWith({
      projectId: "project-1",
      title: "New Session",
      agentId: "claude-code",
    });
    expect(sessionStore.activeSessionId).toBe("session-1");
    expect(sessionStore.sessions).toHaveLength(1);
    expect(sessionStore.sessions[0]?.turnCount).toBe(1);
    expect(sessionStore.sessions[0]?.messages).toHaveLength(1);
    expect(sessionStore.sessions[0]?.messages[0]?.metadata?.sessionId).toBe("session-1");
    expect(chatApi.persistMessage).toHaveBeenCalledTimes(1);
    expect(chatApi.persistMessage).toHaveBeenCalledWith(
      "session-1",
      "project-1",
      expect.objectContaining({
        role: "user",
        metadata: expect.objectContaining({
          sessionId: "session-1",
        }),
      })
    );
    expect(chatApi.streamMessage).toHaveBeenCalledWith(
      "session-1",
      "project-1",
      "claude-code",
      "hello world",
      expect.any(Object)
    );
  });

  it("updates the active session message list reactively for the first draft message", async () => {
    const acpAgentsStore = useAcpAgentsStore();
    acpAgentsStore.registry = mockRegistry;
    acpAgentsStore.statuses = mockStatuses;

    const projectStore = useProjectStore();
    projectStore.currentProject = {
      id: "project-1",
      name: "Project 1",
      path: "/tmp/project-1",
      createdAt: new Date("2026-04-30T08:00:00.000Z"),
      lastOpenedAt: new Date("2026-04-30T08:00:00.000Z"),
    };

    const sessionStore = useSessionStore();
    sessionStore.beginDraftSession();

    const observedMessageCounts: number[] = [];
    const stop = watch(
      () => sessionStore.activeSession?.messages.length ?? 0,
      (count) => {
        observedMessageCounts.push(count);
      },
      { immediate: true, flush: "sync" }
    );

    const chatStore = useChatStore();
    await chatStore.sendMessage("hello world");
    stop();

    expect(observedMessageCounts).toContain(1);
    expect(observedMessageCounts.at(-1)).toBe(1);
  });
});
