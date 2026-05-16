import { describe, expect, it } from "vitest";
import { wrapState } from "../src/utils/state";

describe("fyllo-specs runtime", () => {
  it("wraps prompt and state", () => {
    const text = wrapState("prompt", { ok: true });
    expect(text).toContain("<tool_instruction>");
    expect(text).toContain("<state>");
  });
});
