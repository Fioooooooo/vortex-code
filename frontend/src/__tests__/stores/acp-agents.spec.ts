import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAcpAgentsStore } from "@renderer/stores/acp-agents";
import { acpAgentsApi } from "@renderer/api/acp-agents";
import type { AcpRegistry, AcpAgentStatus } from "@shared/types/acp-agent";

vi.mock("@renderer/api/acp-agents", () => ({
  acpAgentsApi: {
    getRegistry: vi.fn(),
    refreshRegistry: vi.fn(),
    getIcons: vi.fn(),
    detectStatus: vi.fn(),
    install: vi.fn(),
    onRegistryUpdated: vi.fn(() => () => {}),
    onInstallProgress: vi.fn(() => () => {}),
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

const mockStatuses: AcpAgentStatus[] = [
  {
    id: "claude-code",
    installed: true,
    detectedVersion: "1.2.3",
    managedBy: "fyllocode",
    updateAvailable: false,
    latestVersion: "1.2.3",
  },
];

describe("useAcpAgentsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    vi.mocked(acpAgentsApi.getRegistry).mockResolvedValue({
      ok: true,
      data: mockRegistry,
    });
    vi.mocked(acpAgentsApi.getIcons).mockResolvedValue({
      ok: true,
      data: { "claude-code": "data:image/png;base64,abc" },
    });
    vi.mocked(acpAgentsApi.detectStatus).mockResolvedValue({
      ok: true,
      data: mockStatuses,
    });
    vi.mocked(acpAgentsApi.install).mockResolvedValue({
      ok: true,
      data: {
        managedBy: "fyllocode",
        installMethod: "npx",
        installedVersion: "1.2.3",
        installedAt: Date.now(),
      },
    });
  });

  it("loads registry, icons and statuses through the ACP API", async () => {
    const store = useAcpAgentsStore();

    await store.loadRegistry();
    await store.loadIcons();
    await store.refreshStatus();

    expect(store.registry).toEqual(mockRegistry);
    expect(store.icons["claude-code"]).toContain("data:image/png");
    expect(store.statuses["claude-code"]).toEqual(mockStatuses[0]);
    expect(acpAgentsApi.onRegistryUpdated).toHaveBeenCalledTimes(1);
    expect(acpAgentsApi.onInstallProgress).toHaveBeenCalledTimes(1);
  });

  it("marks install progress as done after a successful install", async () => {
    const store = useAcpAgentsStore();

    await store.installAgent("claude-code");

    expect(acpAgentsApi.install).toHaveBeenCalledWith("claude-code");
    expect(acpAgentsApi.detectStatus).toHaveBeenCalled();
    expect(store.installProgress["claude-code"]).toEqual({
      agentId: "claude-code",
      status: "done",
    });
  });
});
