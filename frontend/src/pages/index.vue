<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "@nuxt/ui/composables";

const count = ref(0);
const loading = ref(false);
const selected = ref("option1");
const checked = ref(false);
const inputVal = ref("");
const toasts = useToast();

const options = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
];

function simulateLoad(): void {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    toasts.add({ title: "完成", description: "操作成功", color: "success" });
  }, 1500);
}
</script>

<template>
  <div class="p-8 max-w-2xl mx-auto space-y-8">
    <h1 class="text-2xl font-bold text-highlighted">Nuxt UI Demo</h1>

    <!-- Buttons -->
    <section class="space-y-2">
      <p class="text-sm text-muted font-medium">Buttons</p>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-plus" color="primary" @click="count++">点击 {{ count }}</UButton>
        <UButton icon="i-lucide-settings" color="secondary">Secondary</UButton>
        <UButton icon="i-lucide-check" color="success">Success</UButton>
        <UButton icon="i-lucide-triangle-alert" color="warning">Warning</UButton>
        <UButton icon="i-lucide-x" color="error">Error</UButton>
        <UButton icon="i-lucide-pencil" variant="outline">Outline</UButton>
        <UButton icon="i-lucide-trash-2" variant="ghost">Ghost</UButton>
        <UButton icon="i-lucide-refresh-cw" :loading="loading" @click="simulateLoad">Loading</UButton>
      </div>
    </section>

    <!-- Badges -->
    <section class="space-y-2">
      <p class="text-sm text-muted font-medium">Badges</p>
      <div class="flex flex-wrap gap-2">
        <UBadge color="primary">Primary</UBadge>
        <UBadge color="success">Success</UBadge>
        <UBadge color="warning">Warning</UBadge>
        <UBadge color="error">Error</UBadge>
        <UBadge variant="outline">Outline</UBadge>
        <UBadge variant="subtle">Subtle</UBadge>
      </div>
    </section>

    <!-- Input & Select -->
    <section class="space-y-3">
      <p class="text-sm text-muted font-medium">Form Controls</p>
      <UInput v-model="inputVal" placeholder="输入一些内容..." />
      <USelect v-model="selected" :items="options" />
      <UCheckbox v-model="checked" label="同意条款" />
    </section>

    <!-- Card -->
    <section>
      <UCard>
        <template #header>
          <p class="font-semibold">Card 标题</p>
        </template>
        <p class="text-sm text-muted">
          这是 UCard 的内容区域，当前输入：<strong>{{ inputVal || "(空)" }}</strong>
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" size="sm">取消</UButton>
            <UButton size="sm">确认</UButton>
          </div>
        </template>
      </UCard>
    </section>

    <!-- Alert -->
    <section class="space-y-2">
      <UAlert
        icon="i-lucide-info"
        color="info"
        title="提示"
        description="Nuxt UI 已成功集成到 Electron + Vite 项目中。"
      />
      <UAlert icon="i-lucide-circle-check" color="success" title="成功" description="所有组件均可正常使用。" />
    </section>
  </div>
</template>
