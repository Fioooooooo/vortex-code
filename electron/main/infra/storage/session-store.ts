import { promises as fs } from "fs";
import { join } from "path";
import { sessionsDir } from "@main/infra/storage/project-paths";
import type { AcpAvailableCommand, MessageMeta, TokenUsage } from "@shared/types/chat";
import type { UIMessage } from "ai";

export interface SessionMeta {
  sessionId: string;
  acpSessionId?: string;
  agentId: string;
  title: string;
  turnCount: number;
  tokenUsage: TokenUsage;
  available_commands?: AcpAvailableCommand[];
  createdAt: string;
  updatedAt: string;
}

export type SessionMetaPatch = Partial<
  Omit<SessionMeta, "sessionId" | "createdAt" | "tokenUsage">
> & {
  tokenUsage?: Partial<TokenUsage>;
};

type SessionMetaRecord = Record<string, unknown>;

const DEFAULT_TOKEN_USAGE: Pick<TokenUsage, "used" | "size"> = { used: 0, size: 0 };

function metaPath(projectPath: string, sessionId: string): string {
  return join(sessionsDir(projectPath), `${sessionId}.json`);
}

export function sessionMessagesPath(projectPath: string, sessionId: string): string {
  return join(sessionsDir(projectPath), `${sessionId}.messages.jsonl`);
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function readSessionMetaRecord(
  projectPath: string,
  sessionId: string
): Promise<SessionMetaRecord | null> {
  try {
    const content = await fs.readFile(metaPath(projectPath, sessionId), "utf8");
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as SessionMetaRecord;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeCost(cost: Partial<TokenUsage["cost"]> | null | undefined): TokenUsage["cost"] {
  if (typeof cost?.amount !== "number" || typeof cost.currency !== "string") {
    return undefined;
  }

  return {
    amount: cost.amount,
    currency: cost.currency,
  };
}

function normalizeTokenUsage(tokenUsage: Partial<TokenUsage> | null | undefined): TokenUsage {
  return {
    used: typeof tokenUsage?.used === "number" ? tokenUsage.used : DEFAULT_TOKEN_USAGE.used,
    size: typeof tokenUsage?.size === "number" ? tokenUsage.size : DEFAULT_TOKEN_USAGE.size,
    cost: normalizeCost(tokenUsage?.cost),
  };
}

function normalizeSessionMetaRecord(raw: SessionMetaRecord): SessionMetaRecord {
  return {
    ...raw,
    tokenUsage: normalizeTokenUsage(raw.tokenUsage as Partial<TokenUsage> | undefined),
    available_commands: Array.isArray(raw.available_commands) ? raw.available_commands : undefined,
  };
}

function toSessionMeta(record: SessionMetaRecord): SessionMeta {
  return normalizeSessionMetaRecord(record) as unknown as SessionMeta;
}

async function writeSessionMetaRecord(
  projectPath: string,
  record: SessionMetaRecord
): Promise<SessionMetaRecord> {
  const normalized = normalizeSessionMetaRecord(record);
  await ensureDir(sessionsDir(projectPath));
  await fs.writeFile(
    metaPath(projectPath, normalized.sessionId as string),
    JSON.stringify(normalized, null, 2),
    "utf8"
  );
  return normalized;
}

function mergeSessionMetaRecord(
  current: SessionMetaRecord,
  patch: SessionMetaPatch
): SessionMetaRecord {
  const nextTokenUsage =
    patch.tokenUsage === undefined
      ? current.tokenUsage
      : {
          ...(current.tokenUsage as Record<string, unknown> | undefined),
          ...patch.tokenUsage,
        };

  return {
    ...current,
    ...patch,
    sessionId: current.sessionId,
    createdAt: current.createdAt,
    tokenUsage: nextTokenUsage,
  };
}

export async function createSessionMeta(
  projectPath: string,
  meta: SessionMeta
): Promise<SessionMeta> {
  await writeSessionMetaRecord(projectPath, meta as unknown as SessionMetaRecord);
  return meta;
}

export async function saveSessionMeta(projectPath: string, meta: SessionMeta): Promise<void> {
  await writeSessionMetaRecord(projectPath, meta as unknown as SessionMetaRecord);
}

export async function loadSessionMeta(
  projectPath: string,
  sessionId: string
): Promise<SessionMeta | null> {
  const record = await readSessionMetaRecord(projectPath, sessionId);
  return record ? toSessionMeta(record) : null;
}

export async function listSessionMetas(projectPath: string): Promise<SessionMeta[]> {
  try {
    const dir = sessionsDir(projectPath);
    const files = await fs.readdir(dir);
    const metas: SessionMeta[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const content = await fs.readFile(join(dir, file), "utf8");
        metas.push(toSessionMeta(JSON.parse(content) as SessionMetaRecord));
      } catch {
        // skip malformed files
      }
    }
    return metas;
  } catch {
    return [];
  }
}

export async function patchSessionMeta(
  projectPath: string,
  sessionId: string,
  patch: SessionMetaPatch | ((currentMeta: SessionMeta) => SessionMetaPatch)
): Promise<SessionMeta | null> {
  const currentRecord = await readSessionMetaRecord(projectPath, sessionId);
  if (!currentRecord) {
    return null;
  }

  const currentMeta = toSessionMeta(currentRecord);
  const nextPatch = typeof patch === "function" ? patch(currentMeta) : patch;
  return toSessionMeta(
    await writeSessionMetaRecord(projectPath, mergeSessionMetaRecord(currentRecord, nextPatch))
  );
}

export async function upsertSessionMeta(
  projectPath: string,
  sessionId: string,
  create: () => SessionMeta,
  patch: SessionMetaPatch | ((currentMeta: SessionMeta) => SessionMetaPatch)
): Promise<SessionMeta> {
  const currentRecord =
    (await readSessionMetaRecord(projectPath, sessionId)) ??
    (create() as unknown as SessionMetaRecord);
  const currentMeta = toSessionMeta(currentRecord);
  const nextPatch = typeof patch === "function" ? patch(currentMeta) : patch;
  return toSessionMeta(
    await writeSessionMetaRecord(projectPath, mergeSessionMetaRecord(currentRecord, nextPatch))
  );
}

export async function deleteSession(projectPath: string, sessionId: string): Promise<void> {
  await Promise.allSettled([
    fs.unlink(metaPath(projectPath, sessionId)),
    fs.unlink(sessionMessagesPath(projectPath, sessionId)),
  ]);
}

export async function appendMessage(
  projectPath: string,
  sessionId: string,
  message: UIMessage<MessageMeta>
): Promise<void> {
  await ensureDir(sessionsDir(projectPath));
  const line = JSON.stringify(message) + "\n";
  await fs.appendFile(sessionMessagesPath(projectPath, sessionId), line, "utf8");
}

export async function loadMessages(
  projectPath: string,
  sessionId: string
): Promise<UIMessage<MessageMeta>[]> {
  try {
    const content = await fs.readFile(sessionMessagesPath(projectPath, sessionId), "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as UIMessage<MessageMeta>);
  } catch {
    return [];
  }
}
