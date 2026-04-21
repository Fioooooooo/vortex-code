<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useProjectStore } from "@renderer/stores/project";
import { useWelcomeStore } from "@renderer/stores/welcome";
import type { CreateProjectForm } from "@shared/types/project";

const router = useRouter();
const projectStore = useProjectStore();
const welcomeStore = useWelcomeStore();

const form = ref<CreateProjectForm>({
  name: "",
  path: "~/projects",
  template: "empty",
  gitUrl: "",
});

const isSubmitting = ref(false);

const templateOptions = [
  { label: "Empty Project", value: "empty" },
  { label: "Clone from Git", value: "git" },
];

const isGitSelected = computed(() => form.value.template === "git");

const isValid = computed(() => {
  if (!form.value.name.trim()) return false;
  if (isGitSelected.value && !form.value.gitUrl?.trim()) return false;
  return true;
});

function handleClose(): void {
  welcomeStore.toggleCreateProjectModal(false);
  resetForm();
}

async function handleSubmit(): Promise<void> {
  if (!isValid.value) return;

  isSubmitting.value = true;
  try {
    await projectStore.createProject({ ...form.value });
    welcomeStore.toggleCreateProjectModal(false);
    resetForm();
    await router.push("/chat");
  } finally {
    isSubmitting.value = false;
  }
}

function resetForm(): void {
  form.value = {
    name: "",
    path: "~/projects",
    template: "empty",
    gitUrl: "",
  };
}
</script>

<template>
  <UModal
    :open="welcomeStore.showCreateProjectModal"
    title="Create Project"
    description="Set up a new project to get started."
    @update:open="welcomeStore.toggleCreateProjectModal($event)"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Project Name" required>
          <UInput v-model="form.name" placeholder="Enter project name" :disabled="isSubmitting" />
        </UFormField>

        <UFormField label="Storage Path">
          <UInput v-model="form.path" placeholder="~/projects" :disabled="isSubmitting" />
        </UFormField>

        <UFormField label="Template">
          <USelect v-model="form.template" :items="templateOptions" :disabled="isSubmitting" />
        </UFormField>

        <UFormField v-if="isGitSelected" label="Git Repository URL" required>
          <UInput
            v-model="form.gitUrl"
            placeholder="https://github.com/user/repo.git"
            :disabled="isSubmitting"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" :disabled="isSubmitting" @click="handleClose">
          Cancel
        </UButton>
        <UButton color="primary" :loading="isSubmitting" :disabled="!isValid" @click="handleSubmit">
          Create Project
        </UButton>
      </div>
    </template>
  </UModal>
</template>
