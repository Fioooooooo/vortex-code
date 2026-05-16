import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../utils/state";
import { createChange, computeStatus, getInstructions } from "../openspec-runtime";
import { resolveProjectRoot } from "../utils/project-root";

const createProposalInputSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "Kebab-case name for the change (e.g. 'add-user-auth'). Omit to inspect without creating."
    ),
  description: z
    .string()
    .optional()
    .describe("Brief description of what the change is about. Used to guide artifact generation."),
  includeInstruction: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "Set to false to omit the skill instruction text and return only the state JSON. Useful when the agent already knows the workflow."
    ),
});

export async function createProposalTool(
  input: z.infer<typeof createProposalInputSchema>
): Promise<string> {
  return runTool("create-proposal", { includeInstruction: input.includeInstruction }, async () => {
    const projectRoot = resolveProjectRoot();
    if (input.name) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(input.name)) {
        throw new Error("name must be kebab-case");
      }
      await createChange(projectRoot, input.name);
    }
    const status = input.name ? await computeStatus(projectRoot, input.name) : null;
    if (input.name && !status) {
      throw new Error(`Change not found: ${input.name}`);
    }
    const artifacts = status
      ? await Promise.all(
          status.artifacts.map(async (artifact) => ({
            ...artifact,
            ...(await getInstructions(projectRoot, input.name!, artifact.id)),
          }))
        )
      : [];
    return {
      changeName: input.name ?? null,
      description: input.description ?? null,
      schemaName: "spec-driven",
      applyRequires: status?.applyRequires ?? [],
      artifacts,
      template: artifacts[0]?.template ?? null,
      instruction: artifacts[0]?.instruction ?? null,
      nextArtifact: artifacts.find((artifact) => artifact.status !== "done")?.id ?? null,
    };
  });
}

export function registerCreateProposalTool(server: McpServer): void {
  server.registerTool(
    "create-proposal",
    {
      description:
        "Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.",
      inputSchema: createProposalInputSchema,
    },
    async (input) => {
      return {
        content: [{ type: "text" as const, text: await createProposalTool(input) }],
      };
    }
  );
}
