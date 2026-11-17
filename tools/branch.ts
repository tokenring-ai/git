import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";
import { z } from "zod";
import { runGit } from "../util/runGit.ts";

// Export the tool name in the required format
const name = "git_branch";
const displayName = "Git/branch";

export async function execute(args: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const action = args.action;
  const branchName = args.branchName;

  switch (action) {
    case "list": {
      // List all branches
      agent.infoMessage(`[${name}] Listing all branches...`);
      const output = await runGit(name, ["branch", "-a"], args.cwd, agent);
      const lines: string[] = [`[${name}] Branches:`];
      output.split("\n").forEach((line: string) => {
        if (line.trim()) {
          lines.push(`[${name}]   ${line}`);
        }
      });
      agent.infoMessage(lines.join("\n"));
      return {
        message: "**Git Branch** Listed git branches",
        result: "Branch list displayed successfully",
      };
    }
    case "create":
      if (!branchName) {
        throw new ToolCallError(name, `Branch name is required for create action`);
      }
      // Create a new branch
      agent.infoMessage(`[${name}] Creating new branch: ${branchName}...`);
      await runGit(name, ["checkout", "-b", branchName], args.cwd, agent);
      agent.infoMessage(`[${name}] Successfully created and switched to branch: ${branchName}`);
      return {
        message: `**Git Branch** Created branch ${branchName}`,
        result: `Branch '${branchName}' created and checked out`,
      };

    case "switch":
      if (!branchName) {
        throw new ToolCallError(name, `Branch name is required for switch action`);
      }
      // Switch to existing branch
      agent.infoMessage(`[${name}] Switching to branch: ${branchName}...`);
      await runGit(name, ["checkout", branchName], args.cwd, agent);
      agent.infoMessage(`[${name}] Successfully switched to branch: ${branchName}`);
      return {
        message: `**Git Branch** Switched to "${branchName}"`,
        result: `Switched to branch '${branchName}'`,
      };

    case "delete":
      if (!branchName) {
        throw new ToolCallError(name, `Branch name is required for delete action`);
      }
      // Delete a branch
      agent.infoMessage(`[${name}] Deleting branch: ${branchName}...`);
      await runGit(name, ["branch", "-d", branchName], args.cwd, agent);
      agent.infoMessage(`[${name}] Successfully deleted branch: ${branchName}`);
      return {
        message: `**Git Branch** Deleted "${branchName}"`,
        result: `Branch '${branchName}' deleted`,
      };

    case "current": {
      // Show current branch
      const currentBranch = await runGit(name, ["branch", "--show-current"], args.cwd, agent);
      const current = currentBranch.trim();
      agent.infoMessage(`[${name}] Current branch: ${current}`);
      return {
        message: "**Git Branch** Retrieved current branch",
        result: `Current branch: ${current}`,
      };
    }
    default: {
      // Default: show current branch and list local branches
      const currentBranchDefault = await runGit(name, ["branch", "--show-current"], args.cwd, agent);
      const branches = await runGit(name, ["branch"], args.cwd, agent);

      const lines: string[] = [];
      lines.push(`[${name}] Current branch: ${currentBranchDefault.trim()}`);
      lines.push(`[${name}] Local branches:`);
      branches.split("\n").forEach((line: string) => {
        if (line.trim()) {
          lines.push(`[${name}]   ${line}`);
        }
      });
      agent.infoMessage(lines.join("\n"));
      return {
        message: "**Git Branch** Retrieved branch status",
        result: "Branch information displayed successfully",
      };
    }
  }
}

const description = "Manages git branches - list, create, switch, or delete branches.";
const inputSchema = z.object({
  cwd: z.string().describe("Absolute path of the git repository to operate in. Must be inside an allowed path."),
  action: z.enum(["list", "create", "switch", "delete", "current"]).describe("The branch action to perform"),
  branchName: z.string().describe("The name of the branch (required for create, switch, and delete actions)").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
