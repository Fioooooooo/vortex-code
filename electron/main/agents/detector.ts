import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import type {
  AgentBinaryDistribution,
  AgentDistribution,
  AgentEntry,
  AgentStatus,
  InstallMethod,
  InstalledAgentRecord,
  InstalledAgentsMap,
} from "@shared/types/agents";
import { getDataSubPath } from "@main/utils/paths";

interface CommandResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

interface DetectedInstallation {
  installed: boolean;
  installMethod?: InstallMethod;
  detectedVersion?: string;
  installPath?: string;
}

export function createAgentError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function getInstalledRecordsPath(): string {
  return join(getDataSubPath("agents"), "installed.json");
}

async function ensureAgentsDirectory(): Promise<void> {
  await fs.mkdir(getDataSubPath("agents"), { recursive: true });
}

async function pathExists(path: string | undefined): Promise<boolean> {
  if (!path) {
    return false;
  }

  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readInstalledRecords(): Promise<InstalledAgentsMap> {
  try {
    const content = await fs.readFile(getInstalledRecordsPath(), "utf8");
    return JSON.parse(content) as InstalledAgentsMap;
  } catch {
    return {};
  }
}

export async function writeInstalledRecords(records: InstalledAgentsMap): Promise<void> {
  await ensureAgentsDirectory();
  await fs.writeFile(getInstalledRecordsPath(), JSON.stringify(records, null, 2), "utf8");
}

export async function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ stdout, stderr, code });
    });
  });
}

export async function findCommandPath(command: string): Promise<string | null> {
  const locator = process.platform === "win32" ? "where" : "which";

  try {
    const result = await runCommand(locator, [command]);
    if (result.code !== 0) {
      return null;
    }

    const [firstMatch] = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return firstMatch ?? null;
  } catch {
    return null;
  }
}

function normalizeVersion(version: string | undefined): string | undefined {
  if (!version) {
    return undefined;
  }

  return version.trim().replace(/^v/i, "");
}

function parseVersionFromText(text: string): string | undefined {
  const match = text.match(/v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/);
  return normalizeVersion(match?.[1]);
}

