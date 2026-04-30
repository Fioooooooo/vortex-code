import { ipcMain, MessageChannelMain } from "electron";
import { ChatChannels, ChatStreamChannels } from "@shared/types/channels";
import type { Message, Session } from "@shared/types/chat";
import type { MessageChunkData } from "@shared/types/ipc";
import { wrapHandler } from "./utils";
import { AcpSession } from "../chat-agent/acp-session";
import {
  appendMessage,
  deleteSession,
  listSessionMetas,
  loadMessages as loadPersistedMessages,
  loadSessionMeta,
  saveSessionMeta,
  type SessionMeta,
} from "../chat-agent/session-store";
import { loadProject } from "@main/services/project-store";
import type { SessionEvent } from "../chat-agent/types";
import logger from "@main/utils/logger";

// Active sessions: fylloSessionId → AcpSession
const activeSessions = new Map<string, AcpSession>();

type SessionPatch = Partial<Pick<Session, "title" | "agentId">>;

async function resolveProjectPath(projectId: string): Promise<string> {
  const project = await loadProject(projectId);
  if (!project) {
    const error = new Error(`Project not found: ${projectId}`);
    (error as Error & { code?: string }).code = "PROJECT_NOT_FOUND";
    throw error;
  }

  return project.path;
}

function toSession(meta: SessionMeta, projectId: string): Session {
  return {
    id: meta.sessionId,
    projectId,
    agentId: meta.agentId,
    title: meta.title,
    status: "ended",
    turnCount: meta.turnCount,
    createdAt: new Date(meta.createdAt),
    updatedAt: new Date(meta.updatedAt),
    messages: [],
  };
}

function createSessionError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

export function registerChatHandlers(): void {
  ipcMain.handle(
    ChatChannels.listSessions,
    (_event, query: { projectId: string; page?: number; limit?: number }) =>
      wrapHandler(async () => {
        const projectPath = await resolveProjectPath(query.projectId);
        const metas = await listSessionMetas(projectPath);

        void query.page;
        void query.limit;

        return metas
          .sort(
            (left, right) =>
              new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
          )
          .map((meta) => toSession(meta, query.projectId));
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
    (_event, input: { projectId: string; title: string; agentId?: string }) =>
      wrapHandler(async () => {
        const projectPath = await resolveProjectPath(input.projectId);
        const now = new Date();
        const meta: SessionMeta = {
          sessionId: `session-${now.getTime()}`,
          agentId: input.agentId ?? "claude-acp",
          title: input.title,
          turnCount: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        await saveSessionMeta(projectPath, meta);
        return toSession(meta, input.projectId);
      })
  );

  ipcMain.handle(
    ChatChannels.updateSession,
    (_event, { id, patch, projectId }: { id: string; patch: SessionPatch; projectId: string }) =>
      wrapHandler(async () => {
        const projectPath = await resolveProjectPath(projectId);
        const meta = await loadSessionMeta(projectPath, id);
        if (!meta) {
          throw createSessionError("SESSION_NOT_FOUND", `Session not found: ${id}`);
        }

        const nextMeta: SessionMeta = {
          ...meta,
          title: patch.title ?? meta.title,
          agentId: patch.agentId ?? meta.agentId,
          updatedAt: new Date().toISOString(),
        };

        await saveSessionMeta(projectPath, nextMeta);
        return toSession(nextMeta, projectId);
      })
  );

  ipcMain.handle(
    ChatChannels.removeSession,
    (_event, { id, projectId }: { id: string; projectId: string }) =>
      wrapHandler(async () => {
        const projectPath = await resolveProjectPath(projectId);
        await deleteSession(projectPath, id);
      })
  );

  ipcMain.handle(
    ChatChannels.loadMessages,
    (_event, { sessionId, projectId }: { sessionId: string; projectId: string }) =>
      wrapHandler(async () => {
        const projectPath = await resolveProjectPath(projectId);
        return loadPersistedMessages(projectPath, sessionId);
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
    (_event, input: { sessionId: string; projectId: string; message: Message }) =>
      wrapHandler(async () => {
        logger.debug(
          `[chat] persistMessage sessionId=${input.sessionId} role=${input.message.role} parts=${input.message.parts.length}`
        );
        const projectPath = await resolveProjectPath(input.projectId);
        await appendMessage(projectPath, input.sessionId, input.message);
        logger.debug("[chat] persistMessage done");
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
      const projectPath = await resolveProjectPath(projectId);
      const cwd = projectPath;

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
              title: ev.title,
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
          case "session_info_update":
            void (async () => {
              const currentMeta = await loadSessionMeta(projectPath, sessionId);
              if (currentMeta) {
                await saveSessionMeta(projectPath, {
                  ...currentMeta,
                  title: ev.title,
                  updatedAt: new Date().toISOString(),
                });
              }

              sendChunk({ kind: "session_info_update", title: ev.title });
            })().catch((error: unknown) => {
              logger.error("[chat] failed to persist session title update", error);
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
