import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {execute as branch} from "../../../tools/branch.ts";

const inputSchema = {
  args: {},
  positionals: [{
    name: "branchName",
    description: "The name of the new branch",
    required: true,
  }],
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({positionals, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const branchName = positionals.branchName;

  await branch({action: "create", branchName}, agent);
  return `Created and switched to branch "${branchName}".`;
}

export default {
  name: "git branch create",
  description: "Create and switch to a new branch",
  inputSchema,
  execute,
  help: `Create a new git branch and switch to it.

## Example

/git branch create feature-xyz`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
