import { ref } from "vue";
import { defineStore } from "pinia";

export const useWelcomeStore = defineStore("welcome", () => {
  const showCreateProjectModal = ref(false);

  function toggleCreateProjectModal(show: boolean): void {
    showCreateProjectModal.value = show;
  }

  return {
    showCreateProjectModal,
    toggleCreateProjectModal,
  };
});
