export type InstallMethod = "npx" | "uvx" | "binary";

export type ManagedBy = "fyllocode" | "user";

export interface AgentNpxDistribution {
  package: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentUvxDistribution {
  package: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentBinaryDistribution {
  archive: string;
  cmd: string;
}

export interface AgentDistribution {
  npx?: AgentNpxDistribution;
  uvx?: AgentUvxDistribution;
  binary?: Record<string, AgentBinaryDistribution>;
}

export interface AgentEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  authors: string[];
  license: string;
  icon?: string;
  repository?: string;
  distribution: AgentDistribution;
}

export interface AgentRegistry {
  version?: string;
  agents: AgentEntry[];
}

export interface AgentRegistryCache {
  fetchedAt: number;
  data: AgentRegistry;
}

export interface InstalledAgentRecord {
  managedBy: ManagedBy;
  installMethod: InstallMethod;
  installPath?: string;
  installedVersion?: string;
  installedAt: number;
}

export type InstalledAgentsMap = Record<string, InstalledAgentRecord>;

export interface AgentStatus {
  id: string;
  installed: boolean;
  detectedVersion?: string;
  managedBy: ManagedBy | null;
  updateAvailable: boolean;
  latestVersion?: string;
}

export interface InstallProgress {
  agentId: string;
  status: "downloading" | "installing" | "done" | "error";
  message?: string;
}
