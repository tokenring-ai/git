import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";
import { TerminalService } from "@tokenring-ai/terminal";
import { z } from "zod";

const name = "git_rollback";
const displayName = "Git/rollback";

export async function execute(args: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const terminal = agent.requireService(TerminalService);

  const toolName = "rollback";

  // Ensure there are no uncommitted changes
  const result = await terminal.executeCommand("git", ["status", "--porcelain"], { workingDirectory: args.cwd }, agent);
  const output = result.status === "success" || result.status === "badExitCode" ? result.output : "";
  if (output.trim() !== "") {
    throw new ToolCallError(name, `Rollback aborted: uncommitted changes detected`);
  }

  // Determine which commit to roll back to
  if (args.commit) {
    // Rollback to specific commit
    agent.infoMessage(`[${toolName}] Rolling back to commit ${args.commit}...`);
    await terminal.executeCommand("git", ["reset", "--hard", args.commit], { workingDirectory: args.cwd }, agent);
  } else if (args.steps && Number.isInteger(args.steps) && args.steps > 0) {
    // Rollback by a number of steps
    agent.infoMessage(`[${toolName}] Rolling back ${args.steps} commit(s)...`);
    await terminal.executeCommand("git", ["reset", "--hard", `HEAD~${args.steps}`], { workingDirectory: args.cwd }, agent);
  } else {
    // Default: rollback one commit
    agent.infoMessage(`[${toolName}] Rolling back to previous commit...`);
    await terminal.executeCommand("git", ["reset", "--hard", "HEAD~1"], { workingDirectory: args.cwd }, agent);
  }

  agent.infoMessage(`[${toolName}] Rollback completed successfully.`);
  return {
    message: `**Rolled back**`,
    result: "Successfully rolled back to previous state",
  };
}

const description = "Rolls back to a previous git commit.";

const inputSchema = z.object({
  cwd: z.string().describe("Absolute path of the git repository to operate in. Must be inside an allowed path."),
  commit: z.string().describe("The commit hash to rollback to").exactOptional(),
  steps: z.number().int().describe("Number of commits to roll back").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
