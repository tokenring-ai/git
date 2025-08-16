import ChatService from "@token-ring/chat/ChatService";
import {FileSystemService} from "@token-ring/filesystem";
import {Registry} from "@token-ring/registry";
import {z} from "zod";


export async function execute(
  args: { action?: "list" | "create" | "switch" | "delete" | "current" | null; branchName?: string },
  registry: Registry,
): Promise<string | { error: string }> {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const fileSystem = registry.requireFirstServiceByType(FileSystemService);

  try {
    const action = args.action;
    const branchName = args.branchName;

    switch (action) {
      case "list": {
        // List all branches
        chatService.infoLine("[branch] Listing all branches...");
        const {stdout} = await fileSystem.executeCommand([
          "git",
          "branch",
          "-a",
        ]);
        chatService.systemLine("[branch] Branches:");
        stdout.split("\n").forEach((line: string) => {
          if (line.trim()) {
            chatService.systemLine(`[branch]   ${line}`);
          }
        });
        return "Branch list displayed successfully";
      }
      case "create":
        if (!branchName) {
          chatService.errorLine("[branch] Branch name is required for create action");
          return {error: "Create failed: no branch name provided"};
        }
        // Create a new branch
        chatService.infoLine(`[branch] Creating new branch: ${branchName}...`);
        await fileSystem.executeCommand(["git", "checkout", "-b", branchName]);
        chatService.systemLine(
          `[branch] Successfully created and switched to branch: ${branchName}`,
        );
        return `Branch '${branchName}' created and checked out`;

      case "switch":
        if (!branchName) {
          chatService.errorLine("[branch] Branch name is required for switch action");
          return {error: "Switch failed: no branch name provided"};
        }
        // Switch to existing branch
        chatService.infoLine(`[branch] Switching to branch: ${branchName}...`);
        await fileSystem.executeCommand(["git", "checkout", branchName]);
        chatService.systemLine(
          `[branch] Successfully switched to branch: ${branchName}`,
        );
        return `Switched to branch '${branchName}'`;

      case "delete":
        if (!branchName) {
          chatService.errorLine("[branch] Branch name is required for delete action");
          return {error: "Delete failed: no branch name provided"};
        }
        // Delete a branch
        chatService.infoLine(`[branch] Deleting branch: ${branchName}...`);
        await fileSystem.executeCommand(["git", "branch", "-d", branchName]);
        chatService.systemLine(`[branch] Successfully deleted branch: ${branchName}`);
        return `Branch '${branchName}' deleted`;

      case "current": {
        // Show current branch
        const {stdout: currentBranch} = await fileSystem.executeCommand([
          "git",
          "branch",
          "--show-current",
        ]);
        const current = (currentBranch as string).trim();
        chatService.systemLine(`[branch] Current branch: ${current}`);
        return `Current branch: ${current}`;
      }
      default: {
        // Default: show current branch and list local branches
        const {stdout: currentBranchDefault} =
          await fileSystem.executeCommand(["git", "branch", "--show-current"]);
        const {stdout: branches} = await fileSystem.executeCommand([
          "git",
          "branch",
        ]);

        chatService.systemLine(
          `[branch] Current branch: ${(currentBranchDefault as string).trim()}`,
        );
        chatService.systemLine("[branch] Local branches:");
        (branches as string).split("\n").forEach((line: string) => {
          if (line.trim()) {
            chatService.systemLine(`[branch]   ${line}`);
          }
        });
        return "Branch information displayed successfully";
      }
    }
  } catch (error: any) {
    const message = error.shortMessage || error.message || "Unknown error";
    chatService.errorLine(`[branch] Error with git branch operation: ${message}`);
    return {error: `Branch operation failed: ${message}`};
  }
}

export const description =
  "Manages git branches - list, create, switch, or delete branches.";
export const parameters = z.object({
  action: z
    .enum(["list", "create", "switch", "delete", "current"])
    .describe("The branch action to perform"),
  branchName: z
    .string()
    .describe(
      "The name of the branch (required for create, switch, and delete actions)",
    )
    .optional(),
});
