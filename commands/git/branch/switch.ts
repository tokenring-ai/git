import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {execute as branch} from "../../../tools/branch.ts";

const inputSchema = {
  args: {},
  positionals: [
    {
      name: "branchName",
      description: "The name of the branch to switch to",
      required: true,
    },
  ],
} as const satisfies AgentCommandInputSchema;

async function execute({
                         positionals,
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const branchName = positionals.branchName;

  await branch({action: "switch", branchName}, agent);
  return `Switched to branch "${branchName}".`;
}

export default {
  name: "git branch switch",
  description: "Switch to an existing branch",
  inputSchema,
  execute,
  help: `Switch the current git branch to an existing one.

## Example

/git branch switch main`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
