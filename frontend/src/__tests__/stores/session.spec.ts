import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSessionStore } from "@renderer/stores/session";

describe("useSessionStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("overwrites availableCommands for an existing session", () => {
    const store = useSessionStore();
    store.sessions = [
      {
        id: "session-1",
        projectId: "project-1",
        agentId: "claude-code",
        title: "Session",
        status: "ended",
        turnCount: 0,
        tokenUsage: { used: 0, size: 0 },
        createdAt: new Date("2026-05-12T00:00:00.000Z"),
        updatedAt: new Date("2026-05-12T00:00:00.000Z"),
        messages: [],
      },
    ];

    store.setSessionAvailableCommands("session-1", [
      { name: "review", description: "Review code", hint: "path" },
    ]);

    expect(store.sessions[0]?.availableCommands).toEqual([
      { name: "review", description: "Review code", hint: "path" },
    ]);
  });

  it("does nothing when the session does not exist", () => {
    const store = useSessionStore();

    store.setSessionAvailableCommands("missing", [{ name: "review", description: "Review code" }]);

    expect(store.sessions).toEqual([]);
  });

  it("keeps an explicit empty array when clearing availableCommands", () => {
    const store = useSessionStore();
    store.sessions = [
      {
        id: "session-1",
        projectId: "project-1",
        agentId: "claude-code",
        title: "Session",
        status: "ended",
        turnCount: 0,
        tokenUsage: { used: 0, size: 0 },
        createdAt: new Date("2026-05-12T00:00:00.000Z"),
        updatedAt: new Date("2026-05-12T00:00:00.000Z"),
        messages: [],
        availableCommands: [{ name: "review", description: "Review code" }],
      },
    ];

    store.setSessionAvailableCommands("session-1", []);

    expect(store.sessions[0]?.availableCommands).toEqual([]);
  });
});
