import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type {
  IntegrationTool,
  IntegrationCategory,
  ToolConnection,
  ToolConfig,
  ProjectToolConfig,
  FilterOption,
  ConnectionStatus,
} from "@renderer/types/integration";
import {
  categories,
  tools,
  generateMockConnections,
  generateMockToolConfigs,
  generateMockProjectToolConfigs,
} from "./integration.mock";
import { useProjectStore } from "./project";

export const useIntegrationStore = defineStore("integration", () => {
  const projectStore = useProjectStore();

  // State
  const allTools = ref<IntegrationTool[]>(tools);
  const allCategories = ref<IntegrationCategory[]>(categories);
  const connections = ref<ToolConnection[]>(generateMockConnections());
  const toolConfigs = ref<ToolConfig[]>(generateMockToolConfigs());
  const projectToolConfigs = ref<ProjectToolConfig[]>(generateMockProjectToolConfigs());
  const searchQuery = ref("");
  const filterOption = ref<FilterOption>("all");
  const expandedToolId = ref<string | null>(null);
  const testingConnectionId = ref<string | null>(null);

  // Getters
  const filteredTools = computed(() => {
    let result = allTools.value;

    // Search filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    // Status filter
    if (filterOption.value === "connected") {
      result = result.filter((t) => getConnectionStatus(t.id) === "connected");
    } else if (filterOption.value === "enabled-in-project") {
      result = result.filter((t) => isToolEnabledInProject(t.id));
    }

    return result;
  });

  const toolsByCategory = computed(() => {
    const map = new Map<string, IntegrationTool[]>();
    for (const cat of allCategories.value) {
      map.set(
        cat.id,
        filteredTools.value.filter((t) => t.categoryId === cat.id)
      );
    }
    return map;
  });

  const connectedTools = computed(() => allTools.value.filter((t) => getConnectionStatus(t.id) === "connected"));

  const enabledTools = computed(() => allTools.value.filter((t) => isToolEnabledInProject(t.id)));

  // Helpers
  function getConnection(toolId: string): ToolConnection | undefined {
    return connections.value.find((c) => c.toolId === toolId);
  }

  function getConnectionStatus(toolId: string): ConnectionStatus {
    return getConnection(toolId)?.status ?? "not-connected";
  }

  function isToolConnected(toolId: string): boolean {
    return getConnectionStatus(toolId) === "connected";
  }

  function getToolConfig(toolId: string): ToolConfig | undefined {
    return toolConfigs.value.find((c) => c.toolId === toolId);
  }

  function getProjectToolConfig(toolId: string): ProjectToolConfig | undefined {
    const projectId = projectStore.currentProject?.id;
    if (!projectId) return undefined;
    return projectToolConfigs.value.find((c) => c.projectId === projectId && c.toolId === toolId);
  }

  function isToolEnabledInProject(toolId: string): boolean {
    return getProjectToolConfig(toolId)?.enabled ?? false;
  }

  function getToolParameters(toolId: string): Record<string, unknown> {
    return getToolConfig(toolId)?.parameters ?? {};
  }

  function getProjectToolOverrides(toolId: string): Record<string, unknown> {
    return getProjectToolConfig(toolId)?.overrides ?? {};
  }

  // Actions
  function setSearchQuery(query: string): void {
    searchQuery.value = query;
  }

  function setFilterOption(option: FilterOption): void {
    filterOption.value = option;
  }

  function setExpandedTool(toolId: string | null): void {
    expandedToolId.value = toolId;
  }

  function toggleExpandTool(toolId: string): void {
    expandedToolId.value = expandedToolId.value === toolId ? null : toolId;
  }

  async function connectTool(toolId: string, credentials: Record<string, string>): Promise<boolean> {
    const tool = allTools.value.find((t) => t.id === toolId);
    if (!tool || tool.comingSoon) return false;

    testingConnectionId.value = toolId;

    // Simulate API validation
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const existing = connections.value.find((c) => c.toolId === toolId);
    const accountName = credentials.accessKey
      ? `${credentials.accessKey.slice(0, 4)}...`
      : credentials.webhookUrl
        ? "Webhook"
        : "Connected";

    if (existing) {
      existing.status = "connected";
      existing.credentials = credentials;
      existing.accountName = accountName;
      existing.connectedAt = new Date();
    } else {
      connections.value.push({
        toolId,
        status: "connected",
        accountName,
        connectedAt: new Date(),
        credentials,
      });
    }

    testingConnectionId.value = null;
    return true;
  }

  async function testConnection(toolId: string, credentials: Record<string, string>): Promise<boolean> {
    // Use credentials in mock validation
    void credentials;
    testingConnectionId.value = toolId;
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    testingConnectionId.value = null;
    // Simulate success for mock
    return true;
  }

  async function disconnectTool(toolId: string): Promise<void> {
    connections.value = connections.value.filter((c) => c.toolId !== toolId);

    // Also disable in all projects
    projectToolConfigs.value = projectToolConfigs.value.filter((c) => c.toolId !== toolId);

    // Remove tool config
    toolConfigs.value = toolConfigs.value.filter((c) => c.toolId !== toolId);

    if (expandedToolId.value === toolId) {
      expandedToolId.value = null;
    }
  }

  async function simulateOAuthConnect(toolId: string): Promise<boolean> {
    const tool = allTools.value.find((t) => t.id === toolId);
    if (!tool || tool.comingSoon) return false;

    testingConnectionId.value = toolId;
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    const existing = connections.value.find((c) => c.toolId === toolId);
    if (existing) {
      existing.status = "connected";
      existing.accountName = tool.name;
      existing.connectedAt = new Date();
    } else {
      connections.value.push({
        toolId,
        status: "connected",
        accountName: tool.name,
        connectedAt: new Date(),
      });
    }

    testingConnectionId.value = null;
    return true;
  }

  function enableToolInProject(toolId: string): void {
    const projectId = projectStore.currentProject?.id;
    if (!projectId) return;

    const existing = projectToolConfigs.value.find((c) => c.projectId === projectId && c.toolId === toolId);
    if (existing) {
      existing.enabled = true;
    } else {
      projectToolConfigs.value.push({
        projectId,
        toolId,
        enabled: true,
        overrides: {},
      });
    }
  }

  function disableToolInProject(toolId: string): void {
    const projectId = projectStore.currentProject?.id;
    if (!projectId) return;

    const existing = projectToolConfigs.value.find((c) => c.projectId === projectId && c.toolId === toolId);
    if (existing) {
      existing.enabled = false;
    }
  }

  function updateToolConfig(toolId: string, parameters: Record<string, unknown>): void {
    const existing = toolConfigs.value.find((c) => c.toolId === toolId);
    if (existing) {
      existing.parameters = { ...existing.parameters, ...parameters };
    } else {
      toolConfigs.value.push({ toolId, parameters });
    }
  }

  function updateProjectToolConfig(toolId: string, overrides: Record<string, unknown>): void {
    const projectId = projectStore.currentProject?.id;
    if (!projectId) return;

    const existing = projectToolConfigs.value.find((c) => c.projectId === projectId && c.toolId === toolId);
    if (existing) {
      existing.overrides = { ...existing.overrides, ...overrides };
    } else {
      projectToolConfigs.value.push({
        projectId,
        toolId,
        enabled: false,
        overrides,
      });
    }
  }

  return {
    // State
    allTools,
    allCategories,
    connections,
    toolConfigs,
    projectToolConfigs,
    searchQuery,
    filterOption,
    expandedToolId,
    testingConnectionId,
    // Getters (computed)
    filteredTools,
    toolsByCategory,
    connectedTools,
    enabledTools,
    // Helpers
    getConnection,
    getConnectionStatus,
    isToolConnected,
    getToolConfig,
    getProjectToolConfig,
    isToolEnabledInProject,
    getToolParameters,
    getProjectToolOverrides,
    // Actions
    setSearchQuery,
    setFilterOption,
    setExpandedTool,
    toggleExpandTool,
    connectTool,
    testConnection,
    disconnectTool,
    simulateOAuthConnect,
    enableToolInProject,
    disableToolInProject,
    updateToolConfig,
    updateProjectToolConfig,
  };
});
