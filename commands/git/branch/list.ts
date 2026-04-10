import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand,} from "@tokenring-ai/agent/types";
import {execute as branch} from "../../../tools/branch.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  await branch({action: "list"}, agent);
  return "Branch list displayed.";
}

export default {
  name: "git branch list",
  description: "List all branches (local and remote)",
  inputSchema,
  execute,
  help: `List all local and remote branches in the repository.

**Example:**
/git branch list`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
