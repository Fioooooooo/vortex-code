export type IntegrationCategoryId =
  | "project-management"
  | "source-control"
  | "ci-cd"
  | "deployment"
  | "communication"
  | "observability";

export type ConnectionType = "api-token" | "oauth";

export type ConnectionStatus = "not-connected" | "connected" | "connecting";

export type FilterOption = "all" | "connected" | "enabled-in-project";

export interface IntegrationCategory {
  id: IntegrationCategoryId;
  name: string;
  description: string;
}

export interface ConnectionField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder?: string;
  helperText?: string;
  helpLink?: string;
  required: boolean;
}

export interface ToolParameterField {
  key: string;
  label: string;
  type: "text" | "select" | "checkbox-group" | "url";
  options?: { label: string; value: string }[];
  placeholder?: string;
  helperText?: string;
  required: boolean;
}

export interface IntegrationTool {
  id: string;
  name: string;
  description: string;
  categoryId: IntegrationCategoryId;
  connectionType: ConnectionType;
  connectionFields: ConnectionField[];
  parameterFields: ToolParameterField[];
  projectConfigFields: ToolParameterField[];
  logoIcon: string;
  logoColor: string;
  comingSoon: boolean;
}

export interface ToolConnection {
  toolId: string;
  status: ConnectionStatus;
  accountName?: string;
  connectedAt?: Date;
  credentials?: Record<string, string>;
}

export interface ToolConfig {
  toolId: string;
  parameters: Record<string, unknown>;
}

export interface ProjectToolConfig {
  projectId: string;
  toolId: string;
  enabled: boolean;
  overrides: Record<string, unknown>;
}

export interface CustomIntegration {
  id: string;
  name: string;
  mcpServerUrl: string;
  skillConfig: string;
  createdAt: Date;
}
