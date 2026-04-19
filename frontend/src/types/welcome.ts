import type { RecentProject } from "./project";

export interface WelcomeState {
  showCreateProjectModal: boolean;
}

export interface WelcomeActions {
  recentProjects?: RecentProject[];
  toggleCreateProjectModal: (show: boolean) => void;
}
