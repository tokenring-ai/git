import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {TerminalService} from "@tokenring-ai/terminal";
import {z} from "zod";

// Export the tool name in the required format
const name = "git_branch";
const displayName = "Git/branch";

export async function execute(
  args: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<string> {
  const terminal = agent.requireServiceByType(TerminalService);

  const action = args.action;
  const branchName = args.branchName;

  switch (action) {
    case "list": {
      // List all branches
      agent.infoMessage(`[${name}] Listing all branches...`);
      const result = await terminal.executeCommand("git", [
        "branch",
        "-a",
      ], {}, agent);
      const lines: string[] = [`[${name}] Branches:`];
      const output = result.status === "success" || result.status === "badExitCode" ? result.output : "";
      output.split("\n").forEach((line: string) => {
        if (line.trim()) {
          lines.push(`[${name}]   ${line}`);
        }
      });
      agent.infoMessage(lines.join("\n"));
      return "Branch list displayed successfully";
    }
    case "create":
      if (!branchName) {
        throw new Error(`[${name}] Branch name is required for create action`);
      }
      // Create a new branch
      agent.infoMessage(`[${name}] Creating new branch: ${branchName}...`);
      await terminal.executeCommand("git", ["checkout", "-b", branchName], {}, agent);
      agent.infoMessage(
        `[${name}] Successfully created and switched to branch: ${branchName}`,
      );
      return `Branch '${branchName}' created and checked out`;

    case "switch":
      if (!branchName) {
        throw new Error(`[${name}] Branch name is required for switch action`);
      }
      // Switch to existing branch
      agent.infoMessage(`[${name}] Switching to branch: ${branchName}...`);
      await terminal.executeCommand("git", ["checkout", branchName], {}, agent);
      agent.infoMessage(
        `[${name}] Successfully switched to branch: ${branchName}`,
      );
      return `Switched to branch '${branchName}'`;

    case "delete":
      if (!branchName) {
        throw new Error(`[${name}] Branch name is required for delete action`);
      }
      // Delete a branch
      agent.infoMessage(`[${name}] Deleting branch: ${branchName}...`);
      await terminal.executeCommand("git", ["branch", "-d", branchName], {}, agent);
      agent.infoMessage(`[${name}] Successfully deleted branch: ${branchName}`);
      return `Branch '${branchName}' deleted`;

    case "current": {
      // Show current branch
      const result = await terminal.executeCommand("git", ["branch", "--show-current"], {}, agent);
      const currentBranch = result.status === "success" || result.status === "badExitCode" ? result.output : "";
      const current = (currentBranch).trim();
      agent.infoMessage(`[${name}] Current branch: ${current}`);
      return `Current branch: ${current}`;
    }
    default: {
      // Default: show current branch and list local branches
      const currentResult = await terminal.executeCommand("git", ["branch", "--show-current"], {}, agent);
      const currentBranchDefault = currentResult.status === "success" || currentResult.status === "badExitCode" ? currentResult.output : "";
      const branchesResult = await terminal.executeCommand("git", ["branch"], {}, agent);
      const branches = branchesResult.status === "success" || branchesResult.status === "badExitCode" ? branchesResult.output : "";

      const lines: string[] = [];
      lines.push(
        `[${name}] Current branch: ${(currentBranchDefault).trim()}`,
      );
      lines.push(`[${name}] Local branches:`);
      branches.split("\n").forEach((line: string) => {
        if (line.trim()) {
          lines.push(`[${name}]   ${line}`);
        }
      });
      agent.infoMessage(lines.join("\n"));
      return "Branch information displayed successfully";
    }
  }
}

const description =
  "Manages git branches - list, create, switch, or delete branches.";
const inputSchema = z.object({
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

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;