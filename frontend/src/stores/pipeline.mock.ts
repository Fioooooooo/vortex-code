import type {
  PipelineRun,
  PipelineTemplate,
  PipelineStageRun,
  PipelineStageConfig,
  StageStatus,
  StageType,
  TestResult,
  ReviewComment,
  DeployLog,
} from "@shared/types/pipeline";
import type { Message } from "@shared/types/chat";

const BUILTIN_TEMPLATES: PipelineTemplate[] = [
  {
    id: "template-full-cycle",
    name: "Full Cycle",
    description: "Complete pipeline from requirement discussion to deployment",
    source: "built-in",
    isDefault: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    stages: [
      {
        id: "stage-discuss",
        type: "discuss",
        name: "需求讨论",
        promptTemplate:
          "Analyze the following requirement and break it down into actionable tasks.\n\nProject: {{project_name}}\nPrevious context: {{previous_stage_output}}\n\nRequirement: {{trigger_description}}",
        agentId: null,
        gateConditions: [
          { id: "gate-1", type: "manual-approval", params: {}, description: "需要人工确认方案" },
        ],
        failureStrategy: "pause",
        mcpSkills: [],
      },
      {
        id: "stage-code",
        type: "code",
        name: "代码编写",
        promptTemplate:
          "Implement the approved tasks for project {{project_name}}.\n\nTasks: {{previous_stage_output}}",
        agentId: null,
        gateConditions: [],
        failureStrategy: "retry",
        failureStrategyMaxRetries: 2,
        mcpSkills: ["file-write", "command-exec"],
      },
      {
        id: "stage-test",
        type: "test",
        name: "单元测试",
        promptTemplate:
          "Write and run unit tests for the changes made in the previous stage.\n\nProject: {{project_name}}",
        agentId: null,
        gateConditions: [
          {
            id: "gate-2",
            type: "test-pass-rate",
            params: { minRate: 100 },
            description: "测试通过率 = 100%",
          },
          {
            id: "gate-3",
            type: "coverage-threshold",
            params: { minCoverage: 80 },
            description: "覆盖率 >= 80%",
          },
        ],
        failureStrategy: "retry",
        failureStrategyMaxRetries: 3,
        mcpSkills: ["test-runner"],
      },
      {
        id: "stage-review",
        type: "review",
        name: "代码审查",
        promptTemplate:
          "Review the code changes for quality, bugs, performance and security issues.\n\nProject: {{project_name}}",
        agentId: null,
        gateConditions: [
          {
            id: "gate-4",
            type: "no-critical-review",
            params: {},
            description: "无 critical 级别审查意见",
          },
        ],
        failureStrategy: "pause",
        mcpSkills: [],
      },
      {
        id: "stage-deploy",
        type: "deploy",
        name: "部署",
        promptTemplate:
          "Deploy the approved changes to the staging environment.\n\nProject: {{project_name}}",
        agentId: null,
        gateConditions: [],
        failureStrategy: "abort",
        mcpSkills: ["deploy"],
      },
    ],
  },
  {
    id: "template-quick-fix",
    name: "Quick Fix",
    description: "Fast track for small bug fixes and minor changes",
    source: "built-in",
    isDefault: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    stages: [
      {
        id: "stage-code-quick",
        type: "code",
        name: "代码编写",
        promptTemplate:
          "Fix the described issue for project {{project_name}}.\n\nIssue: {{trigger_description}}",
        agentId: null,
        gateConditions: [],
        failureStrategy: "retry",
        failureStrategyMaxRetries: 2,
        mcpSkills: ["file-write", "command-exec"],
      },
      {
        id: "stage-test-quick",
        type: "test",
        name: "单元测试",
        promptTemplate: "Run tests to verify the fix.\n\nProject: {{project_name}}",
        agentId: null,
        gateConditions: [
          {
            id: "gate-q1",
            type: "test-pass-rate",
            params: { minRate: 100 },
            description: "测试通过率 = 100%",
          },
        ],
        failureStrategy: "retry",
        failureStrategyMaxRetries: 2,
        mcpSkills: ["test-runner"],
      },
      {
        id: "stage-deploy-quick",
        type: "deploy",
        name: "部署",
        promptTemplate: "Deploy the fix to production.\n\nProject: {{project_name}}",
        agentId: null,
        gateConditions: [],
        failureStrategy: "abort",
        mcpSkills: ["deploy"],
      },
    ],
  },
  {
    id: "template-review-deploy",
    name: "Review & Deploy",
    description: "Review existing changes and deploy",
    source: "built-in",
    isDefault: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    stages: [
      {
        id: "stage-review-only",
        type: "review",
        name: "代码审查",
        promptTemplate: "Review the pending changes for project {{project_name}}.",
        agentId: null,
        gateConditions: [
          { id: "gate-r1", type: "manual-approval", params: {}, description: "需要人工审批" },
        ],
        failureStrategy: "pause",
        mcpSkills: [],
      },
      {
        id: "stage-deploy-only",
        type: "deploy",
        name: "部署",
        promptTemplate: "Deploy the reviewed changes.\n\nProject: {{project_name}}",
        agentId: null,
        gateConditions: [],
        failureStrategy: "abort",
        mcpSkills: ["deploy"],
      },
    ],
  },
];

