import type { UIMessage } from "ai";

export type AgentType = "claude-code" | "codex";
export type AgentStatus = "idle" | "thinking" | "executing" | "awaiting-confirmation";
export type FileChangeType = "added" | "modified" | "deleted";
export type DiffLineType = "added" | "removed" | "context";
export type ModeType = "auto" | "manual";
export type SidebarTab = "sessions" | "files";
export type DiffViewMode = "side-by-side" | "inline";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileChange {
  filePath: string;
  changeType: FileChangeType;
  summary: string;
  diffLines: DiffLine[];
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  changeType?: FileChangeType;
}

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
  fileChanges: FileChange[];
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
