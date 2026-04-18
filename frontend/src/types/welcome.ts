import type { RecentProject, CreateProjectForm, ProjectInfo } from "./project";

export interface WelcomeState {
  recentProjects: RecentProject[];
  showCreateProjectModal: boolean;
}

export interface WelcomeActions {
  openFolder: () => Promise<ProjectInfo | null>;
  createProject: (form: CreateProjectForm) => Promise<ProjectInfo>;
  openRecentProject: (project: RecentProject) => void;
  removeRecentProject: (projectId: string) => void;
  toggleCreateProjectModal: (show: boolean) => void;
}
