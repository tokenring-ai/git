import Agent from "@tokenring-ai/agent/Agent";
import {execute as branch} from "../tools/branch.ts";
import {execute as commit} from "../tools/commit.ts";
import {execute as rollback} from "../tools/rollback.ts";

/**
 * Combined git commit/rollback/branch command
 * Usage: /git commit | /git rollback [position] | /git branch [options]
 */

export const description =
  "/git <commit|rollback|branch> [options] - Git operations. Use 'commit' to commit changes, 'rollback [position]' to rollback by [position] commits (default: 1), 'branch [options]' for branch management.";

export async function execute(remainder: string, agent: Agent) {

  if (!remainder || !remainder.trim()) {
    agent.errorLine("Usage: /git <commit|rollback|branch> [options]");
    return;
  }

  const args = remainder.trim().split(/\s+/);
  const action = args[0].toLowerCase();

  switch (action) {
    case "commit": {
      // Parse commit message if provided
      const commitArgs: { message?: string } = {};
      if (args.length > 1) {
        // Join all remaining arguments as the commit message
        commitArgs.message = args.slice(1).join(" ");
      }
      await commit(commitArgs, agent);
      break;
    }
    case "rollback": {
      let steps = 1;
      if (args[1]) {
        const parsed = parseInt(args[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
          steps = parsed;
        } else {
          agent.errorLine(
            `Invalid rollback position: "${args[1]}". Must be a positive integer.`,
          );
          return;
        }
      }
      await rollback({steps}, agent);
      break;
    }
    case "branch": {
      // Parse branch arguments
      const branchArgs: {
        action?: "list" | "create" | "switch" | "delete" | "current" | null;
        branchName?: string
      } = {};
      if (args.length === 1) {
        // No additional arguments - show current branch and list local branches (default behavior)
        branchArgs.action = null; // Will trigger default case
      } else {
        const branchAction = args[1];
        const branchName = args[2];

        if ([
          "list",
          "current",
          "create",
          "switch",
          "delete",
        ].includes(branchAction)) {
          branchArgs.action = branchAction as (typeof branchArgs)["action"];
          if (branchName) {
            branchArgs.branchName = branchName;
          }
        } else {
          agent.errorLine(
            `Invalid branch action: "${branchAction}". Valid actions are: list, current, create, switch, delete`,
          );
          return;
        }
      }
      await branch(branchArgs, agent);
      break;
    }

    default:
      agent.errorLine(
        `Unknown git action: "${action}". Use 'commit', 'rollback', or 'branch'.`,
      );
      break;
  }
}

// noinspection JSUnusedGlobalSymbols
export function help() {
  return [
    "/git <commit|rollback|branch> [options]",
    "  /git commit [message] - Commit changes in the source directory",
    "  /git rollback [position] - Roll back by [position] commits (default: 1)",
    "  /git branch - Show current branch and list local branches",
    "  /git branch <action> [branchName] - Perform branch operations",
    "    Actions: list, current, create, switch, delete",
    "  Examples:",
    "    /git commit",
    '    /git commit "Fix bug in authentication"',
    "    /git rollback",
    "    /git rollback 3",
    "    /git branch",
    "    /git branch list",
    "    /git branch current",
    "    /git branch create feature-xyz",
    "    /git branch switch main",
    "    /git branch delete feature-xyz",
  ];
}
