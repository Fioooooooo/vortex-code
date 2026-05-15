import { EventEmitter } from "events";
import type { SessionNotification } from "@agentclientprotocol/sdk";
import { loadSessionMeta, upsertSessionMeta } from "@main/infra/storage/session-store";
import { mapSessionUpdate } from "./acp-mapper";
import { getOrStartProcess } from "@main/infra/process/acp-process-pool";
import type { SessionEvent } from "@main/domain/chat/session-events";
import logger from "@main/infra/logger";
import { getBundledMcpServers, toAcpMcpServerEnv } from "@main/infra/mcp/bundled-mcp-servers";
import type { SessionOwner } from "@main/services/chat/session-registry";
import type { TextUIPart } from "ai";
import { resolveSystemReminder } from "@main/services/chat/system-reminder";

interface ReminderContext {
  changeId?: string;
  stageIndex?: number;
  runId?: string;
}

export interface AcpSessionOpts {
  fylloSessionId: string;
  agentId: string;
  projectPath: string;
  cwd: string;
  owner: SessionOwner;
  reminderContext?: ReminderContext;
  onReminderInjected?: (reminderPart: TextUIPart) => Promise<void>;
}

export class AcpSession extends EventEmitter {
  private acpSessionId: string | null = null;
  private cancelled = false;

  constructor(private readonly opts: AcpSessionOpts) {
    super();
  }

  async start(prompt: string): Promise<void> {
    const { fylloSessionId, agentId, projectPath, cwd } = this.opts;

    let entry: Awaited<ReturnType<typeof getOrStartProcess>>;
    try {
      entry = await getOrStartProcess(agentId);
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      this.emit("event", {
        type: "error",
        code: e.code ?? "ACP_ERROR",
        message: e.message,
      } satisfies SessionEvent);
      return;
    }

    const { connection, sessionHandlers } = entry;
    const mcpServers = getBundledMcpServers({ projectPath }).map((spec) => ({
      ...spec,
      env: toAcpMcpServerEnv(spec.env),
    }));

    // Load persisted acpSessionId
    const meta = await loadSessionMeta(projectPath, fylloSessionId);
    let acpSessionId = meta?.acpSessionId;
    let createdNewSession = false;

    if (acpSessionId) {
      try {
        await connection.resumeSession({ sessionId: acpSessionId, cwd, mcpServers });
      } catch {
        // resumeSession fallback治理（历史消息回放、sessionId 迁移等）为独立后续工作。
        logger.warn(
          `[acp-session] resumeSession failed for ${acpSessionId}, falling back to newSession`
        );
        acpSessionId = undefined;
      }
    }

    if (!acpSessionId) {
      const res = await connection.newSession({ cwd, mcpServers });
      acpSessionId = res.sessionId;
      createdNewSession = true;
    }

    this.acpSessionId = acpSessionId;

    // Persist immediately through the centralized session-store updater so
    // future meta fields survive subsequent turn starts.
    await upsertSessionMeta(
      projectPath,
      fylloSessionId,
      () => ({
        sessionId: fylloSessionId,
        acpSessionId,
        agentId,
        title: meta?.title ?? "New Session",
        turnCount: (meta?.turnCount ?? 0) + 1,
        tokenUsage: meta?.tokenUsage ?? { used: 0, size: 0 },
        createdAt: meta?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      {
        acpSessionId,
        agentId,
        turnCount: (meta?.turnCount ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      }
    );

    this.emit("event", { type: "session_id_resolved", acpSessionId } satisfies SessionEvent);

    if (this.cancelled) return;

    // Register session update handler
    sessionHandlers.set(acpSessionId, (notification: SessionNotification) => {
      const event = mapSessionUpdate(notification.update);
      if (event) this.emit("event", event);
    });

    try {
      let reminderPart: TextUIPart | null = null;
      if (createdNewSession) {
        reminderPart = await resolveSystemReminder({
          owner: this.opts.owner,
          projectPath,
          cwd,
          fylloSessionId,
          agentId,
          ...(this.opts.reminderContext ?? {}),
        });
      }

      if (reminderPart !== null && this.opts.onReminderInjected) {
        try {
          await this.opts.onReminderInjected(reminderPart);
        } catch (err: unknown) {
          logger.error("[acp-session] onReminderInjected failed", err);
        }
      }

      const result = await connection.prompt({
        sessionId: acpSessionId,
        prompt:
          reminderPart === null
            ? [{ type: "text", text: prompt }]
            : [reminderPart, { type: "text", text: prompt }],
      });

      const totalTokens =
        (result as unknown as { usage?: { outputTokens?: number } }).usage?.outputTokens ?? 0;
      this.emit("event", { type: "done", totalTokens } satisfies SessionEvent);
    } catch (err: unknown) {
      if (this.cancelled) return;
      const e = err as Error;
      this.emit("event", {
        type: "error",
        code: "ACP_ERROR",
        message: e.message,
      } satisfies SessionEvent);
    } finally {
      sessionHandlers.delete(acpSessionId);
    }
  }

  cancel(): void {
    this.cancelled = true;
    const { agentId } = this.opts;
    const acpSessionId = this.acpSessionId;
    if (!acpSessionId) return;

    getOrStartProcess(agentId)
      .then(({ connection }) => connection.cancel({ sessionId: acpSessionId }))
      .catch(() => {});
  }
}