function createMockMessages(): Message[] {
  return [
    {
      id: "msg-1",
      sessionId: "discuss-session",
      type: "user",
      content: "实现用户头像上传功能，支持 JPG/PNG 格式，最大 5MB",
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
    },
    {
      id: "msg-2",
      sessionId: "discuss-session",
      type: "thinking",
      summary: "分析需求中...",
      content: "1. 需要支持文件上传\n2. 需要图片格式验证\n3. 需要大小限制\n4. 需要存储方案",
      createdAt: new Date(Date.now() - 1000 * 60 * 9),
    },
    {
      id: "msg-3",
      sessionId: "discuss-session",
      type: "text",
      content:
        "已分析完成。建议方案：\n\n- 前端使用 input type=file 组件\n- 后端使用 multer 处理上传\n- 存储到本地文件系统\n- 生成缩略图\n\n是否确认此方案？",
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
    },
  ];
}

function createMockTestResult(): TestResult {
  return {
    passed: 12,
    failed: 1,
    skipped: 2,
    coverage: 78.5,
    failures: [
      {
        testName: "should reject file larger than 5MB",
        filePath: "src/utils/upload.test.ts",
        lineNumber: 45,
        errorMessage: "Expected rejection but received success",
      },
    ],
    repairAttempts: [
      {
        attemptNumber: 1,
        description: "修复大小校验逻辑",
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        success: false,
      },
    ],
  };
}

function createMockReviewComments(): ReviewComment[] {
  return [
    {
      id: "review-1",
      filePath: "src/components/AvatarUploader.vue",
      lineStart: 23,
      lineEnd: 28,
      category: "bug",
      severity: "major",
      description: "未处理文件类型校验失败的情况，可能导致未定义行为",
    },
    {
      id: "review-2",
      filePath: "src/utils/upload.ts",
      lineStart: 15,
      lineEnd: 15,
      category: "performance",
      severity: "minor",
      description: "建议使用 FileReader 分块读取大文件",
    },
    {
      id: "review-3",
      filePath: "src/api/upload.ts",
      lineStart: 42,
      lineEnd: 45,
      category: "security",
      severity: "critical",
      description: "文件名未做 sanitization，存在路径遍历风险",
    },
  ];
}

function createMockDeployLog(): DeployLog {
  return {
    target: { environment: "staging", url: "https://staging.example.com" },
    logs: [
      "[10:23:01] 开始构建...",
      "[10:23:05] 安装依赖...",
      "[10:23:12] 构建成功",
      "[10:23:15] 上传构建产物...",
      "[10:23:20] 部署完成",
      "[10:23:21] 运行健康检查...",
    ],
    result: "success",
    verificationResult: {
      passed: true,
      checks: [
        { name: "HTTP 200", passed: true },
        { name: "API 响应时间 < 200ms", passed: true },
        { name: "上传端点可用", passed: true },
      ],
    },
  };
}

function createMockStageRunFromConfig(
  config: PipelineStageConfig,
  index: number,
  totalStages: number
): PipelineStageRun {
  let status: StageStatus = "pending";
  if (index < 2) {
    status = "passed";
  } else if (index === 2) {
    status = "running";
  }

  const startedAt =
    index <= 2 ? new Date(Date.now() - 1000 * 60 * (totalStages - index) * 5) : null;
  const endedAt =
    index < 2 ? new Date(Date.now() - 1000 * 60 * (totalStages - index - 1) * 5) : null;
  const durationMs = startedAt && endedAt ? endedAt.getTime() - startedAt.getTime() : 0;

  let output: PipelineStageRun["output"] = null;

  if (config.type === "discuss" && status === "passed") {
    output = {
      type: "discuss",
      messages: createMockMessages(),
      summary: "任务：实现用户头像上传功能\n技术方案：前端input+后端multer+本地存储",
    };
  } else if (config.type === "code" && status === "passed") {
    output = {
      type: "code",
      messages: createMockMessages().map((m) => ({ ...m, id: `code-${m.id}` })),
      fileChanges: [
        {
          filePath: "src/components/AvatarUploader.vue",
          changeType: "added",
          summary: "+86 lines",
          diffLines: [],
        },
        {
          filePath: "src/utils/upload.ts",
          changeType: "added",
          summary: "+42 lines",
          diffLines: [],
        },
      ],
    };
  } else if (config.type === "test" && status === "running") {
    output = { type: "test", testResult: createMockTestResult() };
  } else if (config.type === "review" && status === "pending") {
    output = { type: "review", reviewComments: createMockReviewComments() };
  } else if (config.type === "deploy" && status === "pending") {
    output = { type: "deploy", deployLog: createMockDeployLog() };
  }

  return {
    id: `run-stage-${config.id}`,
    configId: config.id,
    name: config.name,
    type: config.type,
    status,
    startedAt,
    endedAt,
    durationMs,
    tokensUsed: Math.floor(Math.random() * 5000) + 1000,
    output,
  };
}

