import ChatService from "@token-ring/chat/ChatService";
import {FileSystemService} from "@token-ring/filesystem";
import {Registry} from "@token-ring/registry";
import {z} from "zod";


export async function execute(
  args: { commit?: string; steps?: number },
  registry: Registry,
): Promise<string | { error: string }> {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const fileSystem = registry.requireFirstServiceByType(FileSystemService);
  const toolName = "rollback";

  // Check if there are uncommitted changes
  try {
    const {stdout: statusOutput} = await fileSystem.executeCommand([
      "git",
      "status",
      "--porcelain",
    ]);
    if (statusOutput.trim()) {
      chatService.errorLine(
        `[${toolName}] There are uncommitted changes. Please commit or stash your changes before rollback.`,
      );
      return {error: "Rollback aborted: uncommitted changes detected"};
    }
  } catch (error: any) {
    chatService.errorLine(`[${toolName}] Error checking git status: ${error.message}`);
    return {error: `Rollback failed: ${error.message}`};
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
    chatService.errorLine(
      `[${toolName}] Error during rollback: ${error.shortMessage || error.message}`,
    );
    return {error: `Rollback failed: ${error.shortMessage || error.message}`};
  }
}

export const description = "Rolls back to a previous git commit.";

export const parameters = z.object({
  commit: z.string().describe("The commit hash to rollback to").optional(),
  steps: z.number().int().describe("Number of commits to roll back").optional(),
});
