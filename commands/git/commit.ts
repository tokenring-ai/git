import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {execute as commit} from "../../tools/commit.ts";

const inputSchema = {
  args: {},
  positionals: [{
    name: "message",
    description: "Commit message",
    required: false,
    greedy: true,
  }],
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({positionals, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const commitArgs: { message?: string } = {};
  if (positionals.message) {
    commitArgs.message = positionals.message;
  }
  await commit(commitArgs, agent);
  return "Commit completed.";
}

export default {
  name: "git commit",
  description: "Commit changes in the source directory",
  inputSchema,
  execute,
  help: `Commits all changes in the source directory to git. If no message is provided, an AI-generated commit message will be used.

## Example

/git commit
/git commit Fix authentication bug`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
