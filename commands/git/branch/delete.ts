import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import { execute as branch } from "../../../tools/branch.ts";
import resolveGitCwd from "../../../util/resolveGitCwd.ts";

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

async function execute({ args, agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const branchName = args.branchName;

  await branch({ action: "delete", branchName, cwd: await resolveGitCwd(agent) }, agent);
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
