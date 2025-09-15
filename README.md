# Git Package Documentation

## Overview

The `@tokenring-ai/git` package provides Git integration for TokenRing AI agents. It enables automated Git operations within the agent framework, such as committing changes, rolling back commits, and managing branches. This package is designed for use in AI-driven coding environments like TokenRing Coder, where agents can interact with Git repositories to version control code modifications. Key features include AI-generated commit messages, automatic commits after successful tests, and slash commands for interactive Git management.

The package integrates with the TokenRing agent system, leveraging services like `FileSystemService` for executing Git commands, `AIService` for generating commit messages, and `TestingService` for conditional auto-commits.

## Installation/Setup

This package is part of the TokenRing AI ecosystem. To use it:

1. Ensure the TokenRing agent framework is installed: `npm install @tokenring-ai/agent`.
2. Install this package: `npm install @tokenring-ai/git`.
3. Import and register the package in your agent configuration:

   ```typescript
   import { packageInfo } from '@tokenring-ai/git';
   // Register in agent setup
   agent.registerPackage(packageInfo);
   ```

Dependencies are managed via `package.json`. The package uses `execa` for shell command execution. Ensure the working directory is a Git repository; if not, initialize one with `git init`.

For development: Run `npm run eslint` to lint the code.

## Package Structure

The package is organized as follows:

