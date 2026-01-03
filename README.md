# @tokenring-ai/git

## Overview
Git integration package for TokenRing AI agents, providing automated Git operations within the agent framework. This package enables AI-driven Git operations including automated commits, rollbacks, branch management, and AI-generated commit messages. It works seamlessly with the TokenRing ecosystem, providing both programmatic tools and interactive slash commands for Git operations.

## Features
- **AI-Powered Commit Messages**: Generate commit messages based on chat context
- **Automated Commits**: Automatic commits after successful testing via hooks
- **Interactive Commands**: Slash commands for Git operations
- **Branch Management**: List, create, switch, delete branches
- **Safe Rollbacks**: Validation before rollbacks to prevent data loss
- **Filesystem Integration**: Works with TokenRing's filesystem service
- **Error Handling**: Comprehensive validation and error messages

## Installation

```bash
bun install @tokenring-ai/git
```

## Chat Commands

- `/git commit [message]`: Commit changes with optional message (AI-generated if not provided)
- `/git rollback [steps]`: Roll back by specified number of commits (default: 1)
- `/git branch [action] [name]`: Branch management commands

## Plugin Configuration

The plugin has an empty configuration schema since it does not require any configuration options.

```typescript
const config = {};
```

## Tools

Available tools for agent integration:

### git_commit
Commits changes with optional AI-generated commit messages.

```typescript
{
  name: "git_commit",
  description: "Commits changes in the source directory to git.",
  inputSchema: {
    message: z.string().describe("Optional commit message. If not provided, a message will be generated based on the chat context.").optional()
  }
}
```

**Functionality:**
- Commits all changes to git
- Uses AI to generate commit messages if none provided
- Sets git user identity as "TokenRing Coder" with email "coder@tokenring.ai"
- Stages all changes before committing

### git_rollback
Rolls back to a previous commit state.

```typescript
{
  name: "git_rollback",
  description: "Rolls back to a previous git commit.",
  inputSchema: {
    commit: z.string().describe("The commit hash to rollback to").optional(),
    steps: z.number().int().describe("Number of commits to roll back").optional()
  }
}
```

**Functionality:**
- Validates no uncommitted changes exist before rollback
- Supports rollback to specific commit hash
- Supports rollback by number of steps
- Default behavior rolls back one commit

### git_branch
Manages git branches - list, create, switch, or delete branches.

```typescript
{
  name: "git_branch",
  description: "Manages git branches - list, create, switch, or delete branches.",
  inputSchema: {
    action: z.enum(["list", "create", "switch", "delete", "current"]).describe("The branch action to perform"),
    branchName: z.string().describe("The name of the branch (required for create, switch, and delete actions)").optional()
  }
}
```

**Functionality:**
- **list**: List all branches (local and remote)
- **current**: Show current branch
- **create**: Create and switch to a new branch
- **switch**: Switch to an existing branch
- **delete**: Delete a branch

## Services

### GitService

The main service class that provides Git functionality.

```typescript
class GitService implements TokenRingService {
  name = "GitService";
  description = "Provides Git functionality";
}
```

**Properties:**
- `name: string = "GitService"`: Service identifier
- `description: string = "Provides Git functionality"`: Service description

## Hooks

### autoCommit

Automatically commits changes to the source directory to git after successful testing.

```typescript
const autoCommit = {
  name: "autoCommit",
  description: "Automatically commit changes to the source directory to git",
  afterTesting(agent: Agent): Promise<void>
};
```

**Functionality:**
- Triggers after testing completes
- Only commits if all tests pass
- Only commits if there are uncommitted changes (dirty state)

## Usage Examples

### Basic Commit with Custom Message

```typescript
await agent.executeTool('git_commit', { message: "Update README" });
```

### Commit with AI-Generated Message

```typescript
await agent.executeTool('git_commit', {});
```

### Rollback Operations

```typescript
// Rollback one commit
await agent.executeTool('git_rollback', {});

// Rollback by steps
await agent.executeTool('git_rollback', { steps: 3 });

// Rollback to specific commit
await agent.executeTool('git_rollback', { commit: "abc123def" });
```

### Branch Management

```typescript
// List all branches
await agent.executeTool('git_branch', { action: "list" });

// Show current branch
await agent.executeTool('git_branch', { action: "current" });

// Create a new branch
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });

// Switch to a branch
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });

// Delete a branch
await agent.executeTool('git_branch', { action: "delete", branchName: "feature-xyz" });
```

### Slash Commands

```bash
/git commit "Fix authentication bug"
/git commit
/git rollback 2
/git rollback
/git branch list
/git branch create feature-xyz
/git branch switch main
/git branch current
```

## Configuration

### Default Git User
- Name: `TokenRing Coder`
- Email: `coder@tokenring.ai`

This can be overridden via environment variables or Git configuration.

## Error Handling

- **Validation Errors**: Clear messages for invalid inputs
- **Git Errors**: Proper handling of Git command failures
- **State Checks**: Verify repository status before operations
- **Commit Checks**: Ensure clean state before committing
- **Branch Validation**: Ensure branch names are provided for create/switch/delete actions

## Integration

### TokenRing Plugin

Automatically registers GitService, tools, and hooks with the TokenRing app.

```typescript
import gitPlugin from '@tokenring-ai/git';

app.registerPlugin(gitPlugin);
```

### Agent Integration

```typescript
const gitService = agent.requireServiceByType(GitService);
// GitService provides only metadata, use tools for operations
```

## Development

### Testing

```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Package Structure

```
pkg/git/
├── GitService.ts           # Main service class
├── plugin.ts               # Plugin registration
├── tools.ts                # Tool exports
├── chatCommands.ts         # Chat command exports
├── hooks.ts                # Hook exports
├── tools/
│   ├── commit.ts          # git_commit tool
│   ├── rollback.ts        # git_rollback tool
│   └── branch.ts          # git_branch tool
├── hooks/
│   └── autoCommit.ts      # Auto-commit after testing hook
├── commands/
│   └── git.ts             # /git command implementation
├── package.json
├── vitest.config.ts
└── LICENSE
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.
