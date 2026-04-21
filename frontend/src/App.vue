<script setup lang="ts">
import ActivityBar from "@renderer/components/layout/ActivityBar.vue";
import AppHeader from "@renderer/components/layout/AppHeader.vue";
import AppLayout from "@renderer/layouts/AppLayout.vue";
</script>

<template>
  <Suspense>
    <UApp :toaster="{ position: 'top-right' }">
      <AppLayout>
        <template #header>
          <AppHeader />
        </template>

        <template #side>
          <ActivityBar />
        </template>

        <RouterView />
      </AppLayout>
    </UApp>
  </Suspense>
</template>
