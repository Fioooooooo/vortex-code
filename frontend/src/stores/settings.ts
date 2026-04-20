import { ref } from "vue";
import { defineStore } from "pinia";
import type { AgentInfo, PreferencesConfig } from "@renderer/types/settings";

// Mock data for agent status
const mockAgents: AgentInfo[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Anthropic's autonomous coding agent",
    installed: true,
    version: "1.2.3",
    docsUrl: "https://docs.anthropic.com/claude-code",
  },
  {
    id: "codex",
    name: "Codex",
    description: "OpenAI's code generation and editing agent",
    installed: true,
    version: "0.9.1",
    docsUrl: "https://platform.openai.com/docs/codex",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    description: "Google's command-line AI coding assistant",
    installed: false,
    docsUrl: "https://ai.google.dev/gemini-api/docs",
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Open-source terminal-based AI coding agent",
    installed: false,
    docsUrl: "https://opencode.ai/docs",
  },
];

const defaultPreferences: PreferencesConfig = {
  theme: "system",
  language: "en",
  defaultAgentMode: "auto",
  notificationMethods: ["in-app"],
  autoSaveSession: true,
  tokenStatsPeriod: "monthly",
  budgetAlert: { value: 100000, unit: "tokens" },
};

export const useSettingsStore = defineStore("settings", () => {
  const agentStatus = ref<AgentInfo[]>(mockAgents);
  const preferences = ref<PreferencesConfig>({ ...defaultPreferences });
  const isRefreshing = ref(false);

  async function refreshAgentStatus(): Promise<void> {
    isRefreshing.value = true;
    // Simulate CLI detection delay
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
    // In production: call Electron IPC to detect installed CLIs
    agentStatus.value = [...mockAgents];
    isRefreshing.value = false;
  }

  function updatePreference<K extends keyof PreferencesConfig>(
    key: K,
    value: PreferencesConfig[K]
  ): void {
    preferences.value[key] = value;
    // In production: persist to electron-store or localStorage
  }

  async function clearAllHistory(): Promise<void> {
    // In production: clear session history, token stats, etc.
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  return {
    agentStatus,
    preferences,
    isRefreshing,
    refreshAgentStatus,
    updatePreference,
    clearAllHistory,
  };
});
