import { promises as fs } from "fs";
import { join } from "path";
import { net } from "electron";
import type { AgentRegistry, AgentRegistryCache } from "@shared/types/agents";
import { getDataSubPath } from "@main/utils/paths";
import logger from "@main/utils/logger";
import { invalidateChangedIcons } from "./iconCache";

const REGISTRY_URL = "https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json";
const REGISTRY_TTL_MS = 24 * 60 * 60 * 1000;

let refreshPromise: Promise<AgentRegistry> | null = null;

function getRegistryCachePath(): string {
  return join(getDataSubPath("agents"), "registry-cache.json");
}

async function ensureAgentsDirectory(): Promise<void> {
  await fs.mkdir(getDataSubPath("agents"), { recursive: true });
}

export async function readRegistryCache(): Promise<AgentRegistryCache | null> {
  try {
    const content = await fs.readFile(getRegistryCachePath(), "utf8");
    return JSON.parse(content) as AgentRegistryCache;
  } catch {
    return null;
  }
}

export function isRegistryCacheExpired(cache: AgentRegistryCache): boolean {
  return Date.now() - cache.fetchedAt > REGISTRY_TTL_MS;
}

async function writeRegistryCache(data: AgentRegistry): Promise<void> {
  await ensureAgentsDirectory();

  const previousCache = await readRegistryCache();
  await invalidateChangedIcons(previousCache?.data ?? null, data);

  const payload: AgentRegistryCache = {
    fetchedAt: Date.now(),
    data,
  };

  await fs.writeFile(getRegistryCachePath(), JSON.stringify(payload, null, 2), "utf8");
}

async function fetchRegistryFromNetwork(): Promise<AgentRegistry> {
  const response = await net.fetch(REGISTRY_URL);
  if (!response.ok) {
    throw new Error(`获取 Agent registry 失败: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as AgentRegistry;
  if (!Array.isArray(data.agents)) {
    throw new Error("Agent registry 数据格式无效");
  }

  return data;
}

async function refreshRegistryInternal(
  onUpdated?: (registry: AgentRegistry) => void
): Promise<AgentRegistry> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const freshRegistry = await fetchRegistryFromNetwork();
      await writeRegistryCache(freshRegistry);
      onUpdated?.(freshRegistry);
      return freshRegistry;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getRegistry(
  options: {
    onUpdated?: (registry: AgentRegistry) => void;
  } = {}
): Promise<AgentRegistry> {
  const cache = await readRegistryCache();

  if (cache && !isRegistryCacheExpired(cache)) {
    return cache.data;
  }

  if (cache) {
    void refreshRegistryInternal(options.onUpdated).catch((error) => {
      logger.warn("[agents] background registry refresh failed", error);
    });
    return cache.data;
  }

  return refreshRegistryInternal(options.onUpdated);
}

export async function refreshRegistry(
  options: {
    onUpdated?: (registry: AgentRegistry) => void;
  } = {}
): Promise<AgentRegistry> {
  return refreshRegistryInternal(options.onUpdated);
}
