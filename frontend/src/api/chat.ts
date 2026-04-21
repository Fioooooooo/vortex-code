import type { IpcResponse, StreamChunkData } from "@shared/types/ipc";
import type { Session, Message } from "@shared/types/chat";

export interface StreamCallbacks {
  onChunk: (data: StreamChunkData) => void;
  onDone: (data: { totalTokens: number }) => void;
  onError: (error: { code: string; message: string }) => void;
}

export const chatApi = {
  listSessions(query: {
    projectId: string;
    page?: number;
    limit?: number;
  }): Promise<IpcResponse<Session[]>> {
    return window.api.chat.listSessions(query);
  },

  getSession(id: string): Promise<IpcResponse<Session | null>> {
    return window.api.chat.getSession(id);
  },

  createSession(input: { projectId: string; title: string }): Promise<IpcResponse<Session>> {
    return window.api.chat.createSession(input);
  },

  updateSession(id: string, patch: Partial<Session>): Promise<IpcResponse<Session>> {
    return window.api.chat.updateSession(id, patch);
  },

  removeSession(id: string): Promise<IpcResponse<void>> {
    return window.api.chat.removeSession(id);
  },

  sendMessage(input: { sessionId: string; content: string }): Promise<IpcResponse<Message>> {
    return window.api.chat.sendMessage(input);
  },

  streamMessage(sessionId: string, prompt: string, callbacks: StreamCallbacks): () => void {
    return window.api.chat.streamMessage(sessionId, prompt, callbacks);
  },
};
