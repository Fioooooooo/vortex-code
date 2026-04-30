import { ref } from "vue";
import { defineStore } from "pinia";
import { generateId, type DynamicToolUIPart } from "ai";
import { useToast } from "@nuxt/ui/composables";
import type { ChatStatus, Message, ModeType, Session, TokenUsage } from "@shared/types/chat";
import { chatApi } from "@renderer/api/chat";
import { useProjectStore } from "./project";
import { useSessionStore } from "./session";

function buildUserMessage(sessionId: string, content: string): Message {
  return {
    id: generateId(),
    role: "user",
    parts: [{ type: "text", text: content }],
    metadata: { sessionId, createdAt: new Date() },
  };
}

export const useChatStore = defineStore("chat", () => {
  const toast = useToast();
  const chatStatus = ref<ChatStatus>("ready");
  const mode = ref<ModeType>("manual");
  const tokenUsage = ref<TokenUsage>({
    input: 12450,
    output: 8932,
    total: 21382,
    estimatedCost: "$0.64",
  });

  function queueUserMessage(
    session: Session,
    content: string,
    sessionStore: ReturnType<typeof useSessionStore>
  ): Message {
    const userMessage = buildUserMessage(session.id, content);
    session.messages.push(userMessage);
    session.turnCount++;
    session.updatedAt = new Date();
    session.status = "running";
    sessionStore.sortSessions();
    return userMessage;
  }

  function persistMessage(sessionId: string, projectId: string, message: Message): void {
    void chatApi
      .persistMessage(sessionId, projectId, JSON.parse(JSON.stringify(message)) as Message)
      .catch((err: unknown) => {
        console.error("Failed to persist message:", err);
      });
  }

  function streamSessionMessage(
    activeSession: Session,
    projectId: string,
    prompt: string,
    sessionStore: ReturnType<typeof useSessionStore>
  ): void {
    let activeAssistantId: string | null = null;
    let activeTextPartIdx = -1;

    function ensureAssistantMessage(): Message {
      if (activeAssistantId) {
        const existing = activeSession.messages.find((message) => message.id === activeAssistantId);
        if (existing) return existing;
      }

      const message: Message = {
        id: generateId(),
        role: "assistant",
        parts: [],
        metadata: { sessionId: activeSession.id, createdAt: new Date() },
      };
      activeSession.messages.push(message);
      activeAssistantId = message.id;
      activeTextPartIdx = -1;
      return message;
    }

    chatApi.streamMessage(activeSession.id, projectId, activeSession.agentId, prompt, {
      onChunk(data) {
        if (chatStatus.value === "submitted") {
          chatStatus.value = "streaming";
        }

        if (data.kind === "text_delta") {
          const message = ensureAssistantMessage();
          const existingPart = activeTextPartIdx >= 0 ? message.parts[activeTextPartIdx] : null;
          if (existingPart && existingPart.type === "text") {
            existingPart.text += data.text;
          } else {
            message.parts.push({ type: "text", text: data.text });
            activeTextPartIdx = message.parts.length - 1;
          }
        } else if (data.kind === "tool_call_start") {
          const message = ensureAssistantMessage();
          const part: DynamicToolUIPart = {
            type: "dynamic-tool",
            toolCallId: data.toolCallId,
            toolName: data.title,
            state: "input-available",
            input: {},
          };
          message.parts.push(part);
          activeTextPartIdx = -1;
        } else if (data.kind === "tool_call_update") {
          if (!activeAssistantId) return;

          const message = activeSession.messages.find((item) => item.id === activeAssistantId);
          if (!message) return;

          const idx = message.parts.findIndex(
            (part) => part.type === "dynamic-tool" && part.toolCallId === data.toolCallId
          );
          if (idx === -1) return;

          const prev = message.parts[idx] as DynamicToolUIPart;
          const description =
            typeof data.input?.description === "string" ? data.input.description : undefined;

          if (data.status === "in_progress") {
            const needsUpdate = data.input || data.content;
            if (needsUpdate) {
              message.parts.splice(idx, 1, {
                type: "dynamic-tool",
                toolCallId: prev.toolCallId,
                toolName: prev.toolName,
                title: description ?? data.content,
                state: "input-available",
                input: data.input ?? prev.input,
              } as DynamicToolUIPart);
            }
          } else if (data.status === "completed" || data.status === "failed") {
            const updated: DynamicToolUIPart = {
              type: "dynamic-tool",
              toolCallId: prev.toolCallId,
              toolName: prev.toolName,
              title: prev.title,
              state: "output-available",
              input: prev.input,
              output: data.content ?? "",
            };
            message.parts.splice(idx, 1, updated);
          }
        } else if (data.kind === "session_info_update") {
          activeSession.title = data.title;
          activeSession.updatedAt = new Date();
          sessionStore.sortSessions();
        }
      },
      onDone(done) {
        const finishedId = activeAssistantId;
        activeAssistantId = null;
        activeTextPartIdx = -1;
        chatStatus.value = "ready";
        tokenUsage.value = {
          ...tokenUsage.value,
          output: tokenUsage.value.output + done.totalTokens,
          total: tokenUsage.value.total + done.totalTokens,
        };
        activeSession.updatedAt = new Date();
        activeSession.status = "ended";
        sessionStore.sortSessions();

        if (!finishedId) {
          return;
        }

        const message = activeSession.messages.find((item) => item.id === finishedId);
        if (!message) {
          return;
        }

        persistMessage(activeSession.id, projectId, message);
      },
      onError(err) {
        activeAssistantId = null;
        activeTextPartIdx = -1;
        chatStatus.value = "error";
        activeSession.status = "ended";
        activeSession.updatedAt = new Date();
        sessionStore.sortSessions();
        console.error("Stream error:", err.code, err.message);
      },
    });
  }

  async function sendMessage(content: string): Promise<void> {
    const prompt = content.trim();
    if (!prompt) {
      return;
    }

    const sessionStore = useSessionStore();
    const projectStore = useProjectStore();
    const currentSession = sessionStore.activeSession;
    const projectIdSnapshot = projectStore.currentProject?.id ?? currentSession?.projectId;

    if (!projectIdSnapshot) {
      return;
    }

    let activeSession = currentSession;

    if (!activeSession) {
      const draftAgentIdSnapshot = sessionStore.draftAgentId;
      if (!draftAgentIdSnapshot) {
        toast.add({
          title: "暂无可用 Agent",
          description: "请先安装 Agent 后再开始新会话",
          color: "error",
        });
        return;
      }

      chatStatus.value = "submitted";

      try {
        const createdSession = await sessionStore.createSession({
          projectId: projectIdSnapshot,
          agentId: draftAgentIdSnapshot,
          title: "New Session",
        });
        activeSession = sessionStore.activeSession ?? createdSession;
      } catch (error: unknown) {
        chatStatus.value = "ready";
        toast.add({
          title: "创建会话失败",
          description: error instanceof Error ? error.message : String(error),
          color: "error",
        });
        return;
      }
    }

    const userMessage = queueUserMessage(activeSession, prompt, sessionStore);
    chatStatus.value = "submitted";
    persistMessage(activeSession.id, projectIdSnapshot, userMessage);
    streamSessionMessage(activeSession, projectIdSnapshot, prompt, sessionStore);
  }

  function setMode(newMode: ModeType): void {
    mode.value = newMode;
  }

  return {
    chatStatus,
    mode,
    tokenUsage,
    sendMessage,
    setMode,
  };
});
