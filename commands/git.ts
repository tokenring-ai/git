import Agent from "@tokenring-ai/agent/Agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {execute as branch} from "../tools/branch.ts";
import {execute as commit} from "../tools/commit.ts";
import {execute as rollback} from "../tools/rollback.ts";

/**
 * Combined git commit/rollback/branch command
 * Usage: /git commit | /git rollback [position] | /git branch [options]
 */

const description =
  "/git - Git operations. ";

async function execute(remainder: string, agent: Agent): Promise<string> {

  if (!remainder || !remainder.trim()) {
    throw new CommandFailedError("Usage: /git <commit|rollback|branch> [options]");
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
      return "Commit completed.";
    }
    case "rollback": {
      let steps = 1;
      if (args[1]) {
        const parsed = parseInt(args[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
          steps = parsed;
        } else {
          throw new CommandFailedError(
            `Invalid rollback position: "${args[1]}". Must be a positive integer.`,
          );
        }
      }
      await rollback({steps}, agent);
      return `Rolled back ${steps} commit(s).`;
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
            throw new CommandFailedError(
              `Invalid branch action: "${args[1]}". Valid actions are: list, current, create, switch, delete`,
            );
        }

        await branch({action, branchName: args[2]}, agent);
      } else {
        await branch({action: "list"}, agent);
      }
      return "Branch operation completed.";
    }

    default:
      throw new CommandFailedError(
        `Unknown git action: "${action}". Use 'commit', 'rollback', or 'branch'.`,
      );
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
} satisfies TokenRingAgentCommand;