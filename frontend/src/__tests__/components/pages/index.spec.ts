import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import IndexPage from "../../../pages/index.vue";

describe("pages/index.vue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初始状态正确", () => {
    const wrapper = mount(IndexPage);

    expect(wrapper.vm.count).toBe(0);
    expect(wrapper.vm.loading).toBe(false);
    expect(wrapper.vm.checked).toBe(false);
    expect(wrapper.vm.selected).toBe("option1");
    expect(wrapper.vm.inputVal).toBe("");
  });

  it("点击按钮后 count 递增", async () => {
    const wrapper = mount(IndexPage);
    const buttons = wrapper.findAll("button");
    const incrementBtn = buttons.find((b) => b.text().includes("点击"));

    expect(incrementBtn?.text()).toContain("点击 0");

    await incrementBtn?.trigger("click");
    expect(wrapper.vm.count).toBe(1);

    await incrementBtn?.trigger("click");
    expect(wrapper.vm.count).toBe(2);
  });

  it("simulateLoad 在 1.5s 后重置 loading 状态", async () => {
    const wrapper = mount(IndexPage);
    const buttons = wrapper.findAll("button");
    const loadBtn = buttons.find((b) => b.text().includes("Loading"));

    expect(wrapper.vm.loading).toBe(false);

    await loadBtn?.trigger("click");
    expect(wrapper.vm.loading).toBe(true);

    vi.advanceTimersByTime(1500);

    expect(wrapper.vm.loading).toBe(false);
  });
});
