@tokenring-ai/git
=================

Overview

- @tokenring-ai/git provides Git integration for the Token Ring ecosystem. It exposes programmatic tools for common Git
  operations (commit, rollback, branch management) and a combined chat command (/git) to drive these operations
  interactively.

What this package offers

- Service: GitService (marker Service; reserved for future Git-related capabilities)
- Tools:
- tools.commitTool: Stage and commit changes with an optional or AI-generated message
- tools.rollbackTool: Reset the working copy to a previous commit (by steps or specific SHA)
- tools.branch (tools/branch.ts): List, show current, create, switch, and delete branches
- Chat command:
- chatCommands.git: A unified /git command that routes to commit, rollback, and branch actions

Exports

- index.ts
- GitService (default)
- chatCommands namespace
- tools namespace
- name, version, description

Installation
This package is part of the monorepo and is typically consumed by the Token Ring runtime. If you need it directly:

- npm: npm install @tokenring-ai/git
- pnpm: pnpm add @tokenring-ai/git
- bun: bun add @tokenring-ai/git

Requirements

- A git CLI must be available on PATH in the running environment.
- Execute commands inside a Git repository (working tree present).
- Tools use FileSystemService to run commands and ChatService to report progress/errors. Register these services in your
  ServiceRegistry.
- The commit tool can optionally generate a commit message using @tokenring-ai/ai-client when no message is provided;
  ensure ModelRegistry and ChatMessageStorage are registered for this feature.

Tools

1) tools.commitTool (tools/commit.ts)

- Description: Stages all changes (git add .) and commits them. If no message is provided, it will attempt to generate
  one using the active AI client based on recent chat context, falling back to a default message when necessary. The
  tool sets a temporary user.name/email for the commit and marks the filesystem as not dirty.
- Parameters (Zod):
  {
  message?: string; // Optional commit message. If omitted, AI may generate one.
  }
- Return: "Changes successfully committed to git"
- Notes:
- Temporarily configures:
- user.name = "TokenRing Coder"
- user.email = "coder@tokenring.ai"
- Requires: ChatService, FileSystemService, ModelRegistry, ChatMessageStorage registered in the Registry (AI generation
  path).

2) tools.rollbackTool (tools/rollback.ts)

- Description: Resets the working tree to a previous commit. Aborts if there are uncommitted changes. You can specify a
  number of steps (HEAD~n) or a specific commit SHA.
- Parameters (Zod):
  {
  commit?: string; // commit hash to reset to
  steps?: number; // positive integer number of commits to roll back (default: 1)
  }
- Behavior:
- First checks `git status --porcelain` to ensure no uncommitted changes.
- Uses `git reset --hard <target>` where target is commit, HEAD~steps, or HEAD~1 by default.
- Marks filesystem as not dirty upon success.
- Returns: success or error message string and logs via ChatService.

3) tools.branch (tools/branch.ts)

- Description: Manage branches: list, current, create, switch, delete. If no action is provided, prints current branch
  and lists local branches.
- Parameters (Zod):
  {
  action: "list" | "create" | "switch" | "delete" | "current";
  branchName?: string; // required for create, switch, and delete
  }
- Typical operations:
- list: `git branch -a`
- current: `git branch --show-current`
- create: `git checkout -b <branch>`
- switch: `git checkout <branch>`
- delete: `git branch -d <branch>`
- Returns: human-readable status strings and logs via ChatService.

Chat Command: /git (commands/git.ts)

- Description: Combined command that routes to commit, rollback, and branch tools.
- Usage:
- /git commit [message]
- /git rollback [steps]
- /git branch
- /git branch list
- /git branch current
- /git branch create <branchName>
- /git branch switch <branchName>
- /git branch delete <branchName>
- Help output (summary):
- /git <commit|rollback|branch> [options]
- /git commit [message]
- /git rollback [position]
- /git branch
- /git branch <action> [branchName]

Quick Start (programmatic)
import { ServiceRegistry } from "@tokenring-ai/registry";
import ChatService from "@tokenring-ai/chat/ChatService";
import { FileSystemService } from "@tokenring-ai/filesystem";
import ModelRegistry from "@tokenring-ai/ai-client/ModelRegistry"; // for AI commit messages
import { chatCommands, tools } from "@tokenring-ai/git";

const registry = new ServiceRegistry();
registry.registerService(new ChatService());
registry.registerService(new FileSystemService());
registry.registerService(new ModelRegistry()); // needed if you want AI-generated messages

// Commit with explicit message
await tools.commitTool.execute({ message: "Update docs" }, registry);

// Or use the chat command router (see @tokenring-ai/chat runCommand helper)
// e.g., runCommand("git", "commit Update docs", registry)

// Rollback last commit
await tools.rollbackTool.execute({ steps: 1 }, registry);

// Branch operations
await (await import("@tokenring-ai/git/tools/branch")).execute({ action: "list" }, registry);

Notes

- Run these tools in a Git repository. Operations will fail outside of a repo.
- Rollback is destructive (git reset --hard). Ensure you understand the implications before using it.
- The commit tool will stage all changes (git add .). Consider amending or partial commits by customizing the tool if
  needed.
- When no commit message is provided, the commit tool asks the AI model; if there is no recent chat context or no AI
  client available, it falls back to a default message.

License

- MIT (same as the repository license).