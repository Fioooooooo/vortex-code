import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ChatContainer from "@renderer/components/chat/ChatContainer.vue";
import type { AcpAvailableCommand, Session } from "@shared/types/chat";

const activeSessionRef = ref<Session | null>(null);
const chatStatusRef = ref<"ready" | "submitted" | "streaming" | "error">("ready");

vi.mock("@renderer/stores/chat", () => ({
  useChatStore: () => ({
    sendMessage: vi.fn(),
    cancelStream: vi.fn(),
  }),
}));

vi.mock("@renderer/stores/session", () => ({
  useSessionStore: () => ({
    activeSession: computed(() => activeSessionRef.value),
  }),
}));

vi.mock("pinia", async (importOriginal) => {
  const actual = await importOriginal<typeof import("pinia")>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      void store;
      return {
        chatStatus: computed(() => chatStatusRef.value),
        activeSession: computed(() => activeSessionRef.value),
      };
    },
  };
});

function mountContainer(): VueWrapper {
  return mount(ChatContainer, {
    global: {
      plugins: [createPinia()],
      stubs: {
        UIMessageList: {
          props: ["messages", "status", "type", "agentId"],
          template:
            '<div data-test="message-list">{{ messages.length }}|{{ status }}|{{ type }}|{{ agentId ?? "none" }}</div>',
        },
        ChatPromptPanel: { template: '<div data-test="prompt-panel"></div>' },
      },
    },
  });
}

function makeSession(commands: AcpAvailableCommand[] = []): Session {
  return {
    id: "session-1",
    projectId: "project-1",
    agentId: "claude-code",
    title: "Session",
    status: "ended",
    turnCount: 0,
    tokenUsage: { used: 128, size: 1024 },
    createdAt: new Date("2026-05-12T00:00:00.000Z"),
    updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    messages: [],
    availableCommands: commands,
  };
}

describe("ChatContainer", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    activeSessionRef.value = null;
    chatStatusRef.value = "ready";
  });

  it("passes active session state to the message list and renders the prompt panel", async () => {
    const wrapper = mountContainer();

    expect(wrapper.get('[data-test="message-list"]').text()).toBe("0|ready|chat|none");
    expect(wrapper.find('[data-test="prompt-panel"]').exists()).toBe(true);

    const session = makeSession([{ name: "review", description: "Review code" }]);
    session.messages = [{} as Session["messages"][number]];
    activeSessionRef.value = session;
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-test="message-list"]').text()).toBe("1|ready|chat|claude-code");
    expect(wrapper.find('[data-test="prompt-panel"]').exists()).toBe(true);
  });
});
