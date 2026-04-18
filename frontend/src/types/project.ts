export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: Date;
}

export interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: Date;
}

export type ProjectTemplate = "empty" | "git";

export interface CreateProjectForm {
  name: string;
  path: string;
  template: ProjectTemplate;
  gitUrl?: string;
}
