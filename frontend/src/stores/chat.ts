import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type {
  Session,
  Message,
  FileNode,
  FileChange,
  AgentInfo,
  AgentStatus,
  TokenUsage,
  ModeType,
  SidebarTab,
  DiffViewMode,
  FileChangeType,
} from "@shared/types/chat";

function generateMockFileTree(): FileNode[] {
  return [
    {
      id: "root",
      name: "src",
      path: "src",
      type: "directory",
      children: [
        {
          id: "components",
          name: "components",
          path: "src/components",
          type: "directory",
          children: [
            {
              id: "btn",
              name: "Button.vue",
              path: "src/components/Button.vue",
              type: "file",
            },
            {
              id: "input",
              name: "Input.vue",
              path: "src/components/Input.vue",
              type: "file",
            },
          ],
        },
        {
          id: "auth",
          name: "auth",
          path: "src/auth",
          type: "directory",
          children: [
            {
              id: "login",
              name: "login.ts",
              path: "src/auth/login.ts",
              type: "file",
              changeType: "added" as FileChangeType,
            },
          ],
        },
        {
          id: "utils",
          name: "utils",
          path: "src/utils",
          type: "directory",
          children: [
            {
              id: "api",
              name: "api.ts",
              path: "src/utils/api.ts",
              type: "file",
              changeType: "modified" as FileChangeType,
            },
          ],
        },
        {
          id: "styles",
          name: "styles",
          path: "src/styles",
          type: "directory",
          children: [
            {
              id: "main",
              name: "main.css",
              path: "src/styles/main.css",
              type: "file",
              changeType: "deleted" as FileChangeType,
            },
          ],
        },
        {
          id: "app",
          name: "App.vue",
          path: "src/App.vue",
          type: "file",
        },
        {
          id: "main",
          name: "main.ts",
          path: "src/main.ts",
          type: "file",
        },
      ],
    },
    {
      id: "pkg",
      name: "package.json",
      path: "package.json",
      type: "file",
    },
    {
      id: "tsconfig",
      name: "tsconfig.json",
      path: "tsconfig.json",
      type: "file",
    },
  ];
}

function generateMockDiffLines(): FileChange["diffLines"] {
  return [
    { type: "context", content: "import { ref } from 'vue';" },
    { type: "context", content: "import { defineStore } from 'pinia';" },
    { type: "context", content: "" },
    { type: "removed", content: "export const useAuthStore = defineStore('auth', () => {" },
    { type: "added", content: "export const useAuthStore = defineStore('auth', () => {" },
    { type: "context", content: "  const token = ref<string | null>(null);" },
    { type: "context", content: "" },
    { type: "added", content: "  function setToken(newToken: string): void {" },
    { type: "added", content: "    token.value = newToken;" },
    { type: "added", content: "  }" },
    { type: "context", content: "" },
    { type: "removed", content: "  return { token };" },
    { type: "added", content: "  return { token, setToken };" },
    { type: "context", content: "});" },
  ];
}

