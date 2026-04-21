import type { IpcResponse } from "@shared/types/ipc";

export async function wrapHandler<T>(fn: () => Promise<T> | T): Promise<IpcResponse<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const code = (err as { code?: string }).code ?? "UNKNOWN_ERROR";
    return { ok: false, error: { code, message: error.message } };
  }
}
