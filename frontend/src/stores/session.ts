import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { Session, Message } from "@shared/types/chat";

function generateMockMessages(sessionId: string): Message[] {
  const now = new Date();
  return [
    {
      id: `msg-${sessionId}-1`,
      role: "user",
      parts: [{ type: "text", text: "帮我实现用户登录模块，需要支持 JWT token 和本地存储" }],
      metadata: { sessionId, createdAt: new Date(now.getTime() - 1000 * 60 * 10) },
    },
    {
      id: `msg-${sessionId}-2`,
      role: "assistant",
      parts: [
        {
          type: "reasoning",
          text: "1. 检查现有项目结构\n2. 识别 Vue 3 + Pinia 技术栈\n3. 确定需要在 stores/ 目录下创建 auth store\n4. 计划创建 login composable\n5. 需要添加本地存储持久化逻辑",
        },
      ],
      metadata: { sessionId, createdAt: new Date(now.getTime() - 1000 * 60 * 9) },
    },
    {
      id: `msg-${sessionId}-3`,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "我已经为你实现了用户登录模块：\n\n- 创建了 `src/stores/auth.ts` Pinia store\n- 创建了 `src/composables/useAuth.ts` composable\n- 支持 JWT token 管理\n- 添加了 localStorage 持久化\n\n你可以通过 `useAuth()` 获取登录状态和方法。",
        },
      ],
      metadata: { sessionId, createdAt: new Date(now.getTime() - 1000 * 60 * 6) },
    },
  ];
}

function generateMockSessions(): Session[] {
  const now = new Date();
  return [
    {
      id: "session-1",
      projectId: "project-1",
      title: "实现用户登录模块",
      status: "running",
      turnCount: 12,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
      updatedAt: now,
      messages: generateMockMessages("session-1"),
    },
    {
      id: "session-2",
      projectId: "project-1",
      title: "修复分页组件 bug",
      status: "ended",
      turnCount: 8,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 23),
      messages: [],
    },
    {
      id: "session-3",
      projectId: "project-1",
      title: "优化数据库查询性能",
      status: "ended",
      turnCount: 5,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 47),
      messages: [],
    },
  ];
}

export const useSessionStore = defineStore("session", () => {
  const sessions = ref<Session[]>(generateMockSessions());
  const activeSessionId = ref<string | null>("session-1");
  const activeSession = computed<Session | null>(
    () => sessions.value.find((s) => s.id === activeSessionId.value) ?? null
  );

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

  return {
    sessions,
    activeSessionId,
    activeSession,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
  };
});
