import { existsSync } from "fs";
import { join } from "path";

function getResourcesPath(): string {
  return (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ?? "";
}

export function resolveOpenspecCli(projectRoot: string): string {
  if (process.env.FYLLO_OPENSPEC_CLI_PATH) {
    return process.env.FYLLO_OPENSPEC_CLI_PATH;
  }

  const candidates = [
    join(projectRoot, "node_modules", "@fission-ai", "openspec", "bin", "openspec.js"),
    join(
      getResourcesPath(),
      "app.asar.unpacked",
      "node_modules",
      "@fission-ai",
      "openspec",
      "bin",
      "openspec.js"
    ),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}
