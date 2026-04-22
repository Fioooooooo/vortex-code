import { randomUUID } from "crypto";
import type { Message, MessageMeta } from "@shared/types/chat";
import type { DynamicToolUIPart } from "ai";
import type { ClaudeAssistantMessage, ClaudeToolResultBlock } from "./types";

/**
 * Map a Claude CLI assistant message to a UIMessage.
 * toolResultBuffer: pre-fetched tool results keyed by tool_use_id.
 */
export function mapAssistantMessage(
  raw: ClaudeAssistantMessage,
  sessionId: string,
  toolResultBuffer: Map<string, string>
): Message {
  const meta: MessageMeta = { sessionId, createdAt: new Date() };
  const parts: Message["parts"] = [];

  for (const block of raw.message.content) {
    if (block.type === "text") {
      parts.push({ type: "text", text: block.text });
    } else if (block.type === "tool_use") {
      const buffered = toolResultBuffer.get(block.id);
      if (buffered !== undefined) {
        const part: DynamicToolUIPart = {
          type: "dynamic-tool",
          toolCallId: block.id,
          toolName: block.name,
          state: "output-available",
          input: block.input,
          output: buffered,
        };
        parts.push(part);
        toolResultBuffer.delete(block.id);
      } else {
        const part: DynamicToolUIPart = {
          type: "dynamic-tool",
          toolCallId: block.id,
          toolName: block.name,
          state: "input-available",
          input: block.input,
        };
        parts.push(part);
      }
    }
  }

  return {
    id: raw.message.id ?? randomUUID(),
    role: "assistant",
    parts,
    metadata: meta,
  };
}

/**
 * Apply a tool_result block to an existing UIMessage's tool-invocation parts.
 * Returns the updated parts array (mutates in place and returns it).
 */
export function applyToolResult(
  message: Message,
  toolResult: ClaudeToolResultBlock
): Message["parts"] {
  const resultText =
    typeof toolResult.content === "string"
      ? toolResult.content
      : toolResult.content.map((c) => (c.type === "text" ? (c.text ?? "") : "")).join("");

  for (let i = 0; i < message.parts.length; i++) {
    const part = message.parts[i];
    if (part.type === "dynamic-tool" && part.toolCallId === toolResult.tool_use_id) {
      const updated: DynamicToolUIPart = {
        type: "dynamic-tool",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        state: "output-available",
        input: part.input,
        output: resultText,
      };
      message.parts[i] = updated;
      break;
    }
  }
  return message.parts;
}
