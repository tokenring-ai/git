# @tokenring-ai/git

## Overview

Git integration package for TokenRing AI agents, providing automated Git operations within the agent framework. This package enables AI-driven Git operations including automated commits, rollbacks, branch management, and AI-generated commit messages. It works seamlessly with the TokenRing ecosystem, providing both programmatic tools and interactive slash commands for Git operations.

## Features

- **AI-Powered Commit Messages**: Generate commit messages based on chat context
- **Automated Commits**: Automatic commits after successful testing via hooks
- **Interactive Commands**: Slash commands for Git operations
- **Branch Management**: List, create, switch, and delete branches
- **Safe Rollbacks**: Validation before rollbacks to prevent data loss
- **Filesystem Integration**: Works with TokenRing's filesystem service
- **Clean State Validation**: Ensures repository is clean before committing
- **Comprehensive Error Handling**: Clear validation and error messages

## Installation

```bash
bun install @tokenring-ai/git
```

## Plugin Configuration

The plugin has an empty configuration schema since it does not require any configuration options.

```typescript
const config = z.object({}); // Empty configuration
```

## Chat Commands

Available slash commands for Git operations:

- `/git commit [message]` - Commit changes with optional message (AI-generated if not provided)
- `/git rollback [steps]` - Rollback by specified number of commits (default: 1)
- `/git branch [action] [branchName]` - Branch management commands

### Detailed Commands

**`/git commit [message]`**
- Commits all changes in the source directory to git
- If no message is provided, an AI-generated commit message will be used
- Stages all changes before committing (git add .)
- Uses "TokenRing Coder" as the committer identity

**`/git rollback [steps]`**
- Rolls back to a previous commit state
- **[steps]** - Number of commits to roll back (default: 1)
- Validation: Aborts if there are uncommitted changes
- Supports rollback by number of steps or to specific commit hash

**`/git branch [action] [branchName]`**
- Manages git branches
- If no action specified, shows current branch and lists all branches
- **Actions:**
  - `list` - List all branches (local and remote)
  - `current` - Show current branch
  - `create` - Create and switch to a new branch
  - `switch` - Switch to an existing branch
  - `delete` - Delete a branch

## Tools

Available tools for agent integration via tools.ts:

### git_commit
Commits changes in the source directory to git.

```typescript
{
  name: "git_commit",
  displayName: "Git/commit",
  description: "Commits changes in the source directory to git.",
  inputSchema: {
    message: z.object({
      description: "Optional commit message. If not provided, a message will be generated based on the chat context.",
      type: "string"
    }).optional()
  }
}
```

**Functionality:**
- Commits all changes to git
- Uses AI to generate commit messages if none provided
- Matches against last two chat messages for context
- Sets git user identity as "TokenRing Coder" with email "coder@tokenring.ai"
- Stages all changes before committing (git add .)
- Responds only with success message, no tool name prefix

### git_rollback
Rolls back to a previous git commit.

```typescript
{
  name: "git_rollback",
  displayName: "Git/rollback",
  description: "Rolls back to a previous git commit.",
  inputSchema: {
    commit: z.object({
      description: "The commit hash to rollback to",
      type: "string"
    }).optional(),
    steps: z.object({
      description: "Number of commits to roll back",
      type: "number",
      int: true
    }).optional()
  }
}
```

**Functionality:**
- Validates no uncommitted changes exist via `git status --porcelain`
- Aborts rollback if uncommitted changes detected
- Supports rollback to specific commit hash
- Supports rollback by number of steps
- Default behavior rolls back one commit (use HEAD~1)
- Throws descriptive error with tool name prefix on failure

### git_branch
Manages git branches - list, create, switch, or delete branches.

```typescript
{
  name: "git_branch",
  displayName: "Git/branch",
  description: "Manages git branches - list, create, switch, or delete branches.",
  inputSchema: {
    action: z.object({
      description: "The branch action to perform",
      type: "enum",
      values: ["list", "create", "switch", "delete", "current"]
    }),
    branchName: z.object({
      description: "The name of the branch (required for create, switch, and delete actions)",
      type: "string"
    }).optional()
  }
}
```

**Functionality:**

**list** - List all branches (local and remote):
```typescript
await agent.executeTool('git_branch', { action: "list" });
// Returns all branches from git branch -a
 Agent output includes tool name prefix for each branch line
```

**current** - Show current branch:
```typescript
await agent.executeTool('git_branch', { action: "current" });
// Returns current branch name from git branch --show-current
```

**create** - Create a new branch:
```typescript
// Branch name is required
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });
// Creates and switches to new branch using git checkout -b
 Agent confirms successful creation and checkout
```

**switch** - Switch to an existing branch:
```typescript
// Branch name is required
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });
// Switches to existing branch using git checkout
 Agent confirms successful switch
```

**delete** - Delete a branch:
```typescript
// Branch name is required
await agent.executeTool('git_branch', { action: "delete", branchName: "feature-xyz" });
// Deletes branch using git branch -d
 Agent confirms successful deletion
```

