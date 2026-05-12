import { describe, expect, it } from "vitest";
import type { SessionUpdate } from "@agentclientprotocol/sdk";
import { mapSessionUpdate } from "@main/services/chat/acp-mapper";

describe("mapSessionUpdate", () => {
  describe("agent_thought_chunk", () => {
    it("maps text content to reasoning_delta", () => {
      const update = {
        sessionUpdate: "agent_thought_chunk",
        content: {
          type: "text",
          text: "thinking",
        },
      } as SessionUpdate;

      expect(mapSessionUpdate(update)).toEqual({
        type: "reasoning_delta",
        text: "thinking",
      });
    });

    it("returns null for non-text content", () => {
      const update = {
        sessionUpdate: "agent_thought_chunk",
        content: {
          type: "image",
        },
      } as SessionUpdate;

      expect(mapSessionUpdate(update)).toBeNull();
    });
  });

  describe("available_commands_update", () => {
    it("keeps only name, description and unstructured hint", () => {
      const update = {
        sessionUpdate: "available_commands_update",
        availableCommands: [
          {
            name: "review",
            description: "Review code",
            input: {
              type: "unstructured",
              hint: "commit sha",
            },
            _meta: { ignored: true },
          },
        ],
      } as unknown as SessionUpdate;

      expect(mapSessionUpdate(update)).toEqual({
        type: "available_commands_update",
        commands: [
          {
            name: "review",
            description: "Review code",
            hint: "commit sha",
          },
        ],
      });
    });

    it("omits hint when input is null or absent", () => {
      const update = {
        sessionUpdate: "available_commands_update",
        availableCommands: [
          {
            name: "review",
            description: "Review code",
            input: null,
          },
          {
            name: "plan",
            description: "Create plan",
          },
        ],
      } as SessionUpdate;

      expect(mapSessionUpdate(update)).toEqual({
        type: "available_commands_update",
        commands: [
          {
            name: "review",
            description: "Review code",
            hint: undefined,
          },
          {
            name: "plan",
            description: "Create plan",
            hint: undefined,
          },
        ],
      });
    });

    it("keeps empty command arrays", () => {
      const update = {
        sessionUpdate: "available_commands_update",
        availableCommands: [],
      } as SessionUpdate;

      expect(mapSessionUpdate(update)).toEqual({
        type: "available_commands_update",
        commands: [],
      });
    });
  });

  it("maps usage_update events", () => {
    const update = {
      sessionUpdate: "usage_update",
      used: 29017,
      size: 1000000,
      cost: { amount: 0.145305, currency: "USD" },
    } as SessionUpdate;

    expect(mapSessionUpdate(update)).toEqual({
      type: "usage_update",
      used: 29017,
      size: 1000000,
      cost: { amount: 0.145305, currency: "USD" },
    });
  });

  it("omits absent usage_update cost", () => {
    const update = {
      sessionUpdate: "usage_update",
      used: 29017,
      size: 1000000,
    } as SessionUpdate;

    expect(mapSessionUpdate(update)).toEqual({
      type: "usage_update",
      used: 29017,
      size: 1000000,
      cost: undefined,
    });
  });
});