export function generateMockRuns(templates: PipelineTemplate[]): PipelineRun[] {
  const fullCycle = templates.find((t) => t.id === "template-full-cycle")!;

  const now = new Date();

  const run1: PipelineRun = {
    id: "run-1",
    projectId: "project-1",
    title: "用户头像上传功能",
    templateId: fullCycle.id,
    templateName: fullCycle.name,
    triggerDescription: "实现用户头像上传功能",
    status: "running",
    stages: fullCycle.stages.map((s, i) =>
      createMockStageRunFromConfig(s, i, fullCycle.stages.length)
    ),
    currentStageIndex: 2,
    createdAt: new Date(now.getTime() - 1000 * 60 * 30),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 5),
  };

  const run2: PipelineRun = {
    id: "run-2",
    projectId: "project-1",
    title: "修复分页组件 bug",
    templateId: "template-quick-fix",
    templateName: "Quick Fix",
    triggerDescription: "修复分页组件在最后一页时显示错误的 bug",
    status: "completed",
    stages: [
      {
        id: "rs-code-1",
        configId: "stage-code-quick",
        name: "代码编写",
        type: "code",
        status: "passed",
        startedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        endedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1.8),
        durationMs: 1000 * 60 * 12,
        tokensUsed: 3200,
        output: null,
      },
      {
        id: "rs-test-1",
        configId: "stage-test-quick",
        name: "单元测试",
        type: "test",
        status: "passed",
        startedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1.7),
        endedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1.6),
        durationMs: 1000 * 60 * 6,
        tokensUsed: 1800,
        output: null,
      },
      {
        id: "rs-deploy-1",
        configId: "stage-deploy-quick",
        name: "部署",
        type: "deploy",
        status: "passed",
        startedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1.5),
        endedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1.45),
        durationMs: 1000 * 60 * 3,
        tokensUsed: 500,
        output: null,
      },
    ],
    currentStageIndex: 2,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1.45),
  };

  const run3: PipelineRun = {
    id: "run-3",
    projectId: "project-1",
    title: "优化数据库查询性能",
    templateId: "template-review-deploy",
    templateName: "Review & Deploy",
    triggerDescription: "优化数据库查询性能，添加索引",
    status: "failed",
    stages: [
      {
        id: "rs-review-1",
        configId: "stage-review-only",
        name: "代码审查",
        type: "review",
        status: "failed",
        startedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5),
        endedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4.5),
        durationMs: 1000 * 60 * 30,
        tokensUsed: 4500,
        output: { type: "review", reviewComments: createMockReviewComments() },
      },
      {
        id: "rs-deploy-2",
        configId: "stage-deploy-only",
        name: "部署",
        type: "deploy",
        status: "skipped",
        startedAt: null,
        endedAt: null,
        durationMs: 0,
        tokensUsed: 0,
        output: null,
      },
    ],
    currentStageIndex: 0,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4.5),
  };

  return [run1, run2, run3];
}

function generateMockCustomTemplates(): PipelineTemplate[] {
  return [
    {
      id: "custom-template-1",
      name: "Frontend Only",
      description: "Frontend development pipeline without deployment",
      source: "custom",
      isDefault: false,
      createdAt: new Date("2026-03-15"),
      updatedAt: new Date("2026-03-15"),
      stages: [
        {
          id: "ct-discuss",
          type: "discuss",
          name: "需求讨论",
          promptTemplate: "Discuss frontend requirements for {{project_name}}",
          agentId: null,
          gateConditions: [],
          failureStrategy: "pause",
          mcpSkills: [],
        },
        {
          id: "ct-code",
          type: "code",
          name: "代码编写",
          promptTemplate: "Implement frontend changes for {{project_name}}",
          agentId: null,
          gateConditions: [],
          failureStrategy: "retry",
          failureStrategyMaxRetries: 2,
          mcpSkills: ["file-write"],
        },
      ],
    },
  ];
}

export function generateMockTemplates(): PipelineTemplate[] {
  return [...BUILTIN_TEMPLATES, ...generateMockCustomTemplates()];
}

export function createDefaultStage(
  type: StageType = "discuss",
  index: number = 0
): PipelineStageConfig {
  const typeNames: Record<StageType, string> = {
    discuss: "需求讨论",
    code: "代码编写",
    test: "单元测试",
    review: "代码审查",
    deploy: "部署",
    custom: "自定义阶段",
  };

  const defaultPrompts: Record<StageType, string> = {
    discuss: "分析需求并拆解任务\n\n项目: {{project_name}}",
    code: "编写代码实现\n\n项目: {{project_name}}\n输入: {{previous_stage_output}}",
    test: "编写并运行测试\n\n项目: {{project_name}}",
    review: "审查代码变更\n\n项目: {{project_name}}",
    deploy: "部署到目标环境\n\n项目: {{project_name}}",
    custom: "执行自定义任务\n\n项目: {{project_name}}",
  };

  return {
    id: `stage-${Date.now()}-${index}`,
    type,
    name: typeNames[type],
    promptTemplate: defaultPrompts[type],
    agentId: null,
    gateConditions: [],
    failureStrategy: "pause",
    mcpSkills: [],
  };
}
