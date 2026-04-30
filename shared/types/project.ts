export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  lastOpenedAt: Date;
  pathMissing?: boolean;
}

export interface ProjectMeta {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  lastOpenedAt: string;
}

export interface RecentProject {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  lastOpenedAt: Date;
  pathMissing?: boolean;
}

export type ProjectTemplate = "empty" | "git";

export interface CreateProjectForm {
  name: string;
  path: string;
  template: ProjectTemplate;
  gitUrl?: string;
}
