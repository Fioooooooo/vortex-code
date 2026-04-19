export type AgentType = "claude-code" | "codex";
export type AgentStatus = "idle" | "thinking" | "executing" | "awaiting-confirmation";
export type FileChangeType = "added" | "modified" | "deleted";
export type DiffLineType = "added" | "removed" | "context";
export type ModeType = "auto" | "manual";
export type SidebarTab = "sessions" | "files";
export type DiffViewMode = "side-by-side" | "inline";

export interface Attachment {
  id: string;
  type: "image" | "file";
  name: string;
  url?: string;
}

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

export interface BaseMessage {
  id: string;
  sessionId: string;
  type: MessageType;
  createdAt: Date;
}

export interface UserMessage extends BaseMessage {
  type: "user";
  content: string;
  attachments?: Attachment[];
}

export interface ThinkingMessage extends BaseMessage {
  type: "thinking";
  summary: string;
  content: string;
}

export interface FileOpMessage extends BaseMessage {
  type: "file-op";
  operations: FileChange[];
}

export interface CommandMessage extends BaseMessage {
  type: "command";
  command: string;
  output: string;
  success: boolean;
}

export interface ConfirmMessage extends BaseMessage {
  type: "confirm";
  description: string;
  action: string;
  resolved: boolean;
  allowed?: boolean;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

export type Message = UserMessage | ThinkingMessage | FileOpMessage | CommandMessage | ConfirmMessage | TextMessage;
export type MessageType = Message["type"];

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
