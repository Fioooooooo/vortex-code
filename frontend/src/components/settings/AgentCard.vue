<script setup lang="ts">
import { computed, ref } from "vue";
import type { AcpAgentEntry, AcpAgentStatus, AcpInstallProgress } from "@shared/types/acp-agent";

const props = defineProps<{
  agent: AcpAgentEntry;
  icon?: string;
  agentStatus?: AcpAgentStatus;
  installProgress?: AcpInstallProgress;
  isInstalling?: boolean;
  actionDisabled?: boolean;
}>();

const emit = defineEmits<{
  install: [agentId: string];
}>();

const showTakeoverModal = ref(false);

const canUpdate = computed(() => props.agentStatus?.installed && props.agentStatus.updateAvailable);
const isUserManagedUpdate = computed(
  () => canUpdate.value && props.agentStatus?.managedBy === "user"
);
const hasError = computed(() => props.installProgress?.status === "error");
const progressMessage = computed(() => props.installProgress?.message ?? "正在处理...");
const detectedVersion = computed(() => props.agentStatus?.detectedVersion ?? props.agent.version);
const versionLabel = computed(() => `v${props.agent.version}`);

function requestInstall(): void {
  if (isUserManagedUpdate.value) {
    showTakeoverModal.value = true;
    return;
  }

  emit("install", props.agent.id);
}

function confirmTakeoverInstall(): void {
  showTakeoverModal.value = false;
  emit("install", props.agent.id);
}
</script>

<template>
  <UCard :ui="{ body: 'p-0!' }">
    <div class="flex flex-col gap-3 p-4">
      <div class="flex items-center gap-3">
        <div class="relative shrink-0">
          <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <img v-if="icon" :src="icon" :alt="agent.name" class="w-full h-full object-cover" />
            <UIcon v-else name="i-lucide-terminal" class="w-4 h-4 text-muted" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-highlighted truncate">{{ agent.name }}</p>
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-muted/60">{{ versionLabel }}</span>
            <span class="text-xs text-muted/40">·</span>
            <span class="text-xs text-muted/60 truncate">{{ agent.license }}</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <div v-if="isInstalling" class="flex items-center gap-2 text-xs text-muted">
            <UIcon name="i-lucide-loader-circle" class="w-4 h-4 animate-spin" />
            <span>{{ progressMessage }}</span>
          </div>

          <div v-else-if="hasError" class="flex items-center gap-2 text-xs text-error">
            <UIcon name="i-lucide-circle-x" class="w-4 h-4 shrink-0" />
            <span class="max-w-28 truncate" :title="progressMessage">{{ progressMessage }}</span>
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              :title="'重试'"
              @click="requestInstall"
            >
              <UIcon name="i-lucide-rotate-ccw" class="w-3 h-3" />
            </UButton>
          </div>

          <template v-else-if="canUpdate">
            <UButton
              size="xs"
              color="primary"
              :disabled="actionDisabled"
              :title="actionDisabled ? '其他 Agent 正在安装中' : undefined"
              @click="requestInstall"
            >
              <UIcon name="i-lucide-refresh-cw" class="w-3 h-3 mr-1" />
              更新
            </UButton>
            <span class="text-xs text-muted">v{{ detectedVersion }}</span>
          </template>

          <template v-else-if="agentStatus?.installed">
            <UBadge color="success" variant="soft">已安装</UBadge>
            <span class="text-xs text-muted">最新版本</span>
          </template>

          <UButton
            v-else
            size="xs"
            variant="outline"
            color="neutral"
            :disabled="actionDisabled"
            :title="actionDisabled ? '其他 Agent 正在安装中' : undefined"
            class="shrink-0"
            @click="requestInstall"
          >
            <UIcon name="i-lucide-download" class="w-3 h-3 mr-1" />
            安装
          </UButton>
        </div>
      </div>
      <p class="text-xs text-muted line-clamp-2">{{ agent.description }}</p>
      <span class="text-xs text-muted/60 truncate">{{ agent.authors.join(", ") }}</span>
    </div>
  </UCard>

  <UModal v-model:open="showTakeoverModal">
    <template #content>
      <div class="p-6 space-y-4">
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0"
          >
            <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-highlighted">接管此 Agent 的更新？</h3>
            <p class="text-sm text-muted mt-1">
              继续后，FylloCode 将接管这个用户自行安装的 Agent，并负责后续更新管理。
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" @click="showTakeoverModal = false">取消</UButton>
          <UButton color="warning" @click="confirmTakeoverInstall">确认更新</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
