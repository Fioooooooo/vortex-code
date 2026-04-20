<script setup lang="ts">
import { computed } from "vue";
import IntegrationSearchFilter from "@renderer/components/integration/IntegrationSearchFilter.vue";
import IntegrationCategorySection from "@renderer/components/integration/IntegrationCategorySection.vue";
import CustomIntegrationSection from "@renderer/components/integration/CustomIntegrationSection.vue";
import { useIntegrationStore } from "@renderer/stores/integration";
import { useProjectStore } from "@renderer/stores/project";

const integrationStore = useIntegrationStore();
const projectStore = useProjectStore();

const hasProject = computed(() => projectStore.hasCurrentProject);

const searchQuery = computed({
  get: () => integrationStore.searchQuery,
  set: (val) => integrationStore.setSearchQuery(val),
});

const filterOption = computed({
  get: () => integrationStore.filterOption,
  set: (val) => integrationStore.setFilterOption(val),
});

const toolsByCategory = computed(() => integrationStore.toolsByCategory);
const categories = computed(() => integrationStore.allCategories);
const expandedToolId = computed(() => integrationStore.expandedToolId);

function onToggleExpand(toolId: string): void {
  integrationStore.toggleExpandTool(toolId);
}
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-default">
    <div class="max-w-[960px] mx-auto px-6 py-8 space-y-8">
      <!-- Header -->
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-highlighted">Integrations</h1>
        <p class="text-sm text-muted">
          Connect external tools to automate your development workflow through Pipeline stages.
        </p>
      </div>

      <!-- Search & Filter -->
      <IntegrationSearchFilter
        v-model="searchQuery"
        v-model:filter="filterOption"
        :has-project="hasProject"
      />

      <!-- Category Sections -->
      <div class="space-y-10">
        <IntegrationCategorySection
          v-for="category in categories"
          :key="category.id"
          :category="category"
          :tools="toolsByCategory.get(category.id) ?? []"
          :expanded-tool-id="expandedToolId"
          @toggle-expand="onToggleExpand"
        />
      </div>

      <!-- Custom Integration -->
      <CustomIntegrationSection />
    </div>
  </div>
</template>