**Default** - When no action specified:
```typescript
await agent.executeTool('git_branch', {});
// Shows current branch and all local branches (git branch --show-current && git branch)
```

## Services

### GitService

The main service class that provides basic Git service metadata.

```typescript
import {TokenRingService} from "@tokenring-ai/app/types";

export default class GitService implements TokenRingService {
  name = "GitService";
  description = "Provides Git functionality";
}
```

**Properties:**
- `name: string = "GitService"`: Service identifier
- `description: string = "Provides Git functionality"`: Service description

**Note:** GitService provides only metadata and registration. Use tools (`git_commit`, `git_rollback`, `git_branch`) or chat commands for actual Git operations.

## Hooks

### autoCommit

Automatically commits changes to the source directory to git after successful testing.

```typescript
import {HookConfig} from "@tokenring-ai/agent/types";

const autoCommitConfig: HookConfig = {
  name: "autoCommit",
  displayName: "Git/Auto Commit",
  description: "Automatically commit changes to the source directory to git",
  afterTesting: async (agent: Agent): Promise<void> => {
    // Implementation
  }
};
```

**Functionality:**
- Triggered after testing completes
- Only commits if all tests pass (via TestingService)
- Only commits if there are uncommitted changes (dirty state)
- Commits with empty message, triggering AI-generated commit message
- Returns error message if tests are failing or repository is clean

**Required Services:**
- `TestingService`: Check if all tests passed
- `FileSystemService`: Check dirty state and execute commands

**Agent State Effects:**
- Calls `filesystem.setDirty(false)` to mark repository as clean after commit

## Usage Examples

### Basic Commit with Custom Message

```typescript
// Using tool
await agent.executeTool('git_commit', { message: "Update README" });

// Using slash command
// Agent command service will execute: /git commit "Update README"
```

### Commit with AI-Generated Message

```typescript
// Using tool
await agent.executeTool('git_commit', {});

// Using slash command
// Agent command service will execute: /git commit
// AI generates message from last 2 chat messages
```

### Rollback Operations

```typescript
// Rollback one commit (default)
await agent.executeTool('git_rollback', {});

// Rollback by steps
await agent.executeTool('git_rollback', { steps: 3 });

// Rollback to specific commit
await agent.executeTool('git_rollback', { commit: "abc123def" });

// Using slash command
// /git rollback
// /git rollback 3
// /git rollback abc123def
```

### Branch Management

```typescript
// List all branches (returns using git branch -a)
await agent.executeTool('git_branch', { action: "list" });

// Show current branch (returns using git branch --show-current)
await agent.executeTool('git_branch', { action: "current" });

// Show current branch and list local branches (default behavior)
await agent.executeTool('git_branch', {});

// Create a new branch and switch to it
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });

// Switch to an existing branch
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });

// Delete a branch
await agent.executeTool('git_branch', { action: "delete", branchName: "feature-xyz" });

// Using slash command
// /git branch
// /git branch list
// /git branch current
// /git branch create feature-xyz
// /git branch switch main
// /git branch delete feature-xyz
```

## Error Handling

### Validation Errors

- **Branch name required**: Throws error if branchName is not provided for create/switch/delete actions
- **Invalid rollback position**: If specified as non-positive integer, throws descriptive error
- **Invalid branch action**: If action is not one of list/create/switch/delete/current, throws descriptive error
- **Unknown git action**: If action is not commit/rollback/branch, throws descriptive error

### Git Errors

- **Uncommitted changes**: Rollback aborts with clear message if any uncommitted changes exist
- **Git command failures**: All tool commands wrap errors in tool name prefix
- **Premature commit**: Commit only proceeds if repository is not in clean state

### State Checks

- **Dirty state check**: autoCommit hook only commits if `isDirty(true)`
- **Test status check**: autoCommit hook only commits if all tests passed
- **Clean repository**: Git operations validate repository state before executing

### Error Message Format

All git tools prefix errors with tool name:
```
[git_commit] AI did not provide a commit message, using default.
[git_commit] Most recent chat message does not have a response id, unable to generate a git commit message, using default.
[git_rollback] Rollback aborted: uncommitted changes detected
[git_rollback] Rollback failed: <error details>
[git_branch] Branch name is required for create action
```

## Integration

### Plugin Registration

Automatically registers GitService, tools, and hooks with the TokenRing app through package.json plugin definition.

**Plugin Structure:**
```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import chatCommands from "./chatCommands.ts";
import GitService from "./GitService.js";
import hooks from "./hooks.ts";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

const packageConfigSchema = z.object({}); // Empty configuration

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  config: packageConfigSchema,
  install(app, config) {
    // Register chat tools with ChatService
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    // Register chat commands with AgentCommandService
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );

    // Register GitService
    app.addServices(new GitService());

    // Register hooks with AgentLifecycleService
    app.waitForService(AgentLifecycleService, lifecycleService =>
      lifecycleService.addHooks(packageJSON.name, hooks)
    );
  }
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Required Services

For tools to function properly, the following services must be available:

- **ChatService**: Required for tool registration (added by framework)
- **ChatModelRegistry**: Used by git_commit for AI message generation
- **FileSystemService**: Used for all Git command execution and state checks
- **AgentCommandService**: Required for slash command registration
- **TestingService**: Used by autoCommit hook for test status
- **AgentLifecycleService**: Required for hook registration

### Agent Integration Pattern

```typescript
// Access GitService for metadata
import {GitService} from "@tokenring-ai/git";
const gitService = agent.requireServiceByType(GitService);
console.log(gitService.name, gitService.description);

