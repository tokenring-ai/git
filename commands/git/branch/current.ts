import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import { execute as branch } from "../../../tools/branch.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({ agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  await branch({ action: "current" }, agent);
  return "Current branch displayed.";
}

export default {
  name: "git branch current",
  description: "Show current branch",
  inputSchema,
  execute,
  help: `Show the currently active git branch.

**Example:**
/git branch current`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
