import type { ClaudeRawLine } from "./types";

/**
 * Parse a single NDJSON line from Claude CLI stdout.
 * Returns null for empty lines or lines that cannot be parsed as JSON.
 */
export function parseLine(line: string): ClaudeRawLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as ClaudeRawLine;
  } catch {
    return null;
  }
}
