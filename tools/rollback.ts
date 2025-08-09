import ChatService from "@token-ring/chat/ChatService";
import { FileSystemService } from "@token-ring/filesystem";

export default execute;
export async function execute(
  args: { commit?: string; steps?: number },
  registry: any,
) {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const fileSystem = registry.requireFirstServiceByType(FileSystemService);

  // Check if there are uncommitted changes
  try {
    const { stdout: statusOutput } = await fileSystem.executeCommand([
      "git",
      "status",
      "--porcelain",
    ]);
    if (statusOutput.trim()) {
      chatService.errorLine(
        "There are uncommitted changes. Please commit or stash your changes before rollback.",
      );
      return "Rollback aborted: uncommitted changes detected";
    }
  } catch (error: any) {
    chatService.errorLine(`Error checking git status: ${error.message}`);
    return `Rollback failed: ${error.message}`;
  }

  try {
    // Determine which commit to rollback to
    if (args.commit) {
      // Rollback to specific commit
      chatService.infoLine(`Rolling back to commit ${args.commit}...`);
      await fileSystem.executeCommand(["git", "reset", "--hard", args.commit]);
    } else if (args.steps && Number.isInteger(args.steps) && args.steps > 0) {
      // Rollback by a number of steps
      chatService.infoLine(`Rolling back ${args.steps} commit(s)...`);
      await fileSystem.executeCommand([
        "git",
        "reset",
        "--hard",
        `HEAD~${args.steps}`,
      ]);
    } else {
      // Default: rollback one commit
      chatService.infoLine("Rolling back to previous commit...");
      await fileSystem.executeCommand(["git", "reset", "--hard", "HEAD~1"]);
    }

    chatService.systemLine("Rollback completed successfully.");
    fileSystem.setDirty(false);
    return "Successfully rolled back to previous state";
  } catch (error: any) {
    chatService.errorLine(
      `Error during rollback: ${error.shortMessage || error.message}`,
    );
    return `Rollback failed: ${error.shortMessage || error.message}`;
  }
}

export const description = "Rolls back to a previous git commit.";
import { z } from "zod";

export const parameters = z.object({
  commit: z.string().describe("The commit hash to rollback to").optional(),
  steps: z.number().int().describe("Number of commits to roll back").optional(),
});
