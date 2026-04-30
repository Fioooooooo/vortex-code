import { ipcRenderer } from "electron";
import type { IpcResponse, MessageChunkData } from "@shared/types/ipc";
import { ChatChannels, ChatStreamChannels } from "@shared/types/channels";
import type { Session, Message } from "@shared/types/chat";
export interface StreamCallbacks {
  onChunk: (data: MessageChunkData) => void;
  onDone: (data: { totalTokens: number }) => void;
  onError: (error: { code: string; message: string }) => void;
}

export const chatApi = {
  listSessions(query: {
    projectId: string;
    page?: number;
    limit?: number;
  }): Promise<IpcResponse<Session[]>> {
    return ipcRenderer.invoke(ChatChannels.listSessions, query);
  },

  getSession(id: string): Promise<IpcResponse<Session | null>> {
    return ipcRenderer.invoke(ChatChannels.getSession, { id });
  },

  createSession(input: { projectId: string; title: string }): Promise<IpcResponse<Session>> {
    return ipcRenderer.invoke(ChatChannels.createSession, input);
  },

  updateSession(id: string, patch: Partial<Session>): Promise<IpcResponse<Session>> {
    return ipcRenderer.invoke(ChatChannels.updateSession, { id, patch });
  },

  removeSession(id: string): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(ChatChannels.removeSession, { id });
  },

  sendMessage(input: { sessionId: string; content: string }): Promise<IpcResponse<Message>> {
    return ipcRenderer.invoke(ChatChannels.sendMessage, input);
  },

  persistMessage(
    sessionId: string,
    projectId: string,
    message: Message
  ): Promise<IpcResponse<void>> {
    return ipcRenderer.invoke(ChatChannels.persistMessage, { sessionId, projectId, message });
  },

  streamMessage(
    sessionId: string,
    projectId: string,
    agentId: string,
    prompt: string,
    callbacks: StreamCallbacks
  ): () => void {
    // Invoke to trigger main to create MessagePort and start streaming
    void ipcRenderer
      .invoke(ChatStreamChannels.streamMessage, { sessionId, projectId, agentId, prompt })
      .catch((error: unknown) => {
        callbacks.onError({
          code: "STREAM_INIT_FAILED",
          message: error instanceof Error ? error.message : String(error),
        });
      });

    // Receive the port from main
    ipcRenderer.once(ChatStreamChannels.streamPort, (event) => {
      const port = event.ports[0];
      port.onmessage = ({ data }) => {
        if (data.type === "chunk") callbacks.onChunk(data.data);
        else if (data.type === "done") callbacks.onDone(data.data);
        else if (data.type === "error") callbacks.onError(data.data);
      };
      port.start();
      // Signal main that onmessage is registered and we're ready to receive chunks
      port.postMessage({ type: "ready" });
    });

    return () => {
      ipcRenderer.invoke(ChatStreamChannels.streamCancel, { sessionId });
    };
  },
};
