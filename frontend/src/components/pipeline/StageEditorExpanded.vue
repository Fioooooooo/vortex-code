<script setup lang="ts">
import type { PipelineStageConfig, GateCondition, FailureStrategy } from "@renderer/types/pipeline";

const props = defineProps<{
  stage: PipelineStageConfig;
}>();

const emit = defineEmits<{
  (e: "update", stage: PipelineStageConfig): void;
}>();

const failureStrategyOptions: { value: FailureStrategy; label: string }[] = [
  { value: "retry", label: "自动重试" },
  { value: "pause", label: "暂停等待人工介入" },
  { value: "skip", label: "跳过并继续" },
  { value: "abort", label: "终止整个运行" },
];

const gateConditionTypeOptions = [
  { value: "test-pass-rate", label: "测试通过率" },
  { value: "coverage-threshold", label: "覆盖率阈值" },
  { value: "no-critical-review", label: "无 critical 审查意见" },
  { value: "manual-approval", label: "人工审批" },
  { value: "custom-script", label: "自定义脚本" },
];

const mcpSkillOptions = [
  { value: "file-write", label: "File Write" },
  { value: "command-exec", label: "Command Execution" },
  { value: "test-runner", label: "Test Runner" },
  { value: "deploy", label: "Deploy" },
];

function updateField<K extends keyof PipelineStageConfig>(
  field: K,
  value: PipelineStageConfig[K]
): void {
  emit("update", { ...props.stage, [field]: value });
}

function addGateCondition(): void {
  const newGate: GateCondition = {
    id: `gate-${Date.now()}`,
    type: "manual-approval",
    params: {},
    description: "需要人工审批",
  };
  updateField("gateConditions", [...props.stage.gateConditions, newGate]);
}

function updateGateCondition(index: number, gate: GateCondition): void {
  const updated = [...props.stage.gateConditions];
  updated[index] = gate;
  updateField("gateConditions", updated);
}

function removeGateCondition(index: number): void {
  const updated = [...props.stage.gateConditions];
  updated.splice(index, 1);
  updateField("gateConditions", updated);
}

function toggleMcpSkill(skill: string): void {
  const hasSkill = props.stage.mcpSkills.includes(skill);
  if (hasSkill) {
    updateField(
      "mcpSkills",
      props.stage.mcpSkills.filter((s) => s !== skill)
    );
  } else {
    updateField("mcpSkills", [...props.stage.mcpSkills, skill]);
  }
}
</script>

<template>
  <div class="px-4 py-3 space-y-4 border-t border-default bg-muted/10">
    <!-- Prompt Template -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted">Prompt Template</label>
      <UTextarea
        :model-value="stage.promptTemplate"
        :rows="4"
        @update:model-value="updateField('promptTemplate', $event)"
      />
      <p class="text-xs text-muted">
        Use
        <code class="bg-primary/10 text-primary px-1 rounded">{{ "\{\{variable\}\}" }}</code>
        for variable interpolation
      </p>
    </div>

    <!-- Agent -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted">Agent</label>
      <USelect
        :model-value="stage.agentId ?? ''"
        :items="[
          { value: '', label: 'Inherit from project settings' },
          { value: 'claude-code', label: 'Claude Code' },
          { value: 'codex', label: 'Codex' },
        ]"
        placeholder="Select agent"
        class="w-full"
        @update:model-value="updateField('agentId', $event || null)"
      />
    </div>

    <!-- Gate Conditions -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-medium text-muted">Gate Conditions</label>
        <UButton size="xs" variant="soft" color="primary" @click="addGateCondition">
          <UIcon name="i-lucide-plus" class="w-3.5 h-3.5 mr-1" />
          Add
        </UButton>
      </div>

      <div v-if="stage.gateConditions.length === 0" class="text-xs text-muted py-1">
        No gate conditions. Stage will proceed automatically.
      </div>

      <div
        v-for="(gate, idx) in stage.gateConditions"
        :key="gate.id"
        class="flex items-center gap-2"
      >
        <USelect
          :model-value="gate.type"
          :items="gateConditionTypeOptions"
          class="flex-1"
          size="sm"
          @update:model-value="
            updateGateCondition(idx, {
              ...gate,
              type: $event as GateCondition['type'],
              description:
                $event === 'manual-approval'
                  ? '需要人工审批'
                  : $event === 'test-pass-rate'
                    ? '测试通过率达标'
                    : $event === 'coverage-threshold'
                      ? '覆盖率达标'
                      : $event === 'no-critical-review'
                        ? '无 critical 审查意见'
                        : '自定义脚本通过',
            })
          "
        />
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          class="w-6 h-6 p-0 justify-center"
          @click="removeGateCondition(idx)"
        >
          <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
        </UButton>
      </div>
    </div>

    <!-- Failure Strategy -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted">Failure Strategy</label>
      <USelect
        :model-value="stage.failureStrategy"
        :items="failureStrategyOptions"
        class="w-full"
        @update:model-value="updateField('failureStrategy', $event as FailureStrategy)"
      />
      <div v-if="stage.failureStrategy === 'retry'" class="flex items-center gap-2 mt-2">
        <label class="text-xs text-muted">Max Retries:</label>
        <UInput
          :model-value="stage.failureStrategyMaxRetries ?? 1"
          type="number"
          size="sm"
          class="w-20"
          :min="1"
          :max="10"
          @update:model-value="updateField('failureStrategyMaxRetries', Number($event))"
        />
      </div>
    </div>

    <!-- MCP / Skills -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted">MCP / Skills</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="skill in mcpSkillOptions"
          :key="skill.value"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors"
          :class="
            stage.mcpSkills.includes(skill.value)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-default bg-muted/20 text-muted hover:text-default'
          "
          @click="toggleMcpSkill(skill.value)"
        >
          <UIcon
            :name="
              stage.mcpSkills.includes(skill.value) ? 'i-lucide-check-square' : 'i-lucide-square'
            "
            class="w-3.5 h-3.5"
          />
          {{ skill.label }}
        </button>
      </div>
    </div>
  </div>
</template>
