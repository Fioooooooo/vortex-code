import type { UIMessage, ChatStatus } from "ai";
import type { ChatAgent } from "./chat-agent";

export type { ChatStatus };
export type ModeType = "auto" | "manual";
export type SidebarTab = "sessions";

export interface MessageMeta {
  sessionId: string;
  createdAt: Date;
}

export type Message = UIMessage<MessageMeta>;

export interface Session {
  id: string;
  projectId: string;
  title: string;
  status: "running" | "ended";
  turnCount: number;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  estimatedCost: string;
}

export type ProjectAgent = ChatAgent;