export function compareVersions(left: string, right: string): number {
  const normalize = (value: string): number[] =>
    value
      .trim()
      .replace(/^v/i, "")
      .split("-")[0]
      .split(".")
      .map((segment) => Number.parseInt(segment.replace(/\D/g, ""), 10) || 0);

  const leftParts = normalize(left);
  const rightParts = normalize(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart > rightPart) {
      return 1;
    }
    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

function inferInstallMethod(distribution: AgentDistribution): InstallMethod {
  if (distribution.npx) {
    return "npx";
  }
  if (distribution.uvx) {
    return "uvx";
  }
  return "binary";
}

export function resolveBinaryDistribution(
  binaryDistributions: AgentDistribution["binary"]
): AgentBinaryDistribution | null {
  if (!binaryDistributions) {
    return null;
  }

  // process.arch 用 Node 命名（arm64/x64），registry 用 Linux 命名（aarch64/x86_64）
  const archMap: Record<string, string> = { arm64: "aarch64", x64: "x86_64" };
  const arch = archMap[process.arch] ?? process.arch;

  const keys = [
    `${process.platform}-${arch}`,
    `${process.platform}_${arch}`,
    `${process.platform}-${process.arch}`,
    process.platform,
  ];

  for (const key of keys) {
    if (binaryDistributions[key]) {
      return binaryDistributions[key];
    }
  }

  return null;
}

async function tryReadCommandVersion(commandPath: string): Promise<string | undefined> {
  try {
    const result = await runCommand(commandPath, ["--version"]);
    if (result.code !== 0) {
      return undefined;
    }
    return parseVersionFromText(`${result.stdout}\n${result.stderr}`);
  } catch {
    return undefined;
  }
}

async function detectNpxInstallation(agent: AgentEntry): Promise<DetectedInstallation> {
  const distribution = agent.distribution.npx;
  if (!distribution) {
    return { installed: false };
  }

  const npmPath = await findCommandPath("npm");
  if (!npmPath) {
    return { installed: false, installMethod: "npx" };
  }

  const result = await runCommand(npmPath, [
    "list",
    "-g",
    distribution.package,
    "--depth=0",
    "--json",
  ]);

  let payload: {
    dependencies?: Record<string, { version?: string; path?: string }>;
  } = {};
  try {
    payload = JSON.parse(result.stdout || "{}") as {
      dependencies?: Record<string, { version?: string; path?: string }>;
    };
  } catch {
    payload = {};
  }

  const dependency = payload.dependencies?.[distribution.package];

  if (!dependency) {
    return { installed: false, installMethod: "npx" };
  }

  return {
    installed: true,
    installMethod: "npx",
    detectedVersion: normalizeVersion(dependency.version),
    installPath: dependency.path,
  };
}

async function detectUvxInstallation(agent: AgentEntry): Promise<DetectedInstallation> {
  const distribution = agent.distribution.uvx;
  if (!distribution) {
    return { installed: false };
  }

  const uvPath = await findCommandPath("uv");
  if (!uvPath) {
    return { installed: false, installMethod: "uvx" };
  }

  const result = await runCommand(uvPath, ["tool", "list"]);
  if (result.code !== 0) {
    return { installed: false, installMethod: "uvx" };
  }

  const line = result.stdout
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find(
      (item) => item.startsWith(`${distribution.package} `) || item.includes(distribution.package)
    );

  if (!line) {
    return { installed: false, installMethod: "uvx" };
  }

  return {
    installed: true,
    installMethod: "uvx",
    detectedVersion: parseVersionFromText(line),
  };
}

async function detectBinaryInstallation(
  agent: AgentEntry,
  record?: InstalledAgentRecord
): Promise<DetectedInstallation> {
  const binary = resolveBinaryDistribution(agent.distribution.binary);
  if (!binary) {
    return { installed: false, installMethod: "binary" };
  }

  if (await pathExists(record?.installPath)) {
    return {
      installed: true,
      installMethod: "binary",
      detectedVersion:
        (await tryReadCommandVersion(record?.installPath as string)) ?? record?.installedVersion,
      installPath: record?.installPath,
    };
  }

  const binaryPath = await findCommandPath(binary.cmd);
  if (!(await pathExists(binaryPath ?? undefined))) {
    return { installed: false, installMethod: "binary" };
  }

  return {
    installed: true,
    installMethod: "binary",
    detectedVersion:
      (await tryReadCommandVersion(binaryPath as string)) ?? record?.installedVersion,
    installPath: binaryPath as string,
  };
}

export async function detectAgentInstallation(
  agent: AgentEntry,
  record?: InstalledAgentRecord
): Promise<DetectedInstallation> {
  if (agent.distribution.npx) {
    return detectNpxInstallation(agent);
  }

  if (agent.distribution.uvx) {
    return detectUvxInstallation(agent);
  }

  return detectBinaryInstallation(agent, record);
}

export async function detectAgentStatuses(registry: {
  agents: AgentEntry[];
}): Promise<AgentStatus[]> {
  const records = await readInstalledRecords();
  let shouldPersist = false;

  const statuses = await Promise.all(
    registry.agents.map(async (agent) => {
      const existingRecord = records[agent.id];
      const detection = await detectAgentInstallation(agent, existingRecord);

      if (!detection.installed) {
        return {
          id: agent.id,
          installed: false,
          managedBy: null,
          updateAvailable: false,
          latestVersion: agent.version,
        } satisfies AgentStatus;
      }

      const managedBy = existingRecord?.managedBy ?? "user";
      const installedVersion = detection.detectedVersion ?? existingRecord?.installedVersion;
      const installMethod =
        detection.installMethod ??
        existingRecord?.installMethod ??
        inferInstallMethod(agent.distribution);
      const installPath = detection.installPath ?? existingRecord?.installPath;
      const nextRecord: InstalledAgentRecord = {
        managedBy,
        installMethod,
        installPath,
        installedVersion,
        installedAt: existingRecord?.installedAt ?? Date.now(),
      };

      if (
        !existingRecord ||
        existingRecord.managedBy !== nextRecord.managedBy ||
        existingRecord.installMethod !== nextRecord.installMethod ||
        existingRecord.installPath !== nextRecord.installPath ||
        existingRecord.installedVersion !== nextRecord.installedVersion
      ) {
        records[agent.id] = nextRecord;
        shouldPersist = true;
      }

      return {
        id: agent.id,
        installed: true,
        detectedVersion: installedVersion,
        managedBy,
        updateAvailable: installedVersion
          ? compareVersions(agent.version, installedVersion) > 0
          : false,
        latestVersion: agent.version,
      } satisfies AgentStatus;
    })
  );

  if (shouldPersist) {
    await writeInstalledRecords(records);
  }

  return statuses;
}
