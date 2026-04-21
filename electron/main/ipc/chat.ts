import { ipcMain, MessageChannelMain } from "electron";
import { ChatChannels, ChatStreamChannels } from "@shared/types/channels";
import { wrapHandler } from "./utils";

export function registerChatHandlers(): void {
  ipcMain.handle(
    ChatChannels.listSessions,
    (_event, query: { projectId: string; page?: number; limit?: number }) =>
      wrapHandler(async () => {
        // TODO: implement session listing
        void query;
        return [];
      })
  );

  ipcMain.handle(ChatChannels.getSession, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      // TODO: implement session retrieval
      void id;
      return null;
    })
  );

  ipcMain.handle(
    ChatChannels.createSession,
    (_event, input: { projectId: string; title: string }) =>
      wrapHandler(async () => {
        // TODO: implement session creation
        void input;
        return null;
      })
  );

  ipcMain.handle(
    ChatChannels.updateSession,
    (_event, { id, patch }: { id: string; patch: Record<string, unknown> }) =>
      wrapHandler(async () => {
        // TODO: implement session update
        void id;
        void patch;
        return null;
      })
  );

  ipcMain.handle(ChatChannels.removeSession, (_event, { id }: { id: string }) =>
    wrapHandler(async () => {
      // TODO: implement session removal
      void id;
    })
  );

  ipcMain.handle(
    ChatChannels.sendMessage,
    (_event, input: { sessionId: string; content: string }) =>
      wrapHandler(async () => {
        // TODO: implement message sending (non-streaming)
        void input;
        return null;
      })
  );

  // Streaming: create MessagePort and push chunks via port1
  ipcMain.handle(
    ChatStreamChannels.streamMessage,
    async (event, input: { sessionId: string; prompt: string }) => {
      const { port1, port2 } = new MessageChannelMain();

      // Transfer port2 to renderer
      event.sender.postMessage(ChatStreamChannels.streamPort, null, [port2]);

      // TODO: replace with real AI streaming call
      void input;
      setImmediate(() => {
        port1.postMessage({ type: "chunk", data: { content: "Hello ", tokenCount: 1 } });
        port1.postMessage({ type: "chunk", data: { content: "world!", tokenCount: 1 } });
        port1.postMessage({ type: "done", data: { totalTokens: 2 } });
        port1.close();
      });

      return { ok: true, data: null };
    }
  );

  ipcMain.handle(ChatStreamChannels.streamCancel, (_event, { sessionId }: { sessionId: string }) =>
    wrapHandler(async () => {
      // TODO: cancel in-flight AI request
      void sessionId;
    })
  );
}
