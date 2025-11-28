import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {execute as branch} from "../tools/branch.ts";
import {execute as commit} from "../tools/commit.ts";
import {execute as rollback} from "../tools/rollback.ts";

/**
 * Combined git commit/rollback/branch command
 * Usage: /git commit | /git rollback [position] | /git branch [options]
 */

const description =
  "/git - Git operations. Use 'commit' to commit changes, 'rollback [position]' to rollback by [position] commits (default: 1), 'branch [options]' for branch management.";

async function execute(remainder: string, agent: Agent) {

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
      let action: "list" | "create" | "switch" | "delete" | "current" | null = null;

      if (args.length > 1) {
        switch (args[1]) {
          case "list":
          case "current":
          case "create":
          case "switch":
          case "delete":
            action = args[1];
            break;
          default:
            agent.errorLine(
              `Invalid branch action: "${args[1]}". Valid actions are: list, current, create, switch, delete`,
            );
            return;
        }

        await branch({action, branchName: args[2]}, agent);
      } else {
        await branch({action: "list"}, agent);
      }
      break;
    }

    default:
      agent.errorLine(
        `Unknown git action: "${action}". Use 'commit', 'rollback', or 'branch'.`,
      );
      break;
  }
}

const help: string = `# Git Operations Command

## Usage

/git <action> [options]

## Available Actions

- **commit** - Commit changes in the source directory
- **rollback** - Roll back to a previous commit state
- **branch** - Manage git branches

## Detailed Usage

### /git commit [message]

Commits all changes in the source directory to git. If no message is provided, an AI-generated commit message will be used.

**Examples:**
/git commit
/git commit "Fix authentication bug"

### /git rollback [steps]

Rolls back to a previous commit state.
- **[steps]** - Number of commits to roll back (default: 1)

**Examples:**
/git rollback
/git rollback 3

### /git branch [action] [branchName]

Manages git branches. If no action is specified, shows current branch and lists all branches.

**Actions:**
- **list** - List all branches (local and remote)
- **current** - Show current branch
- **create** - Create and switch to a new branch
- **switch** - Switch to an existing branch
- **delete** - Delete a branch

**Examples:**
/git branch
/git branch list
/git branch current
/git branch create feature-xyz
/git branch switch main
/git branch delete feature-xyz

## Notes

- Commit operations will automatically stage all changes (git add .)
- Rollback operations will fail if there are uncommitted changes
- Branch operations require proper branch names (no spaces or special characters)
- All git operations use TokenRing Coder as the committer identity`;
export default {
  description,
  execute,
  help,
} as TokenRingAgentCommand;