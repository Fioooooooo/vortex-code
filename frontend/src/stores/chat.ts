import { ref } from "vue";
import { defineStore } from "pinia";
import type { AgentInfo, ChatStatus, TokenUsage, ModeType, Message } from "@shared/types/chat";
import { useSessionStore } from "./session";

export const useChatStore = defineStore("chat", () => {
  const currentAgent = ref<AgentInfo>({
    type: "claude-code",
    name: "Claude Code",
  });
  const chatStatus = ref<ChatStatus>("ready");
  const mode = ref<ModeType>("manual");
  const tokenUsage = ref<TokenUsage>({
    input: 12450,
    output: 8932,
    total: 21382,
    estimatedCost: "$0.64",
  });

  function sendMessage(content: string): void {
    const sessionStore = useSessionStore();
    const session = sessionStore.activeSession;
    if (!session) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      parts: [{ type: "text", text: content }],
      metadata: { sessionId: session.id, createdAt: new Date() },
    };
    session.messages.push(userMsg);
    session.turnCount++;
    session.updatedAt = new Date();
    chatStatus.value = "submitted";

    // Tracks the id of the current active assistant message for text_delta targeting
    let activeAssistantId: string | null = null;

    window.api.chat.streamMessage(session.id, session.projectId, content, {
      onChunk(data) {
        // First chunk: transition submitted → streaming
        if (chatStatus.value === "submitted") {
          chatStatus.value = "streaming";
        }

        if (data.kind === "text_delta") {
          const msg = activeAssistantId
            ? session.messages.find((m) => m.id === activeAssistantId)
            : null;
          if (msg) {
            const textPart = msg.parts.find((p) => p.type === "text");
            if (textPart && textPart.type === "text") {
              textPart.text += data.text;
            }
          }
        } else if (data.kind === "message_upsert") {
          const existingIdx = session.messages.findIndex((m) => m.id === data.message.id);
          if (existingIdx !== -1) {
            session.messages.splice(existingIdx, 1, data.message);
          } else {
            session.messages.push(data.message);
          }
          activeAssistantId = data.message.id;
        } else if (data.kind === "message_patch") {
          const msgIdx = session.messages.findIndex((m) => m.id === data.id);
          if (msgIdx !== -1) {
            session.messages[msgIdx] = { ...session.messages[msgIdx], parts: data.parts };
          }
        }
      },
      onDone(done) {
        chatStatus.value = "ready";
        tokenUsage.value = {
          ...tokenUsage.value,
          output: tokenUsage.value.output + done.totalTokens,
          total: tokenUsage.value.total + done.totalTokens,
        };
        session.updatedAt = new Date();
      },
      onError(err) {
        chatStatus.value = "error";
        console.error("Stream error:", err.code, err.message);
      },
    });
  }

  function setMode(newMode: ModeType): void {
    mode.value = newMode;
  }

  return {
    currentAgent,
    chatStatus,
    mode,
    tokenUsage,
    sendMessage,
    setMode,
  };
});
