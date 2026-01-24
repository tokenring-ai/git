import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {FileSystemService} from "@tokenring-ai/filesystem";
import {z} from "zod";

const name = "git_rollback";
const displayName = "Git/rollback";

export async function execute(
  args: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<string> {
  const fileSystem = agent.requireServiceByType(FileSystemService);
  const toolName = "rollback";

  // Ensure there are no uncommitted changes
  const {stdout: statusOutput} = await fileSystem.executeCommand([
    "git",
    "status",
    "--porcelain",
  ], {}, agent);
  if (statusOutput.trim() !== "") {
    throw new Error(`[${name}] Rollback aborted: uncommitted changes detected`);
  }

  try {
    // Determine which commit to roll back to
    if (args.commit) {
      // Rollback to specific commit
      agent.infoMessage(`[${toolName}] Rolling back to commit ${args.commit}...`);
      await fileSystem.executeCommand(["git", "reset", "--hard", args.commit], {}, agent);
    } else if (args.steps && Number.isInteger(args.steps) && args.steps > 0) {
      // Rollback by a number of steps
      agent.infoMessage(`[${toolName}] Rolling back ${args.steps} commit(s)...`);
      await fileSystem.executeCommand([
        "git",
        "reset",
        "--hard",
        `HEAD~${args.steps}`,
      ], {}, agent);
    } else {
      // Default: rollback one commit
      agent.infoMessage(`[${toolName}] Rolling back to previous commit...`);
      await fileSystem.executeCommand(["git", "reset", "--hard", "HEAD~1"], {}, agent);
    }

    agent.infoMessage(`[${toolName}] Rollback completed successfully.`);
    return "Successfully rolled back to previous state";
  } catch (error: any) {
    // Throw error directly without prior logging
    throw new Error(`[${name}] Rollback failed: ${error.shortMessage || error.message}`);
  }
}

const description = "Rolls back to a previous git commit.";

const inputSchema = z.object({
  commit: z.string().describe("The commit hash to rollback to").optional(),
  steps: z.number().int().describe("Number of commits to roll back").optional(),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;