function generateMockMessages(sessionId: string): Message[] {
  const now = new Date();
  return [
    {
      id: `msg-${sessionId}-1`,
      sessionId,
      type: "user",
      content: "帮我实现用户登录模块，需要支持 JWT token 和本地存储",
      createdAt: new Date(now.getTime() - 1000 * 60 * 10),
    },
    {
      id: `msg-${sessionId}-2`,
      sessionId,
      type: "thinking",
      summary: "Analyzing project structure...",
      content:
        "1. 检查现有项目结构\n2. 识别 Vue 3 + Pinia 技术栈\n3. 确定需要在 stores/ 目录下创建 auth store\n4. 计划创建 login composable\n5. 需要添加本地存储持久化逻辑",
      createdAt: new Date(now.getTime() - 1000 * 60 * 9),
    },
    {
      id: `msg-${sessionId}-3`,
      sessionId,
      type: "file-op",
      operations: [
        {
          filePath: "src/stores/auth.ts",
          changeType: "added",
          summary: "+42 lines",
          diffLines: generateMockDiffLines(),
        },
        {
          filePath: "src/composables/useAuth.ts",
          changeType: "added",
          summary: "+28 lines",
          diffLines: generateMockDiffLines(),
        },
      ],
      createdAt: new Date(now.getTime() - 1000 * 60 * 8),
    },
    {
      id: `msg-${sessionId}-4`,
      sessionId,
      type: "command",
      command: "npm install jsonwebtoken",
      output: "added 12 packages in 2.3s",
      success: true,
      createdAt: new Date(now.getTime() - 1000 * 60 * 7),
    },
    {
      id: `msg-${sessionId}-5`,
      sessionId,
      type: "text",
      content:
        "我已经为你实现了用户登录模块：\n\n- 创建了 `src/stores/auth.ts` Pinia store\n- 创建了 `src/composables/useAuth.ts` composable\n- 支持 JWT token 管理\n- 添加了 localStorage 持久化\n\n你可以通过 `useAuth()` 获取登录状态和方法。",
      createdAt: new Date(now.getTime() - 1000 * 60 * 6),
    },
    {
      id: `msg-${sessionId}-6`,
      sessionId,
      type: "confirm",
      description: "需要运行测试来验证登录模块的正确性",
      action: "run tests",
      resolved: false,
      createdAt: new Date(now.getTime() - 1000 * 60 * 5),
    },
  ];
}

function generateMockSessions(): Session[] {
  const now = new Date();
  const session1: Session = {
    id: "session-1",
    projectId: "project-1",
    title: "实现用户登录模块",
    status: "running",
    turnCount: 12,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
    updatedAt: now,
    messages: generateMockMessages("session-1"),
    fileChanges: [
      {
        filePath: "src/stores/auth.ts",
        changeType: "added",
        summary: "+42 lines",
        diffLines: generateMockDiffLines(),
      },
      {
        filePath: "src/composables/useAuth.ts",
        changeType: "added",
        summary: "+28 lines",
        diffLines: generateMockDiffLines(),
      },
      {
        filePath: "src/utils/api.ts",
        changeType: "modified",
        summary: "+5 -2 lines",
        diffLines: generateMockDiffLines(),
      },
      {
        filePath: "src/styles/main.css",
        changeType: "deleted",
        summary: "-120 lines",
        diffLines: generateMockDiffLines(),
      },
    ],
  };

  const session2: Session = {
    id: "session-2",
    projectId: "project-1",
    title: "修复分页组件 bug",
    status: "ended",
    turnCount: 8,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 23),
    messages: [],
    fileChanges: [],
  };

  const session3: Session = {
    id: "session-3",
    projectId: "project-1",
    title: "优化数据库查询性能",
    status: "ended",
    turnCount: 5,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 47),
    messages: [],
    fileChanges: [],
  };

  return [session1, session2, session3];
}

