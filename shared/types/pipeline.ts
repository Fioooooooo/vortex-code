import type { FileChange, Message } from "./chat";

export type StageType = "discuss" | "code" | "test" | "review" | "deploy" | "custom";

export type StageStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "skipped"
  | "waiting-approval";

export type GateConditionType =
  | "test-pass-rate"
  | "coverage-threshold"
  | "no-critical-review"
  | "manual-approval"
  | "custom-script";

export type FailureStrategy = "retry" | "pause" | "skip" | "abort";

export type TemplateSource = "built-in" | "custom";

export type PipelineSidebarTab = "runs" | "templates";

export interface GateCondition {
  id: string;
  type: GateConditionType;
  params: Record<string, unknown>;
  description: string;
}

export interface PipelineStageConfig {
  id: string;
  type: StageType;
  name: string;
  promptTemplate: string;
  agentId: string | null;
  gateConditions: GateCondition[];
  failureStrategy: FailureStrategy;
  failureStrategyMaxRetries?: number;
  mcpSkills: string[];
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  source: TemplateSource;
  stages: PipelineStageConfig[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStageRun {
  id: string;
  configId: string;
  name: string;
  type: StageType;
  status: StageStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  durationMs: number;
  tokensUsed: number;
  output: StageOutput | null;
}

export interface StageOutput {
  type: StageType;
  messages?: Message[];
  summary?: string;
  fileChanges?: FileChange[];
  testResult?: TestResult;
  reviewComments?: ReviewComment[];
  deployLog?: DeployLog;
}

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  failures: TestFailure[];
  repairAttempts?: RepairAttempt[];
}

export interface TestFailure {
  testName: string;
  filePath: string;
  lineNumber: number;
  errorMessage: string;
  stackTrace?: string;
}

export interface RepairAttempt {
  attemptNumber: number;
  description: string;
  timestamp: Date;
  success: boolean;
}

export interface ReviewComment {
  id: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  category: "bug" | "style" | "performance" | "security";
  severity: "critical" | "major" | "minor" | "info";
  description: string;
  fixed?: boolean;
}

export interface DeployLog {
  target: {
    environment: string;
    url: string;
  };
  logs: string[];
  result: "success" | "failed";
  verificationResult?: {
    passed: boolean;
    checks: { name: string; passed: boolean; message?: string }[];
  };
}

export interface PipelineRun {
  id: string;
  projectId: string;
  title: string;
  templateId: string;
  templateName: string;
  triggerDescription: string;
  status: "running" | "completed" | "failed" | "aborted";
  stages: PipelineStageRun[];
  currentStageIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRunForm {
  templateId: string;
  triggerDescription: string;
}

export interface CreateTemplateForm {
  name: string;
  description: string;
  stages: PipelineStageConfig[];
}
