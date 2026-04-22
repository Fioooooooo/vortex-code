// Raw line types from Claude CLI NDJSON output

export interface ClaudeSystemLine {
  type: "system";
  subtype: "hook_started" | "init" | string;
  session_id?: string;
  [key: string]: unknown;
}

export interface ClaudeTextBlock {
  type: "text";
  text: string;
}

export interface ClaudeToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ClaudeToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string | Array<{ type: string; text?: string }>;
}

export interface ClaudeAssistantMessage {
  type: "assistant";
  message: {
    id: string;
    content: Array<ClaudeTextBlock | ClaudeToolUseBlock>;
    usage?: ClaudeUsage;
  };
}

export interface ClaudeUserMessage {
  type: "user";
  message: {
    content: Array<ClaudeToolResultBlock>;
  };
}

export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ClaudeResultLine {
  type: "result";
  subtype: "success" | "error";
  result?: string;
  usage?: ClaudeUsage;
  cost_usd?: number;
}

export interface ClaudeStreamEventLine {
  type: "stream_event";
  event: {
    type: string;
    index?: number;
    delta?: {
      type: string;
      text?: string;
    };
  };
}

export type ClaudeRawLine =
  | ClaudeSystemLine
  | ClaudeAssistantMessage
  | ClaudeUserMessage
  | ClaudeResultLine
  | ClaudeStreamEventLine;

// Session events emitted by ClaudeSession
export type SessionEvent =
  | { type: "text_delta"; text: string }
  | { type: "message_upsert"; message: import("@shared/types/chat").Message }
  | { type: "message_patch"; id: string; parts: import("@shared/types/chat").Message["parts"] }
  | { type: "done"; totalTokens: number }
  | { type: "error"; code: string; message: string }
  | { type: "session_id_resolved"; claudeSessionId: string };
