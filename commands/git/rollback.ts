import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {execute as rollback} from "../../tools/rollback.ts";

const inputSchema = {
  args: {
    "--steps": {
      type: "number",
      minimum: 1,
      defaultValue: 1,
      required: false,
      description: "Number of commits to roll back",
    }
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({args, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  let steps = args["--steps"];
  await rollback({steps}, agent);
  return `Rolled back ${steps} commit(s).`;
}

export default {
  name: "git rollback",
  description: "Roll back to a previous commit state",
  inputSchema,
  execute,
  help: `Rolls back to a previous commit state.

**Examples:**
/git rollback
/git rollback 3`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
