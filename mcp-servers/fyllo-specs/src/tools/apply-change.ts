import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { runTool } from "../utils/state";
import { resolveProjectRoot } from "../utils/project-root";
import { listChanges, computeStatus } from "../openspec-runtime";
import { loadApplyState } from "../openspec-runtime/tasks";

const applyChangeInputSchema = z.object({
  changeName: z
    .string()
    .optional()
    .describe(
      "Name of the change to implement. Omit to auto-select when only one active change exists."
    ),
  includeInstruction: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "Set to false to omit the skill instruction text and return only the state JSON. Useful when the agent already knows the workflow."
    ),
});

function changeDir(projectRoot: string, name: string): string {
  return join(projectRoot, "openspec", "changes", name);
}

export async function applyChangeTool(
  input: z.infer<typeof applyChangeInputSchema>
): Promise<string> {
  return runTool("apply-change", { includeInstruction: input.includeInstruction }, async () => {
    const projectRoot = resolveProjectRoot();
    const activeChanges = await listChanges(projectRoot);
    const changeName =
      input.changeName ?? (activeChanges.length === 1 ? activeChanges[0].name : null);

    if (!changeName) {
      return {
        changeName: null,
        schemaName: "spec-driven",
        applyState: "blocked",
        contextFiles: {},
        tasks: [],
        progress: { total: 0, complete: 0, remaining: 0 },
      };
    }

    if (!existsSync(changeDir(projectRoot, changeName))) {
      throw new Error(`Change not found: ${changeName}`);
    }

    const state = await loadApplyState(projectRoot, changeName);
    const status = await computeStatus(projectRoot, changeName);
    const applyState =
      state.applyState === "all_done"
        ? "all_done"
        : status.artifacts.some((artifact) => artifact.status !== "done")
          ? "blocked"
          : state.applyState;

    return {
      ...state,
      changeName,
      applyState,
    };
  });
}

export function registerApplyChangeTool(server: McpServer): void {
  server.registerTool(
    "apply-change",
    {
      description:
        "Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.",
      inputSchema: applyChangeInputSchema,
    },
    async (input) => {
      return {
        content: [{ type: "text" as const, text: await applyChangeTool(input) }],
      };
    }
  );
}
