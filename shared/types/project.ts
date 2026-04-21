export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: Date;
}

export interface ProjectAgent {
  id: string;
  name: string;
  type: "claude-code" | "codex";
}

export interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: Date;
}

export interface ProjectSummary extends ProjectInfo {
  agent: ProjectAgent;
}

export type ProjectTemplate = "empty" | "git";

export interface CreateProjectForm {
  name: string;
  path: string;
  template: ProjectTemplate;
  gitUrl?: string;
}
