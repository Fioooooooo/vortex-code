<script setup lang="ts">
import { ref } from "vue";
import SettingsAgents from "@renderer/components/settings/SettingsAgents.vue";
import SettingsPreferences from "@renderer/components/settings/SettingsPreferences.vue";

const activeTab = ref<"agents" | "preferences">("agents");
</script>

<template>
  <div class="flex flex-1 overflow-hidden bg-default">
    <nav class="w-65 shrink-0 border-r border-default py-4 px-2 flex flex-col gap-1">
      <UButton
        variant="ghost"
        :color="activeTab === 'agents' ? 'primary' : 'neutral'"
        class="justify-start"
        @click="activeTab = 'agents'"
      >
        <UIcon name="i-lucide-bot" class="w-4 h-4 mr-2" />
        Agents
      </UButton>
      <UButton
        variant="ghost"
        :color="activeTab === 'preferences' ? 'primary' : 'neutral'"
        class="justify-start"
        @click="activeTab = 'preferences'"
      >
        <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 mr-2" />
        偏好设置
      </UButton>
    </nav>

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-240 mx-auto px-6 py-8">
        <SettingsAgents v-if="activeTab === 'agents'" />
        <SettingsPreferences v-else />
      </div>
    </div>
  </div>
</template>