- **index.ts**: Main entry point. Exports `GitService`, package info (`TokenRingPackage`), tools, chat commands, and hooks.
- **GitService.ts**: Core service class implementing `TokenRingService`.
- **tools/**:
  - `commit.ts`: Tool for committing changes with optional AI-generated message.
  - `rollback.ts`: Tool for resetting to previous commits.
  - `branch.ts`: Tool for branch management (list, create, switch, delete, current).
  - `tools.ts`: Re-exports tools for easy import.
- **commands/**:
  - `git.ts`: Slash command handler for `/git` operations.
  - `chatCommands.ts`: Re-exports commands.
- **hooks/**:
  - `autoCommit.ts`: Hook that auto-commits after testing if changes are present and tests pass.
  - `hooks.ts`: Re-exports hooks.
- **package.json**: Package metadata and dependencies.
- **tsconfig.json**: TypeScript configuration.
- **LICENSE**: MIT license.

## Core Components

### GitService

The primary service class for Git functionality.

- **Description**: Provides a basic interface for Git operations in the agent. Currently a placeholder implementing `TokenRingService`.
- **Properties**:
  - `name: string = "GitService"` – Service identifier.
  - `description: string = "Provides Git functionality"` – Service description.
- **Usage**: Registered automatically via the package. Access via `agent.requireFirstServiceByType(GitService)`.

### Tools

Tools are executable functions that agents can call for Git operations. They are exported via `tools.ts` and integrated into the agent.

#### commit Tool

- **Description**: Adds all changes (`git add .`) and commits them using a provided or AI-generated message. Sets the filesystem as clean after success. Uses default Git user config: `user.name=TokenRing Coder`, `user.email=coder@tokenring.ai`.
- **Key Method**: `execute(args: { message?: string }, agent: Agent): Promise<string>`
  - **Parameters**:
    - `message` (optional string): Custom commit message. If omitted, generates one via AI based on chat context.
  - **Returns**: Promise<string> – Success message.
- **Interactions**: Relies on `FileSystemService` for `git` commands and `AIService`/`ModelRegistry` for message generation.
- **Example**:
  ```typescript
  import { execute as commit } from '@tokenring-ai/git/tools/commit';
  await commit({ message: 'Fix authentication bug' }, agent);
  ```

#### rollback Tool

- **Description**: Performs a hard reset to a previous commit. Aborts if uncommitted changes exist. Ensures clean state post-execution.
- **Key Method**: `execute(args: { commit?: string; steps?: number }, agent: Agent): Promise<string>`
  - **Parameters**:
    - `commit` (optional string): Specific commit hash to reset to.
    - `steps` (optional number): Number of commits to roll back (default: 1, uses `HEAD~n`).
  - **Returns**: Promise<string> – Success message.
- **Interactions**: Uses `FileSystemService` for `git reset --hard`.
- **Example**:
  ```typescript
  import { execute as rollback } from '@tokenring-ai/git/tools/rollback';
  await rollback({ steps: 2 }, agent);  // Roll back 2 commits
  ```

#### branch Tool

- **Description**: Manages Git branches with actions like listing, creating, switching, deleting, or showing the current branch.
- **Key Method**: `execute(args: { action?: 'list' | 'create' | 'switch' | 'delete' | 'current'; branchName?: string }, agent: Agent): Promise<string>`
  - **Parameters**:
    - `action` (optional enum): Operation to perform. Defaults to showing current and listing local branches.
    - `branchName` (optional string): Required for create/switch/delete.
  - **Returns**: Promise<string> – Operation result or status.
- **Interactions**: Executes `git branch`, `git checkout`, etc., via `FileSystemService`. Logs output to agent.
- **Example**:
  ```typescript
  import { execute as branch } from '@tokenring-ai/git/tools/branch';
  await branch({ action: 'create', branchName: 'feature-xyz' }, agent);
  ```

### Chat Commands

Slash commands for interactive Git use in chat interfaces.

#### /git Command

- **Description**: Handles subcommands: `commit [message]`, `rollback [steps]`, `branch [action] [branchName]`. Delegates to respective tools.
- **Key Method**: `execute(remainder: string, agent: Agent): Promise<void>`
  - Parses input and calls tool executors.
- **Help Output**: Provides usage examples via `help()` function.
- **Interactions**: Integrates tools for implementation.
- **Example Usage in Chat**:
  ```
  /git commit "Update README"
  /git rollback 1
  /git branch create new-feature
  ```

### Hooks

Hooks trigger on agent events.

#### autoCommit Hook

- **Description**: Runs after testing (`afterTesting`). If the filesystem is dirty and all tests pass, auto-commits changes using the commit tool.
- **Key Method**: `afterTesting(agent: Agent): Promise<void>`
  - Checks `filesystem.dirty` and `TestingService.allTestsPassed()`.
- **Interactions**: Uses `FileSystemService`, `TestingService`, and commit tool.
- **Example**: Automatically invoked post-testing in agent lifecycle.

## Usage Examples

1. **Manual Commit with AI Message**:
   ```typescript
   // In agent code
   import { execute as commit } from '@tokenring-ai/git/tools/commit';
   await commit({}, agent);  // Generates message from chat context
   ```

2. **Branch Management via Command**:
   ```typescript
   // Or via chat: /git branch switch main
   import { execute as branch } from '@tokenring-ai/git/tools/branch';
   await branch({ action: 'switch', branchName: 'main' }, agent);
   ```

3. **Auto-Commit After Tests**:
   - No direct call needed; hook triggers automatically if tests pass and changes exist.

## Configuration Options

- **Git User Config**: Hardcoded defaults (`TokenRing Coder` / `coder@tokenring.ai`). Override via environment or Git config if needed.
- **AI Integration**: Relies on agent's `AIService` config for commit message generation (e.g., model selection).
- **Environment Variables**: None specific; uses agent's services.
- **Customizable**: Extend tools/hooks for repo-specific logic (e.g., remote pushes).

## API Reference

- **Exports from `index.ts`**:
  - `GitService`: The main service class.
  - `packageInfo: TokenRingPackage`: Package metadata with tools, commands, hooks.
- **Tools** (via `tools.ts`):
  - `commitTool`: `{ name: string, execute: Function, description: string, inputSchema: ZodSchema }`
  - `rollbackTool`: Similar structure.
  - `branchTool`: (Inferred from branch.ts, though not explicitly re-exported in tools.ts).
- **Chat Commands** (via `chatCommands.ts`):
  - `git`: `{ description: string, execute: Function, help: Function }`
- **Hooks** (via `hooks.ts`):
  - `autoCommit`: `{ description: string, afterTesting: Function }`

Input schemas use Zod for validation (e.g., `z.object({...})`).

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: For AI chat requests (commit messages).
- `@tokenring-ai/agent@0.1.0`: Core agent framework.
- `@tokenring-ai/filesystem@0.1.0`: Executes Git shell commands.
- `@tokenring-ai/testing@0.1.0`: Checks test passes for auto-commit.
- `@tokenring-ai/utility@0.1.0`: Utilities.
- `execa@^9.6.0`: Shell command execution.
- `zod`: Schema validation.

## Contributing/Notes

- **Testing**: No specific tests in package; integrate with agent's testing.
- **Building**: TypeScript compiles to ES modules. Run `tsc` or use bundler.
- **Limitations**: Assumes local Git repo; no remote operations (push/pull). Hard resets discard changes—use cautiously. AI message generation depends on chat context.
- **Best Practices**: Always check `git status` before operations. Extend for advanced features like merging.
- Contributions: Follow ESLint rules (`npm run eslint`). MIT licensed.