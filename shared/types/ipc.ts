export interface IpcErrorInfo {
  code: string;
  message: string;
}

export type IpcResponse<T = unknown> = { ok: true; data: T } | { ok: false; error: IpcErrorInfo };

// Stream message types sent over MessagePort
export type StreamMessage<T = unknown> =
  | { type: "chunk"; data: T }
  | { type: "done"; data: { totalTokens: number } }
  | { type: "error"; data: IpcErrorInfo };

export interface StreamChunkData {
  content: string;
  tokenCount: number;
}

// Event push message type for ipcRenderer.on subscriptions
export interface EventMessage<T = unknown> {
  type: string;
  payload: T;
}
