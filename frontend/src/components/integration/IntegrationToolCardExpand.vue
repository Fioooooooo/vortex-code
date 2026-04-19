<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import type { IntegrationTool } from "@renderer/types/integration";
import { useIntegrationStore } from "@renderer/stores/integration";
import { useProjectStore } from "@renderer/stores/project";

const props = defineProps<{
  tool: IntegrationTool;
}>();

const integrationStore = useIntegrationStore();
const projectStore = useProjectStore();

const isConnected = computed(() => integrationStore.isToolConnected(props.tool.id));
const isEnabled = computed(() => integrationStore.isToolEnabledInProject(props.tool.id));
const connection = computed(() => integrationStore.getConnection(props.tool.id));
const isTesting = computed(() => integrationStore.testingConnectionId === props.tool.id);
const currentProjectName = computed(() => projectStore.currentProject?.name ?? "");
const toolParams = computed(() => integrationStore.getToolParameters(props.tool.id));
const projectOverrides = computed(() => integrationStore.getProjectToolOverrides(props.tool.id));

// Connection form state
const connectionForm = reactive<Record<string, string>>({});
const testSuccess = ref(false);

// Tool parameter form state
const paramForm = reactive<Record<string, string | string[]>>({});

// Project override form state
const projectForm = reactive<Record<string, string>>({});

function initConnectionForm(): void {
  for (const field of props.tool.connectionFields) {
    connectionForm[field.key] = connection.value?.credentials?.[field.key] ?? "";
  }
}

function initParamForm(): void {
  for (const field of props.tool.parameterFields) {
    const val = toolParams.value[field.key];
    if (field.type === "checkbox-group" && Array.isArray(val)) {
      paramForm[field.key] = val as string[];
    } else if (typeof val === "string") {
      paramForm[field.key] = val;
    } else {
      paramForm[field.key] = "";
    }
  }
}

function initProjectForm(): void {
  for (const field of props.tool.projectConfigFields) {
    const val = projectOverrides.value[field.key];
    projectForm[field.key] = typeof val === "string" ? val : "";
  }
}

// Initialize forms when connected status changes
initConnectionForm();
initParamForm();
initProjectForm();

async function handleTestConnection(): Promise<void> {
  testSuccess.value = false;
  const success = await integrationStore.testConnection(props.tool.id, { ...connectionForm });
  testSuccess.value = success;
}

async function handleConnect(): Promise<void> {
  testSuccess.value = false;
  const success = await integrationStore.connectTool(props.tool.id, { ...connectionForm });
  if (success) {
    testSuccess.value = true;
  }
}

async function handleOAuthConnect(): Promise<void> {
  await integrationStore.simulateOAuthConnect(props.tool.id);
}

function handleDisconnect(): void {
  integrationStore.disconnectTool(props.tool.id);
}

function saveToolParameters(): void {
  integrationStore.updateToolConfig(props.tool.id, { ...paramForm });
}

function saveProjectOverrides(): void {
  integrationStore.updateProjectToolConfig(props.tool.id, { ...projectForm });
}
</script>

