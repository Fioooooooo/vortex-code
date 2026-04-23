import { ipcMain, MessageChannelMain } from "electron";
import { ChatChannels, ChatStreamChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";
import { ClaudeSession } from "../cli/claude/session";
import { getClaudeSessionId, setClaudeSessionId } from "../cli/claude/session-map";
import type { SessionEvent } from "../cli/claude/types";
import type { MessageChunkData } from "@shared/types/ipc";

// Active sessions: fylloSessionId → ClaudeSession
const activeSessions = new Map<string, ClaudeSession>();

export function registerChatHandlers(): void {
  ipcMain.handle(
    ChatChannels.listSessions,
    (_event, query: { projectId: string; page?: number; limit?: number }) =>
      wrapHandler(async () => {
        void query;
        return [];
      })
  );

  ipcMain.handle(ChatChannels.getSession, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
      return null;
    })
  );

  ipcMain.handle(
    ChatChannels.createSession,
    (_event, input: { projectId: string; title: string }) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  ipcMain.handle(
    ChatChannels.updateSession,
    (_event, { id, patch }: { id: string; patch: Record<string, unknown> }) =>
      wrapHandler(async () => {
        void id;
        void patch;
        return null;
      })
  );

  ipcMain.handle(ChatChannels.removeSession, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      void id;
    })
  );

  ipcMain.handle(
    ChatChannels.sendMessage,
    (_event, input: { sessionId: string; content: string }) =>
      wrapHandler(async () => {
        void input;
        return null;
      })
  );

  // Streaming: create MessagePort and push chunks via port1
  ipcMain.handle(
    ChatStreamChannels.streamMessage,
    async (event, input: { sessionId: string; projectId: string; prompt: string }) => {
      const { port1, port2 } = new MessageChannelMain();

      // Transfer port2 to renderer
      event.sender.postMessage(ChatStreamChannels.streamPort, null, [port2]);

      const { sessionId, projectId, prompt } = input;

      // Resolve cwd from projectId — currently TODO (project store not implemented)
      // Fall back to process.cwd() until project persistence is available
      void projectId;
      const cwd = process.cwd();

      const claudeSessionId = getClaudeSessionId(sessionId);

      const session = new ClaudeSession({ sessionId, prompt, cwd, claudeSessionId });
      activeSessions.set(sessionId, session);

      const sendChunk = (data: MessageChunkData): void => {
        port1.postMessage({ type: "chunk", data });
      };

      session.on("session_id_resolved", (ev: SessionEvent) => {
        if (ev.type === "session_id_resolved") {
          setClaudeSessionId(sessionId, ev.claudeSessionId);
        }
      });

      session.on("event", (ev: SessionEvent) => {
        switch (ev.type) {
          case "text_delta":
            sendChunk({ kind: "text_delta", text: ev.text });
            break;
          case "message_upsert":
            sendChunk({ kind: "message_upsert", message: ev.message });
            break;
          case "message_patch":
            sendChunk({ kind: "message_patch", id: ev.id, parts: ev.parts });
            break;
          case "done":
            port1.postMessage({ type: "done", data: { totalTokens: ev.totalTokens } });
            port1.close();
            activeSessions.delete(sessionId);
            break;
          case "error":
            port1.postMessage({ type: "error", data: { code: ev.code, message: ev.message } });
            port1.close();
            activeSessions.delete(sessionId);
            break;
        }
      });

      // Wait for renderer to signal ready before starting, so no chunks are
      // buffered in the port queue before onmessage is registered.
      port1.once("message", (msg) => {
        if ((msg.data as { type: string }).type === "ready") {
          try {
            session.start();
          } catch (err: unknown) {
            const e = err as Error & { code?: string };
            if (e.code === "ENOENT") {
              port1.postMessage({
                type: "error",
                data: {
                  code: "CLAUDE_NOT_FOUND",
                  message:
                    "claude command not found. Please install Claude CLI and ensure it is in PATH.",
                },
              });
              port1.close();
              activeSessions.delete(sessionId);
            } else {
              throw err;
            }
          }
        }
      });
      port1.start();

      return { ok: true, data: null };
    }
  );

  ipcMain.handle(ChatStreamChannels.streamCancel, (_event, { sessionId }: { sessionId: string }) =>
    wrapHandler(async () => {
      const session = activeSessions.get(sessionId);
      if (session) {
        session.cancel();
        activeSessions.delete(sessionId);
      }
    })
  );
}
