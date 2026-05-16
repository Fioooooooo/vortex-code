import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ChatContainer from "@renderer/components/chat/ChatContainer.vue";
import type { AcpAvailableCommand, Session } from "@shared/types/chat";

const activeSessionRef = ref<Session | null>(null);
const chatStatusRef = ref<"ready" | "submitted" | "streaming" | "error">("ready");
const streamErrorRef = ref<{ code: string; message: string } | null>(null);

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
        streamError: computed(() => streamErrorRef.value),
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
        ChatStreamError: {
          template: '<div data-test="stream-error">{{ errorMessage }}</div>',
          computed: {
            errorMessage(): string {
              return streamErrorRef.value?.message ?? "";
            },
          },
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
    streamErrorRef.value = null;
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

  it("renders an inline stream error after the message list", async () => {
    const session = makeSession();
    session.messages = [{} as Session["messages"][number], {} as Session["messages"][number]];
    activeSessionRef.value = session;
    streamErrorRef.value = {
      code: "stream_failed",
      message: "The stream disconnected unexpectedly",
    };

    const wrapper = mountContainer();

    expect(wrapper.get('[data-test="message-list"]').text()).toBe("2|ready|chat|claude-code");
    expect(wrapper.get('[data-test="stream-error"]').text()).toBe(
      "The stream disconnected unexpectedly"
    );

    const children = wrapper.find(".max-w-240")?.element.children;
    expect(children?.[0]?.getAttribute("data-test")).toBe("message-list");
    expect(children?.[1]?.getAttribute("data-test")).toBe("stream-error");
  });

  it("hides the previous inline error when a new stream starts or completes", async () => {
    const session = makeSession();
    activeSessionRef.value = session;
    streamErrorRef.value = { code: "stream_failed", message: "old error" };

    const wrapper = mountContainer();
    expect(wrapper.find('[data-test="stream-error"]').exists()).toBe(true);

    chatStatusRef.value = "submitted";
    streamErrorRef.value = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="stream-error"]').exists()).toBe(false);

    streamErrorRef.value = { code: "stream_failed", message: "temporary error" };
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="stream-error"]').exists()).toBe(true);

    chatStatusRef.value = "ready";
    streamErrorRef.value = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="stream-error"]').exists()).toBe(false);
  });
});