<template>
  <div class="p-4 space-y-5">
    <!-- Section 1: Account Connection -->
    <div class="space-y-3">
      <h4 class="text-sm font-semibold text-highlighted flex items-center gap-2">
        <UIcon name="i-lucide-link" class="w-4 h-4 text-primary" />
        Account Connection
      </h4>

      <!-- API Token Form -->
      <div v-if="tool.connectionType === 'api-token' && !isConnected" class="space-y-3">
        <div v-for="field in tool.connectionFields" :key="field.key" class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-highlighted">
              {{ field.label }}
              <span v-if="field.required" class="text-error">*</span>
            </label>
            <a
              v-if="field.helpLink"
              :href="field.helpLink"
              target="_blank"
              class="text-xs text-primary hover:underline"
              @click.stop
            >
              How to get
            </a>
          </div>
          <UInput
            v-if="field.type !== 'password'"
            v-model="connectionForm[field.key]"
            :placeholder="field.placeholder"
            size="sm"
          />
          <UInput
            v-else
            v-model="connectionForm[field.key]"
            :placeholder="field.placeholder"
            type="password"
            size="sm"
          />
          <p v-if="field.helperText" class="text-xs text-muted">{{ field.helperText }}</p>
        </div>

        <div class="flex items-center gap-2">
          <UButton size="sm" variant="soft" color="neutral" :loading="isTesting" @click="handleTestConnection">
            <UIcon name="i-lucide-flask-conical" class="w-4 h-4" />
            Test Connection
          </UButton>
          <UButton size="sm" :loading="isTesting" @click="handleConnect">
            <UIcon name="i-lucide-plug" class="w-4 h-4" />
            Connect
          </UButton>
          <UBadge v-if="testSuccess" size="xs" variant="soft" color="success" class="flex items-center gap-1">
            <UIcon name="i-lucide-check" class="w-3 h-3" />
            Success
          </UBadge>
        </div>
      </div>

      <!-- OAuth Button -->
      <div v-if="tool.connectionType === 'oauth' && !isConnected" class="space-y-3">
        <UButton size="sm" :loading="isTesting" @click="handleOAuthConnect">
          <UIcon name="i-lucide-external-link" class="w-4 h-4" />
          Connect with {{ tool.name }}
        </UButton>
      </div>

      <!-- Connected State -->
      <div v-if="isConnected" class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-md">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-success" />
            <span class="text-sm text-highlighted">
              Connected as <span class="font-medium">{{ connection?.accountName }}</span>
            </span>
          </div>
          <UButton size="xs" variant="ghost" color="error" @click="handleDisconnect">
            <UIcon name="i-lucide-unlink" class="w-3.5 h-3.5" />
            Disconnect
          </UButton>
        </div>
      </div>
    </div>

    <!-- Section 2: Tool Parameters (only when connected) -->
    <div v-if="isConnected && tool.parameterFields.length > 0" class="space-y-3 pt-4 border-t border-default">
      <h4 class="text-sm font-semibold text-highlighted flex items-center gap-2">
        <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 text-secondary" />
        Tool Parameters
      </h4>

      <div class="space-y-3">
        <div v-for="field in tool.parameterFields" :key="field.key" class="space-y-1.5">
          <label class="text-sm font-medium text-highlighted">
            {{ field.label }}
            <span v-if="field.required" class="text-error">*</span>
          </label>

          <USelect
            v-if="field.type === 'select'"
            :model-value="paramForm[field.key] as string"
            :items="field.options ?? []"
            :placeholder="field.placeholder"
            size="sm"
            @update:model-value="
              (val: string) => {
                paramForm[field.key] = val;
              }
            "
          />

          <UInput
            v-else-if="field.type === 'url'"
            :model-value="paramForm[field.key] as string"
            :placeholder="field.placeholder"
            type="url"
            size="sm"
            @update:model-value="
              (val: string) => {
                paramForm[field.key] = val;
              }
            "
          />

          <div v-else-if="field.type === 'checkbox-group' && field.options" class="space-y-1.5">
            <div v-for="opt in field.options" :key="opt.value" class="flex items-center gap-2">
              <UCheckbox
                :model-value="((paramForm[field.key] as string[]) ?? []).includes(opt.value)"
                size="xs"
                @update:model-value="
                  (checked: boolean) => {
                    const current = (paramForm[field.key] as string[]) ?? [];
                    if (checked) {
                      paramForm[field.key] = [...current, opt.value];
                    } else {
                      paramForm[field.key] = current.filter((v: string) => v !== opt.value);
                    }
                  }
                "
              />
              <span class="text-sm text-muted">{{ opt.label }}</span>
            </div>
          </div>

          <UInput
            v-else
            :model-value="paramForm[field.key] as string"
            :placeholder="field.placeholder"
            size="sm"
            @update:model-value="
              (val: string) => {
                paramForm[field.key] = val;
              }
            "
          />

          <p v-if="field.helperText" class="text-xs text-muted">{{ field.helperText }}</p>
        </div>
      </div>

      <div class="flex justify-end">
        <UButton size="sm" variant="soft" @click="saveToolParameters">
          <UIcon name="i-lucide-save" class="w-4 h-4" />
          Save Parameters
        </UButton>
      </div>
    </div>

    <!-- Section 3: Project Configuration (only when enabled) -->
    <div v-if="isEnabled && tool.projectConfigFields.length > 0" class="space-y-3 pt-4 border-t border-default">
      <h4 class="text-sm font-semibold text-highlighted flex items-center gap-2">
        <UIcon name="i-lucide-settings-2" class="w-4 h-4 text-info" />
        Configuration for {{ currentProjectName }}
      </h4>

      <div class="space-y-3">
        <div v-for="field in tool.projectConfigFields" :key="field.key" class="space-y-1.5">
          <label class="text-sm font-medium text-highlighted">
            {{ field.label }}
            <span v-if="field.required" class="text-error">*</span>
          </label>

          <USelect
            v-if="field.type === 'select'"
            :model-value="projectForm[field.key] as string"
            :items="field.options ?? []"
            :placeholder="field.placeholder"
            size="sm"
            @update:model-value="
              (val: string) => {
                projectForm[field.key] = val;
              }
            "
          />

          <UInput
            v-else-if="field.type === 'url'"
            :model-value="projectForm[field.key] as string"
            :placeholder="field.placeholder"
            type="url"
            size="sm"
            @update:model-value="
              (val: string) => {
                projectForm[field.key] = val;
              }
            "
          />

          <UInput
            v-else
            :model-value="projectForm[field.key] as string"
            :placeholder="field.placeholder"
            size="sm"
            @update:model-value="
              (val: string) => {
                projectForm[field.key] = val;
              }
            "
          />

          <p v-if="field.helperText" class="text-xs text-muted">{{ field.helperText }}</p>
        </div>
      </div>

      <div class="flex justify-end">
        <UButton size="sm" variant="soft" @click="saveProjectOverrides">
          <UIcon name="i-lucide-save" class="w-4 h-4" />
          Save Project Config
        </UButton>
      </div>
    </div>
  </div>
</template>
