<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import SearchFilter from "@renderer/components/integration/SearchFilter.vue";
import CategorySection from "@renderer/components/integration/CategorySection.vue";
import CustomIntegrationSection from "@renderer/components/integration/CustomIntegrationSection.vue";
import { useIntegrationStore } from "@renderer/stores/integration";

const integrationStore = useIntegrationStore();

onMounted(() => integrationStore.loadConnections());

const { toolsByCategory, allCategories } = storeToRefs(integrationStore);
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-default">
    <div class="max-w-240 mx-auto px-6 py-8 space-y-8">
      <!-- Header -->
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-highlighted">集成</h1>
        <p class="text-sm text-muted">连接外部工具，通过 Pipeline 阶段自动化你的开发工作流。</p>
      </div>

      <!-- Search & Filter -->
      <SearchFilter />

      <!-- Category Sections -->
      <div class="space-y-10">
        <CategorySection
          v-for="category in allCategories"
          :key="category.id"
          :category="category"
          :tools="toolsByCategory.get(category.id) ?? []"
        />
      </div>

      <!-- Custom Integration -->
      <CustomIntegrationSection />
    </div>
  </div>
</template>
