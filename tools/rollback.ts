import ChatService from "@token-ring/chat/ChatService";
import {FileSystemService} from "@token-ring/filesystem";
import {Registry} from "@token-ring/registry";
import {z} from "zod";

export const name = "git/rollback";

export async function execute(
  args: { commit?: string; steps?: number },
  registry: Registry,
): Promise<string> {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const fileSystem = registry.requireFirstServiceByType(FileSystemService);
  const toolName = "rollback";

  // Ensure there are no uncommitted changes
  const {stdout: statusOutput} = await fileSystem.executeCommand([
    "git",
    "status",
    "--porcelain",
  ]);
  if (statusOutput.trim() !== "") {
    throw new Error(`[${name}] Rollback aborted: uncommitted changes detected`);
  }

  try {
    // Determine which commit to rollback to
    if (args.commit) {
      // Rollback to specific commit
      chatService.infoLine(`[${toolName}] Rolling back to commit ${args.commit}...`);
      await fileSystem.executeCommand(["git", "reset", "--hard", args.commit]);
    } else if (args.steps && Number.isInteger(args.steps) && args.steps > 0) {
      // Rollback by a number of steps
      chatService.infoLine(`[${toolName}] Rolling back ${args.steps} commit(s)...`);
      await fileSystem.executeCommand([
        "git",
        "reset",
        "--hard",
        `HEAD~${args.steps}`,
      ]);
    } else {
      // Default: rollback one commit
      chatService.infoLine(`[${toolName}] Rolling back to previous commit...`);
      await fileSystem.executeCommand(["git", "reset", "--hard", "HEAD~1"]);
    }

    chatService.systemLine(`[${toolName}] Rollback completed successfully.`);
    fileSystem.setDirty(false);
    return "Successfully rolled back to previous state";
  } catch (error: any) {
    // Throw error directly without prior logging
    throw new Error(`[${name}] Rollback failed: ${error.shortMessage || error.message}`);
  }
}

export const description = "Rolls back to a previous git commit.";

export const inputSchema = z.object({
  commit: z.string().describe("The commit hash to rollback to").optional(),
  steps: z.number().int().describe("Number of commits to roll back").optional(),
});
