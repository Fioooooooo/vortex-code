import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type {
  CreateProjectForm,
  ProjectInfo,
  ProjectSummary,
  RecentProject,
} from "@shared/types/project";

function generateMockRecentProjects(): RecentProject[] {
  const now = new Date();
  return [
    {
      id: "project-1",
      name: "vortex-code-frontend",
      path: "~/projects/vortex-code-frontend",
      lastOpenedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: "project-2",
      name: "design-system",
      path: "~/work/design-system",
      lastOpenedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: "project-3",
      name: "api-gateway",
      path: "~/projects/api-gateway",
      lastOpenedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: "project-4",
      name: "mobile-app-react-native",
      path: "~/projects/mobile-app",
      lastOpenedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  ];
}

function generateMockProjectSummaries(): ProjectSummary[] {
  return [
    {
      id: "project-1",
      name: "vortex-code-frontend",
      path: "~/projects/vortex-code-frontend",
      lastOpenedAt: new Date(),
      agent: { id: "agent-1", name: "Claude Code", type: "claude-code" },
    },
    {
      id: "project-2",
      name: "design-system",
      path: "~/work/design-system",
      lastOpenedAt: new Date(),
      agent: { id: "agent-2", name: "Codex", type: "codex" },
    },
    {
      id: "project-3",
      name: "api-gateway",
      path: "~/projects/api-gateway",
      lastOpenedAt: new Date(),
      agent: { id: "agent-3", name: "Claude Code", type: "claude-code" },
    },
  ];
}

export const useProjectStore = defineStore("project", () => {
  const recentProjects = ref<RecentProject[]>(generateMockRecentProjects());
  const projects = ref<ProjectSummary[]>(generateMockProjectSummaries());
  const currentProject = ref<ProjectInfo | null>(null);
  const hasCurrentProject = computed(() => currentProject.value !== null);

  function setCurrentProject(project: ProjectInfo | null): void {
    currentProject.value = project;
  }

  function upsertProject(project: ProjectInfo): void {
    const existingProject = projects.value.find((item) => item.id === project.id);
    if (existingProject) {
      existingProject.name = project.name;
      existingProject.path = project.path;
      existingProject.lastOpenedAt = project.lastOpenedAt;
    } else {
      projects.value.unshift({
        ...project,
        agent: { id: `agent-${project.id}`, name: "Claude Code", type: "claude-code" },
      });
    }
  }

  function upsertRecentProject(project: ProjectInfo): void {
    const existingProject = recentProjects.value.find((item) => item.id === project.id);
    if (existingProject) {
      existingProject.name = project.name;
      existingProject.path = project.path;
      existingProject.lastOpenedAt = project.lastOpenedAt;
      recentProjects.value = [
        existingProject,
        ...recentProjects.value.filter((item) => item.id !== project.id),
      ];
      return;
    }

    recentProjects.value.unshift({
      id: project.id,
      name: project.name,
      path: project.path,
      lastOpenedAt: project.lastOpenedAt,
    });
  }

  function activateProject(project: ProjectInfo): ProjectInfo {
    setCurrentProject(project);
    upsertProject(project);
    upsertRecentProject(project);
    return project;
  }

  function clearCurrentProject(): void {
    currentProject.value = null;
  }

  async function openFolder(): Promise<ProjectInfo> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const project: ProjectInfo = {
          id: `folder-${Date.now()}`,
          name: "opened-folder",
          path: "/home/user/projects/opened-folder",
          lastOpenedAt: new Date(),
        };
        resolve(activateProject(project));
      }, 500);
    });
  }

  async function createProject(form: CreateProjectForm): Promise<ProjectInfo> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const project: ProjectInfo = {
          id: `project-${Date.now()}`,
          name: form.name,
          path: `${form.path}/${form.name}`,
          lastOpenedAt: new Date(),
        };
        resolve(activateProject(project));
      }, 800);
    });
  }

  function openRecentProject(project: RecentProject): ProjectInfo {
    return activateProject({
      id: project.id,
      name: project.name,
      path: project.path,
      lastOpenedAt: new Date(),
    });
  }

  function switchProject(projectId: string): void {
    const project = projects.value.find((item) => item.id === projectId);
    if (!project) return;

    activateProject({
      id: project.id,
      name: project.name,
      path: project.path,
      lastOpenedAt: new Date(),
    });
  }

  function removeRecentProject(projectId: string): void {
    recentProjects.value = recentProjects.value.filter((project) => project.id !== projectId);
  }

  return {
    projects,
    recentProjects,
    currentProject,
    hasCurrentProject,
    setCurrentProject,
    clearCurrentProject,
    openFolder,
    createProject,
    openRecentProject,
    switchProject,
    removeRecentProject,
  };
});
