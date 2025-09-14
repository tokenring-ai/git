import Agent from "@tokenring-ai/agent/Agent";
import {FileSystemService} from "@tokenring-ai/filesystem";
import {z} from "zod";

// Export the tool name in the required format
export const name = "git/branch";

export async function execute(
  args: { action?: "list" | "create" | "switch" | "delete" | "current" | null; branchName?: string },
  agent: Agent,
): Promise<string> {
  const fileSystem = agent.requireFirstServiceByType(FileSystemService);

  const action = args.action;
  const branchName = args.branchName;

  switch (action) {
    case "list": {
      // List all branches
      agent.infoLine(`[${name}] Listing all branches...`);
      const {stdout} = await fileSystem.executeCommand([
        "git",
        "branch",
        "-a",
      ]);
      agent.infoLine(`[${name}] Branches:`);
      stdout.split("\n").forEach((line: string) => {
        if (line.trim()) {
          agent.infoLine(`[${name}]   ${line}`);
        }
      });
      return "Branch list displayed successfully";
    }
    case "create":
      if (!branchName) {
        throw new Error(`[${name}] Branch name is required for create action`);
      }
      // Create a new branch
      agent.infoLine(`[${name}] Creating new branch: ${branchName}...`);
      await fileSystem.executeCommand(["git", "checkout", "-b", branchName]);
      agent.infoLine(
        `[${name}] Successfully created and switched to branch: ${branchName}`,
      );
      return `Branch '${branchName}' created and checked out`;

    case "switch":
      if (!branchName) {
        throw new Error(`[${name}] Branch name is required for switch action`);
      }
      // Switch to existing branch
      agent.infoLine(`[${name}] Switching to branch: ${branchName}...`);
      await fileSystem.executeCommand(["git", "checkout", branchName]);
      agent.infoLine(
        `[${name}] Successfully switched to branch: ${branchName}`,
      );
      return `Switched to branch '${branchName}'`;

    case "delete":
      if (!branchName) {
        throw new Error(`[${name}] Branch name is required for delete action`);
      }
      // Delete a branch
      agent.infoLine(`[${name}] Deleting branch: ${branchName}...`);
      await fileSystem.executeCommand(["git", "branch", "-d", branchName]);
      agent.infoLine(`[${name}] Successfully deleted branch: ${branchName}`);
      return `Branch '${branchName}' deleted`;

    case "current": {
      // Show current branch
      const {stdout: currentBranch} = await fileSystem.executeCommand([
        "git",
        "branch",
        "--show-current",
      ]);
      const current = (currentBranch).trim();
      agent.infoLine(`[${name}] Current branch: ${current}`);
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

      agent.infoLine(
        `[${name}] Current branch: ${(currentBranchDefault).trim()}`,
      );
      agent.infoLine(`[${name}] Local branches:`);
      (branches).split("\n").forEach((line: string) => {
        if (line.trim()) {
          agent.infoLine(`[${name}]   ${line}`);
        }
      });
      return "Branch information displayed successfully";
    }
  }
}

export const description =
  "Manages git branches - list, create, switch, or delete branches.";
export const inputSchema = z.object({
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
