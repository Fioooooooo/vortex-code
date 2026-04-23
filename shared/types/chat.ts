import type { UIMessage, ChatStatus } from "ai";

export type { ChatStatus };
export type AgentType = "claude-code" | "codex";
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

export interface AgentInfo {
  type: AgentType;
  name: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  estimatedCost: string;
}

export interface ProjectAgent {
  id: string;
  name: string;
  type: AgentType;
}

export interface ProjectSummary {
  id: string;
  name: string;
  agent: ProjectAgent;
}
