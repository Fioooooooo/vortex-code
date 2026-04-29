import { ipcMain, MessageChannelMain } from "electron";
import { ChatChannels, ChatStreamChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";
import { AcpSession } from "../chat-agent/acp-session";
import { loadSessionMeta, appendMessage } from "../chat-agent/session-store";
import type { SessionEvent } from "../chat-agent/types";
import type { MessageChunkData } from "@shared/types/ipc";
import type { Message } from "@shared/types/chat";
import logger from "@main/utils/logger";

// Active sessions: fylloSessionId → AcpSession
const activeSessions = new Map<string, AcpSession>();

// Fallback project path until project persistence is implemented
const FALLBACK_PROJECT_PATH = "dev-fallback";

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

  ipcMain.handle(
    ChatChannels.persistMessage,
    (_event, input: { sessionId: string; message: Message }) =>
      wrapHandler(async () => {
        logger.debug(
          `[chat] persistMessage sessionId=${input.sessionId} role=${input.message.role} parts=${input.message.parts.length}`
        );
        await appendMessage(FALLBACK_PROJECT_PATH, input.sessionId, input.message);
        logger.debug(`[chat] persistMessage done`);
      })
  );

  // Streaming: create MessagePort and push chunks via port1
  ipcMain.handle(
    ChatStreamChannels.streamMessage,
    async (
      event,
      input: { sessionId: string; projectId: string; agentId: string; prompt: string }
    ) => {
      const { port1, port2 } = new MessageChannelMain();
      event.sender.postMessage(ChatStreamChannels.streamPort, null, [port2]);

      const { sessionId, projectId, agentId: inputAgentId, prompt } = input;
      void projectId;

      const cwd = process.cwd();
      const projectPath = FALLBACK_PROJECT_PATH;

      const meta = await loadSessionMeta(projectPath, sessionId);
      const agentId = inputAgentId || meta?.agentId || "claude-acp";

      const session = new AcpSession({ fylloSessionId: sessionId, agentId, projectPath, cwd });
      activeSessions.set(sessionId, session);

      const sendChunk = (data: MessageChunkData): void => {
        port1.postMessage({ type: "chunk", data });
      };

      session.on("event", (ev: SessionEvent) => {
        switch (ev.type) {
          case "session_id_resolved":
            // Already persisted inside AcpSession
            break;
          case "text_delta":
            sendChunk({ kind: "text_delta", text: ev.text });
            break;
          case "tool_call_start":
            sendChunk({
              kind: "tool_call_start",
              toolCallId: ev.toolCallId,
              toolName: ev.toolName,
              toolKind: ev.kind,
            });
            break;
          case "tool_call_update":
            sendChunk({
              kind: "tool_call_update",
              toolCallId: ev.toolCallId,
              status: ev.status,
              input: ev.input
                ? (JSON.parse(JSON.stringify(ev.input)) as Record<string, unknown>)
                : undefined,
              content: ev.content,
            });
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

      // Wait for renderer to signal ready before starting
      port1.once("message", (msg) => {
        if ((msg.data as { type: string }).type === "ready") {
          session.start(prompt).catch((err: unknown) => {
            port1.postMessage({
              type: "error",
              data: { code: "ACP_ERROR", message: String(err) },
            });
            port1.close();
            activeSessions.delete(sessionId);
          });
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
