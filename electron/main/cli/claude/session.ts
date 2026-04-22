import { EventEmitter } from "events";
import type { ChildProcess } from "child_process";
import type { Message } from "@shared/types/chat";
import type { SessionEvent } from "./types";
import { parseLine } from "./parser";
import { mapAssistantMessage, applyToolResult } from "./mapper";
import { spawnClaude } from "./process";

export interface ClaudeSessionOpts {
  sessionId: string;
  prompt: string;
  cwd: string;
  claudeSessionId?: string;
}

export class ClaudeSession extends EventEmitter {
  private child: ChildProcess | null = null;
  private messageMap = new Map<string, Message>();
  private toolResultBuffer = new Map<string, string>();
  private sessionIdResolved = false;

  constructor(private readonly opts: ClaudeSessionOpts) {
    super();
  }

  start(): void {
    this.child = spawnClaude({
      prompt: this.opts.prompt,
      cwd: this.opts.cwd,
      claudeSessionId: this.opts.claudeSessionId,
      onLine: (line) => this.handleLine(line),
      onClose: (code) => this.handleClose(code),
      onError: (err) => this.handleSpawnError(err),
    });
  }

  cancel(): void {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
  }

  private handleLine(line: string): void {
    const raw = parseLine(line);
    if (!raw) return;

    if (raw.type === "system") {
      if (!this.sessionIdResolved && raw.session_id) {
        this.sessionIdResolved = true;
        this.emit("session_id_resolved", {
          type: "session_id_resolved",
          claudeSessionId: raw.session_id,
        } satisfies SessionEvent);
      }
      return;
    }

    if (raw.type === "stream_event") {
      const ev = raw.event;
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) {
        this.emit("event", { type: "text_delta", text: ev.delta.text } satisfies SessionEvent);
      }
      return;
    }

    if (raw.type === "assistant") {
      const message = mapAssistantMessage(raw, this.opts.sessionId, this.toolResultBuffer);
      this.messageMap.set(message.id, message);
      this.emit("event", { type: "message_upsert", message } satisfies SessionEvent);
      return;
    }

    if (raw.type === "user") {
      for (const block of raw.message.content) {
        if (block.type !== "tool_result") continue;

        const resultText =
          typeof block.content === "string"
            ? block.content
            : block.content.map((c) => (c.type === "text" ? (c.text ?? "") : "")).join("");

        // Find the assistant message that owns this tool call
        let found = false;
        for (const [, msg] of this.messageMap) {
          const hasTool = msg.parts.some(
            (p) => p.type === "dynamic-tool" && p.toolCallId === block.tool_use_id
          );
          if (hasTool) {
            const updatedParts = applyToolResult(msg, block);
            this.emit("event", {
              type: "message_patch",
              id: msg.id,
              parts: updatedParts,
            } satisfies SessionEvent);
            found = true;
            break;
          }
        }

        if (!found) {
          // Buffer for when assistant message arrives later
          this.toolResultBuffer.set(block.tool_use_id, resultText);
        }
      }
      return;
    }

    if (raw.type === "result") {
      if (raw.subtype === "success") {
        const totalTokens = raw.usage?.output_tokens ?? 0;
        this.emit("event", { type: "done", totalTokens } satisfies SessionEvent);
      } else {
        this.emit("event", {
          type: "error",
          code: "CLAUDE_ERROR",
          message: raw.result ?? "Claude CLI returned an error",
        } satisfies SessionEvent);
      }
    }
  }

  private handleClose(code: number | null): void {
    // If process exits without a result line, emit done
    if (code !== null && code !== 0) {
      this.emit("event", {
        type: "error",
        code: "CLAUDE_EXIT",
        message: `Claude CLI exited with code ${code}`,
      } satisfies SessionEvent);
    }
  }

  private handleSpawnError(err: Error & { code?: string }): void {
    if (err.code === "ENOENT") {
      this.emit("event", {
        type: "error",
        code: "CLAUDE_NOT_FOUND",
        message: "claude command not found. Please install Claude CLI and ensure it is in PATH.",
      } satisfies SessionEvent);
    } else {
      this.emit("event", {
        type: "error",
        code: "SPAWN_ERROR",
        message: err.message,
      } satisfies SessionEvent);
    }
  }
}
