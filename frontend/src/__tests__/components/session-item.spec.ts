import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import SessionItem from "@renderer/components/chat/SessionItem.vue";
import type { Session } from "@shared/types/chat";

const activeSessionIdRef = ref<string | null>("session-1");
const chatStatusRef = ref<"ready" | "submitted" | "streaming" | "error">("error");
const streamErrorRef = ref<{ code: string; message: string } | null>({
  code: "stream_failed",
  message: "bad network",
});

const selectSession = vi.fn(async (sessionId: string) => {
  activeSessionIdRef.value = sessionId;
});
const renameSession = vi.fn(async () => undefined);
const deleteSession = vi.fn(async () => undefined);
const resetChatState = vi.fn(() => {
  chatStatusRef.value = "ready";
  streamErrorRef.value = null;
});

vi.stubGlobal(
  "prompt",
  vi.fn(() => null)
);
vi.stubGlobal(
  "confirm",
  vi.fn(() => true)
);

vi.mock("@renderer/stores/session", () => ({
  useSessionStore: () => ({
    activeSessionId: computed(() => activeSessionIdRef.value),
    selectSession,
    renameSession,
    deleteSession,
  }),
}));

vi.mock("@renderer/stores", () => ({
  useChatStore: () => ({
    chatStatus: computed(() => chatStatusRef.value),
    streamError: computed(() => streamErrorRef.value),
    resetChatState,
  }),
}));

function makeSession(id: string): Session {
  return {
    id,
    projectId: "project-1",
    agentId: "claude-code",
    title: `Session ${id}`,
    status: "ended",
    turnCount: 1,
    tokenUsage: { used: 10, size: 100 },
    createdAt: new Date("2026-05-12T00:00:00.000Z"),
    updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    messages: [],
  };
}

describe("SessionItem", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    activeSessionIdRef.value = "session-1";
    chatStatusRef.value = "error";
    streamErrorRef.value = { code: "stream_failed", message: "bad network" };
    selectSession.mockClear();
    renameSession.mockClear();
    deleteSession.mockClear();
    resetChatState.mockClear();
  });

  it("resets transient chat state after switching sessions", async () => {
    const wrapper = mount(SessionItem, {
      props: {
        session: makeSession("session-2"),
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          UDropdownMenu: {
            template: "<div><slot /></div>",
            props: ["items"],
          },
          UButton: {
            template: '<button type="button"><slot /></button>',
          },
          UIcon: true,
        },
      },
    });

    await wrapper.get(".group").trigger("click");

    expect(selectSession).toHaveBeenCalledWith("session-2");
    expect(resetChatState).toHaveBeenCalledTimes(1);
    expect(chatStatusRef.value).toBe("ready");
    expect(streamErrorRef.value).toBeNull();
    expect(activeSessionIdRef.value).toBe("session-2");
  });
});
