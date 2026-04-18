import { ref } from "vue";
import { defineStore } from "pinia";
import type { ProjectInfo } from "@renderer/types/project";

export const useProjectStore = defineStore("project", () => {
  const currentProject = ref<ProjectInfo | null>(null);

  function setCurrentProject(project: ProjectInfo | null): void {
    currentProject.value = project;
  }

  function clearCurrentProject(): void {
    currentProject.value = null;
  }

  return { currentProject, setCurrentProject, clearCurrentProject };
});
