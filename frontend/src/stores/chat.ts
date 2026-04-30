import { ref } from "vue";
import { defineStore } from "pinia";
import type { DynamicToolUIPart } from "ai";
import type { ChatAgent } from "@shared/types/chat-agent";
import type { ChatStatus, TokenUsage, ModeType, Message } from "@shared/types/chat";
import { useSessionStore } from "./session";
import { useProjectStore } from "./project";

export const useChatStore = defineStore("chat", () => {
  const currentAgent = ref<ChatAgent>({
    id: "claude-acp",
    name: "Claude Code",
    acpAgentId: "claude-acp",
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
    const projectStore = useProjectStore();
    const session = sessionStore.activeSession;
    const projectId = projectStore.currentProject?.id ?? session?.projectId;
    if (!session || !projectId) return;

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

    // Persist user message immediately, before assistant reply arrives
    window.api.chat
      .persistMessage(session.id, projectId, JSON.parse(JSON.stringify(userMsg)) as Message)
      .catch((err: unknown) => {
        console.error("Failed to persist user message:", err);
      });

    let activeAssistantId: string | null = null;
    // Index of the text part currently being streamed into; reset after each tool_call_start
    let activeTextPartIdx: number = -1;

    function ensureAssistantMessage(): Message {
      if (activeAssistantId) {
        const existing = session!.messages.find((m) => m.id === activeAssistantId);
        if (existing) return existing;
      }
      const msg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [],
        metadata: { sessionId: session!.id, createdAt: new Date() },
      };
      session!.messages.push(msg);
      activeAssistantId = msg.id;
      activeTextPartIdx = -1;
      return msg;
    }

    window.api.chat.streamMessage(session.id, projectId, currentAgent.value.acpAgentId, content, {
      onChunk(data) {
        if (chatStatus.value === "submitted") {
          chatStatus.value = "streaming";
        }

        if (data.kind === "text_delta") {
          const msg = ensureAssistantMessage();
          const existingPart = activeTextPartIdx >= 0 ? msg.parts[activeTextPartIdx] : null;
          if (existingPart && existingPart.type === "text") {
            existingPart.text += data.text;
          } else {
            msg.parts.push({ type: "text", text: data.text });
            activeTextPartIdx = msg.parts.length - 1;
          }
        } else if (data.kind === "tool_call_start") {
          const msg = ensureAssistantMessage();
          const part: DynamicToolUIPart = {
            type: "dynamic-tool",
            toolCallId: data.toolCallId,
            toolName: data.toolName,
            state: "input-available",
            input: {},
          };
          msg.parts.push(part);
          // Next text_delta should create a new text part after this tool
          activeTextPartIdx = -1;
        } else if (data.kind === "tool_call_update") {
          if (!activeAssistantId) return;
          const msg = session!.messages.find((m) => m.id === activeAssistantId);
          if (!msg) return;
          const idx = msg.parts.findIndex(
            (p) => p.type === "dynamic-tool" && p.toolCallId === data.toolCallId
          );
          if (idx === -1) return;
          const prev = msg.parts[idx] as DynamicToolUIPart;
          const description =
            typeof data.input?.description === "string" ? data.input.description : undefined;

          if (data.status === "in_progress") {
            const needsUpdate = data.input || data.content;
            if (needsUpdate) {
              msg.parts.splice(idx, 1, {
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
            msg.parts.splice(idx, 1, updated);
          }
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
        session!.updatedAt = new Date();

        // Persist the completed assistant message
        if (finishedId) {
          const msg = session!.messages.find((m) => m.id === finishedId);
          console.log(
            "[chat] onDone persist finishedId=",
            finishedId,
            "msg=",
            msg?.role,
            "parts=",
            msg?.parts.length
          );
          if (msg) {
            // Deep-clone through JSON to strip any non-serializable values before IPC transfer
            const serializable = JSON.parse(JSON.stringify(msg)) as Message;
            window.api.chat
              .persistMessage(session!.id, projectId, serializable)
              .catch((err: unknown) => {
                console.error("Failed to persist message:", err);
              });
          }
        }
      },
      onError(err) {
        activeAssistantId = null;
        activeTextPartIdx = -1;
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
