import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import ActivityBar from "@renderer/components/layout/ActivityBar.vue";
import { activityBarItems } from "@renderer/config/activity-bar";

const mockPath = ref("/task");

vi.mock("vue-router", () => ({
  useRoute: () => ({
    path: mockPath.value,
  }),
}));

vi.mock("@renderer/stores/project", () => ({
  useProjectStore: () => ({
    hasCurrentProject: true,
  }),
}));

describe("ActivityBar", () => {
  it("renders all registered items", () => {
    const wrapper = mount(ActivityBar);
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(activityBarItems.length);
  });

  it("highlights the item matching current route", async () => {
    mockPath.value = "/chat";
    const wrapper = mount(ActivityBar);
    await wrapper.vm.$nextTick();

    const activeButtons = wrapper.findAll('button[data-color="primary"]');

    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0].attributes("to")).toBe("/chat");
  });

  it("returns null for unmatched routes", async () => {
    mockPath.value = "/unknown-route";
    const wrapper = mount(ActivityBar);
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('button[data-color="primary"]')).toHaveLength(0);
  });

  it("uses longest-prefix match for nested paths", async () => {
    mockPath.value = "/proposal/some-id";
    const wrapper = mount(ActivityBar);
    await wrapper.vm.$nextTick();

    const activeButtons = wrapper.findAll('button[data-color="primary"]');

    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0].attributes("to")).toBe("/proposal");
  });
});
