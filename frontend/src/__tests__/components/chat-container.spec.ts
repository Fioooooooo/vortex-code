import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ChatContainer from "@renderer/components/chat/ChatContainer.vue";
import type { AcpAvailableCommand, Session } from "@shared/types/chat";

const activeSessionRef = ref<Session | null>(null);
const draftAgentIdRef = ref<string | null>("claude-code");
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
    draftAgentId: computed(() => draftAgentIdRef.value),
    setSessionAgent: vi.fn(),
    setDraftAgent: vi.fn(),
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
        draftAgentId: computed(() => draftAgentIdRef.value),
      };
    },
  };
});

function mountContainer(): VueWrapper {
  return mount(ChatContainer, {
    global: {
      plugins: [createPinia()],
      stubs: {
        UIMessageList: { template: '<div data-test="message-list"></div>' },
        ContextUsageRing: { template: '<div data-test="usage-ring"></div>' },
        ChatAgentSelect: { template: '<div data-test="agent-select"></div>' },
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
    tokenUsage: { used: 0, size: 0 },
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
    draftAgentIdRef.value = "claude-code";
    chatStatusRef.value = "ready";
  });

  it("hides the slash button when activeSession is null or has no commands", async () => {
    const wrapper = mountContainer();

    expect(wrapper.find('[data-test="slash-button"]').exists()).toBe(false);

    activeSessionRef.value = makeSession([]);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-test="slash-button"]').exists()).toBe(false);

    activeSessionRef.value = makeSession([{ name: "review", description: "Review code" }]);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-test="slash-button"]').exists()).toBe(true);
  });

  it("updates button visibility and menu items when switching sessions", async () => {
    const wrapper = mountContainer();

    activeSessionRef.value = makeSession([{ name: "review", description: "Review code" }]);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="slash-button"]').exists()).toBe(true);

    await wrapper.get('[data-test="slash-button"]').trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("/review");

    activeSessionRef.value = makeSession([]);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="slash-button"]').exists()).toBe(false);

    activeSessionRef.value = makeSession([{ name: "plan", description: "Create plan" }]);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="slash-button"]').exists()).toBe(true);

    await wrapper.get('[data-test="slash-button"]').trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("/plan");
  });

  it("applies width and height constraints to the slash menu", async () => {
    activeSessionRef.value = makeSession([{ name: "review", description: "Review code" }]);
    const wrapper = mountContainer();

    await wrapper.get('[data-test="slash-button"]').trigger("click");
    await wrapper.vm.$nextTick();

    const menu = wrapper.get('[data-test="slash-menu"]');
    const menuClass = menu.attributes("class");

    expect(menuClass).toContain("max-h-[min(24rem,calc(100vh-8rem))]");
    expect(menuClass).toContain("overflow-hidden");
    expect(wrapper.html()).toContain(
      "w-[min(32rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-0"
    );
    expect(wrapper.html()).toContain("max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto");
  });

  it("opens the menu on slash only at line start and never calls preventDefault", async () => {
    const cases = [
      { value: "", cursor: 0, shouldOpen: true },
      { value: "hello", cursor: 5, shouldOpen: false },
      { value: "hello\n", cursor: 6, shouldOpen: true },
      { value: "hello", cursor: 0, shouldOpen: true },
    ];

    for (const testCase of cases) {
      activeSessionRef.value = makeSession([{ name: "review", description: "Review code" }]);
      const wrapper = mountContainer();
      const textarea = wrapper.get("textarea").element as HTMLTextAreaElement;

      textarea.value = testCase.value;
      textarea.setSelectionRange(testCase.cursor, testCase.cursor);

      const preventDefault = vi.fn();
      const keydown = new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true });
      Object.defineProperty(keydown, "target", { value: textarea });
      keydown.preventDefault = preventDefault;
      textarea.dispatchEvent(keydown);
      await wrapper.get("textarea").trigger("input");
      await wrapper.vm.$nextTick();

      expect(preventDefault).not.toHaveBeenCalled();
      expect(wrapper.find('[data-test="slash-menu"]').exists()).toBe(testCase.shouldOpen);
    }
  });
});
