import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand,} from "@tokenring-ai/agent/types";
import {execute as branch} from "../../../tools/branch.ts";

const inputSchema = {
  args: {},
  positionals: [
    {
      name: "branchName",
      description: "The name of the branch to delete",
      required: true,
    },
  ],
} as const satisfies AgentCommandInputSchema;

async function execute({
                         positionals,
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const branchName = positionals.branchName;

  await branch({action: "delete", branchName}, agent);
  return `Deleted branch "${branchName}".`;
}

export default {
  name: "git branch delete",
  description: "Delete a branch",
  inputSchema,
  execute,
  help: `Delete an existing git branch.

## Example

/git branch delete feature-xyz`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
