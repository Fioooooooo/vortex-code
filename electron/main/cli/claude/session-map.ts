/** In-memory map: FylloCode sessionId → Claude sessionId */
const sessionMap = new Map<string, string>();

export function getClaudeSessionId(fylloSessionId: string): string | undefined {
  return sessionMap.get(fylloSessionId);
}

export function setClaudeSessionId(fylloSessionId: string, claudeSessionId: string): void {
  if (!sessionMap.has(fylloSessionId)) {
    sessionMap.set(fylloSessionId, claudeSessionId);
  }
}
