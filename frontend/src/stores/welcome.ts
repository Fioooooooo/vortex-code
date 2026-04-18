import { ref } from "vue";
import { defineStore } from "pinia";
import { useProjectStore } from "./project";
import type { RecentProject, CreateProjectForm, ProjectInfo } from "@renderer/types/project";

function generateMockRecentProjects(): RecentProject[] {
  const now = new Date();
  return [
    {
      id: "1",
      name: "vortex-code-frontend",
      path: "~/projects/vortex-code-frontend",
      lastOpenedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      name: "design-system",
      path: "~/work/design-system",
      lastOpenedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: "3",
      name: "api-gateway",
      path: "~/projects/api-gateway",
      lastOpenedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: "4",
      name: "mobile-app-react-native",
      path: "~/projects/mobile-app",
      lastOpenedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "5",
      name: "data-pipeline",
      path: "~/work/data-pipeline",
      lastOpenedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "6",
      name: "personal-blog",
      path: "~/projects/blog",
      lastOpenedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "7",
      name: "ecommerce-platform",
      path: "~/work/ecommerce",
      lastOpenedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "8",
      name: "ml-model-trainer",
      path: "~/projects/ml-trainer",
      lastOpenedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  ];
}

export const useWelcomeStore = defineStore("welcome", () => {
  const showCreateProjectModal = ref(false);
  const recentProjects = ref<RecentProject[]>(generateMockRecentProjects());

  function toggleCreateProjectModal(show: boolean): void {
    showCreateProjectModal.value = show;
  }

  async function openFolder(): Promise<ProjectInfo | null> {
    // Mock: simulate directory selection dialog
    return new Promise((resolve) => {
      setTimeout(() => {
        const project: ProjectInfo = {
          id: `folder-${Date.now()}`,
          name: "opened-folder",
          path: "/home/user/projects/opened-folder",
          lastOpenedAt: new Date(),
        };
        const projectStore = useProjectStore();
        projectStore.setCurrentProject(project);
        resolve(project);
      }, 500);
    });
  }

  async function createProject(form: CreateProjectForm): Promise<ProjectInfo> {
    // Mock: simulate project creation
    return new Promise((resolve) => {
      setTimeout(() => {
        const project: ProjectInfo = {
          id: `project-${Date.now()}`,
          name: form.name,
          path: `${form.path}/${form.name}`,
          lastOpenedAt: new Date(),
        };
        const projectStore = useProjectStore();
        projectStore.setCurrentProject(project);

        // Add to recent projects
        recentProjects.value.unshift({
          id: project.id,
          name: project.name,
          path: project.path,
          lastOpenedAt: project.lastOpenedAt,
        });

        showCreateProjectModal.value = false;
        resolve(project);
      }, 800);
    });
  }

  function openRecentProject(project: RecentProject): void {
    const projectStore = useProjectStore();
    projectStore.setCurrentProject({
      id: project.id,
      name: project.name,
      path: project.path,
      lastOpenedAt: new Date(),
    });

    // Update last opened time in recent list
    const idx = recentProjects.value.findIndex((p) => p.id === project.id);
    if (idx !== -1) {
      recentProjects.value[idx].lastOpenedAt = new Date();
    }
  }

  function removeRecentProject(projectId: string): void {
    recentProjects.value = recentProjects.value.filter((p) => p.id !== projectId);
  }

  return {
    showCreateProjectModal,
    recentProjects,
    toggleCreateProjectModal,
    openFolder,
    createProject,
    openRecentProject,
    removeRecentProject,
  };
});
