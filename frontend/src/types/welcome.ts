import type { RecentProject } from "@shared/types/project";

export interface WelcomeState {
  showCreateProjectModal: boolean;
}

export interface WelcomeActions {
  recentProjects?: RecentProject[];
  toggleCreateProjectModal: (show: boolean) => void;
}
