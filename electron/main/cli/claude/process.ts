import { spawn, type ChildProcess } from "child_process";
import { createInterface } from "readline";

export interface SpawnClaudeOpts {
  prompt: string;
  cwd: string;
  claudeSessionId?: string;
  onLine: (line: string) => void;
  onClose: (code: number | null) => void;
  onError: (err: Error) => void;
}

export function spawnClaude(opts: SpawnClaudeOpts): ChildProcess {
  const args: string[] = [];

  if (opts.claudeSessionId) {
    args.push("--resume", opts.claudeSessionId);
  }

  args.push(
    "--print",
    "--output-format",
    "stream-json",
    "--verbose",
    "--include-partial-messages",
    opts.prompt
  );

  const child = spawn("claude", args, {
    cwd: opts.cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const rl = createInterface({ input: child.stdout! });
  rl.on("line", opts.onLine);

  child.on("close", opts.onClose);
  child.on("error", opts.onError);

  return child;
}