// Use git_commit tool
await agent.executeTool('git_commit', { message: "My changes" });

// Use git_rollback tool
await agent.executeTool('git_rollback', { steps: 5 });

// Use git_branch tool
await agent.executeTool('git_branch', { action: "create", branchName: "feature-new" });

// Interact via slash commands directly in chat
// Agent sends: /git commit "Fix bug"
// Response: [git_commit] Changes successfully committed to git
```

### Workflow Examples

**Automatic Commit After Testing:**
```typescript
// 1. Agent makes changes to files
// 2. Agent runs tests via testing service
// 3. TestingService.allTestsPassed(agent) returns true
// 4. autoCommit hook fires
// 5. autoCommit checks: isDirty(agent) && allTestsPassed
// 6. git_commit executed with empty message
// 7. AI generates commit message from chat history
// 8. Files committed and dirty state cleared
```

**Rollback with Uncommitted Changes:**
```typescript
// 1. Agent attempts rollback via git_rollback
// 2. FileSystemService.executeCommand(['git', 'status', '--porcelain'])
// 3. If statusOutput is not empty:
//    - Error thrown with message "[git_rollback] Rollback aborted: uncommitted changes detected"
// 4. Rollback does NOT execute
```

**Branch Switching:**
```typescript
// 1. Agent calls git_branch with action: "switch"
// 2. FileSystemService.executeCommand(['git', 'checkout', branchName])
// 3. Agent receives confirmation: "Successfully switched to branch 'main'"
```

## Configuration

### Default Git User

All git commits use the following identity:
- **Name**: `TokenRing Coder`
- **Email**: `coder@tokenring.ai`

This can be overridden via environment variables or direct Git configuration.

### Configuration Schema

```typescript
const packageConfigSchema = z.object({});

// No agent-level configuration available
// All behavior is controlled via tools and commands
```

## Development

### Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Package Structure

```
pkg/git/
├── GitService.ts           # Main service class (TokenRingService implementation)
├── index.ts                # Main export (GitService)
├── plugin.ts               # Plugin registration and setup
├── tools.ts                # Tool exports (git_commit, git_rollback, git_branch)
├── chatCommands.ts         # Chat command exports (git command)
├── hooks.ts                # Hook exports (autoCommit hook)
├── tools/
│   ├── commit.ts          # git_commit tool implementation
│   ├── rollback.ts        # git_rollback tool implementation
│   └── branch.ts          # git_branch tool implementation
├── hooks/
│   └── autoCommit.ts      # autoCommit hook implementation
├── commands/
│   └── git.ts             # /git command implementation
├── package.json
├── vitest.config.ts
└── LICENSE
```

### Key Implementation Patterns

**AI Message Generation:**
```typescript
// git_commit generates commit messages from chat context
const messages = await chatService.buildChatMessages(
  "Please create a git commit message...",
  chatConfig,
  agent
);

// Keep only last 2 messages (system/user)
messages.splice(0, messages.length - 2);

// Generate message via AI
const [output] = await client.textChat({ messages, tools: {} }, agent);

// Use AI-generated message or fallback
gitCommitMessage = output || "TokenRing Coder Automatic Checkin";
```

**Branch Tool Dispatch:**
```typescript
// git_branch uses switch statement for action routing
switch (action) {
  case "list":
    // Execute list logic
    break;
  case "create":
    if (!branchName) throw new Error("Branch name required");
    // Execute create logic
    break;
  // ... other cases
  default:
    // Default behavior (show current and list)
}
```

**State Management:**
```typescript
// Check dirty state before auto commit
if (filesystem.isDirty(agent)) {
  if (!testingService.allTestsPassed(agent)) {
    agent.errorMessage("Not committing changes, due to tests not passing");
    return;
  }
  await commit({message: ""}, agent);
}

// Mark as clean after commit
fileSystem.setDirty(false, agent);
```

**Error Prefix Pattern:**
```typescript
// All errors prefixed with tool name for consistency
throw new Error(`[${name}] Rollback failed: ${error.message}`);
agent.errorMessage(`[${name}] Changes committed to git`);
```

## Limitations

- **Commit messages**: AI-generated messages only use the last 2 chat messages for context
- **Branch names**: Must follow standard Git naming conventions (no spaces, need validation)
- **Rollback**: Does not support interactive confirmation for safe commits
- **No status tracking**: Only basic Git operations, no advanced Git features (rebase, cherry-pick)
- **Tool return format**: Tools return only success message without context, all details logged via agent.infoMessage()

## Related Package

- **@tokenring-ai/filesystem**: Provides FileSystemService used by git tools for command execution

## License

MIT License - see [LICENSE](./LICENSE) file for details.