export const useChatStore = defineStore("chat", () => {
  // Agent
  const currentAgent = ref<AgentInfo>({
    type: "claude-code",
    name: "Claude Code",
  });
  const agentStatus = ref<AgentStatus>("thinking");
  const mode = ref<ModeType>("manual");
  const tokenUsage = ref<TokenUsage>({
    input: 12450,
    output: 8932,
    total: 21382,
    estimatedCost: "$0.64",
  });

  // Sessions
  const sessions = ref<Session[]>(generateMockSessions());
  const activeSessionId = ref<string | null>("session-1");
  const activeSession = computed<Session | null>(
    () => sessions.value.find((s) => s.id === activeSessionId.value) ?? null
  );

  // File tree
  const fileTree = ref<FileNode[]>(generateMockFileTree());

  // Sidebar
  const sidebarTab = ref<SidebarTab>("sessions");

  // Diff panel
  const diffPanelOpen = ref(false);
  const diffPanelFilePath = ref<string | null>(null);
  const diffViewMode = ref<DiffViewMode>("side-by-side");

  // Computed
  const currentFileChange = computed<FileChange | null>(() => {
    if (!diffPanelFilePath.value || !activeSession.value) return null;
    return (
      activeSession.value.fileChanges.find((fc) => fc.filePath === diffPanelFilePath.value) ?? null
    );
  });

  const changedFilePaths = computed(() => {
    if (!activeSession.value) return [];
    return activeSession.value.fileChanges.map((fc) => fc.filePath);
  });

  // Session actions
  function createSession(): Session {
    const id = `session-${Date.now()}`;
    const session: Session = {
      id,
      projectId: "project-1",
      title: "New Session",
      status: "running",
      turnCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      fileChanges: [],
    };
    sessions.value.unshift(session);
    activeSessionId.value = id;
    return session;
  }

  function selectSession(sessionId: string): void {
    activeSessionId.value = sessionId;
  }

  function renameSession(sessionId: string, title: string): void {
    const session = sessions.value.find((s) => s.id === sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date();
    }
  }

  function deleteSession(sessionId: string): void {
    const idx = sessions.value.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      sessions.value.splice(idx, 1);
      if (activeSessionId.value === sessionId) {
        activeSessionId.value = sessions.value[0]?.id ?? null;
      }
    }
  }

  function archiveSession(sessionId: string): void {
    const session = sessions.value.find((s) => s.id === sessionId);
    if (session) {
      session.status = "ended";
      session.updatedAt = new Date();
    }
  }

  // Message actions
  function sendMessage(content: string): void {
    if (!activeSession.value) return;
    const session = activeSession.value;
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sessionId: session.id,
      type: "user",
      content,
      createdAt: new Date(),
    };
    session.messages.push(userMsg);
    session.turnCount++;
    session.updatedAt = new Date();

    // Simulate agent response
    agentStatus.value = "thinking";
    setTimeout(() => {
      if (!activeSession.value) return;
      const thinkingMsg: Message = {
        id: `msg-${Date.now()}-thinking`,
        sessionId: session.id,
        type: "thinking",
        summary: "Processing your request...",
        content: "1. Analyzing the request\n2. Searching codebase\n3. Planning implementation",
        createdAt: new Date(),
      };
      activeSession.value.messages.push(thinkingMsg);
      agentStatus.value = "idle";
    }, 1500);
  }

  function resolveConfirm(messageId: string, allowed: boolean): void {
    if (!activeSession.value) return;
    const msg = activeSession.value.messages.find((m) => m.id === messageId);
    if (msg && msg.type === "confirm") {
      msg.resolved = true;
      msg.allowed = allowed;
    }
  }

  // Diff panel actions
  function openDiffPanel(filePath: string): void {
    diffPanelFilePath.value = filePath;
    diffPanelOpen.value = true;
  }

  function closeDiffPanel(): void {
    diffPanelOpen.value = false;
    diffPanelFilePath.value = null;
  }

  function setDiffViewMode(viewMode: DiffViewMode): void {
    diffViewMode.value = viewMode;
  }

  function toggleDiffPanel(): void {
    diffPanelOpen.value = !diffPanelOpen.value;
  }

  // Sidebar actions
  function setSidebarTab(tab: SidebarTab): void {
    sidebarTab.value = tab;
  }

  // Mode actions
  function setMode(newMode: ModeType): void {
    mode.value = newMode;
  }

  // Agent actions
  function setAgentStatus(status: AgentStatus): void {
    agentStatus.value = status;
  }

  return {
    currentAgent,
    agentStatus,
    mode,
    tokenUsage,
    sessions,
    activeSessionId,
    activeSession,
    fileTree,
    sidebarTab,
    diffPanelOpen,
    diffPanelFilePath,
    diffViewMode,
    currentFileChange,
    changedFilePaths,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    archiveSession,
    sendMessage,
    resolveConfirm,
    openDiffPanel,
    closeDiffPanel,
    setDiffViewMode,
    toggleDiffPanel,
    setSidebarTab,
    setMode,
    setAgentStatus,
  };
});
