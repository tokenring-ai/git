# @tokenring-ai/git

## Overview

Git integration package for TokenRing AI agents, providing Git operations within the agent framework. This package enables Git operations including commits, rollbacks, and branch management with AI-generated commit messages. It works seamlessly with the TokenRing ecosystem, providing both programmatic tools and interactive slash commands for Git operations.

## Key Features

- **AI-Powered Commit Messages**: Generate commit messages based on chat context
- **Automated Commits**: Automatic commits after successful testing via hooks
- **Interactive Commands**: `/git` slash command for Git operations
- **Branch Management**: List, create, switch, and delete branches
- **Safe Rollbacks**: Validation before rollbacks to prevent data loss
- **Filesystem Integration**: Works with TokenRing's filesystem service
- **Clean State Validation**: Ensures repository is clean before rolling back
- **Comprehensive Error Handling**: Clear validation and error messages

## Installation

```bash
bun install @tokenring-ai/git
```

## Core Components

### GitService

The main service class that provides Git service metadata.

```typescript
import GitService from "@tokenring-ai/git/GitService";

const gitService = new GitService();
console.log(gitService.name); // "GitService"
console.log(gitService.description); // "Provides Git functionality"
```

**Properties:**
- `name: string = "GitService"`: Service identifier
- `description: string = "Provides Git functionality"`: Service description

**Note:** GitService provides only metadata and registration. Use tools or chat commands for actual Git operations.

### Tools

Tools are exported from `tools.ts` and can be registered with the ChatService.

#### git_commit

Commits changes in the source directory to git.

```typescript
import commitTool from "@tokenring-ai/git/tools/commit";

const name = "git_commit";
const displayName = "Git/commit";
const description = "Commits changes in the source directory to git.";
```

**Input Schema:**
```typescript
const inputSchema = z.object({
  message: z
    .string()
    .describe(
      "Optional commit message. If not provided, a message will be generated based on the chat context.",
    )
    .optional(),
});
```

**Functionality:**
- Commits all changes to git (stages all changes with `git add .`)
- Uses AI to generate commit messages if none provided
- Matches against last two chat messages for context
- Sets git user identity as "TokenRing Coder" with email "coder@tokenring.ai"
- Returns success message "Changes successfully committed to git"
- Calls `fileSystem.setDirty(false, agent)` after commit

**Implementation Details:**
```typescript
export async function execute(
  args: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<string> {
  const fileSystem = agent.requireServiceByType(FileSystemService);
  const terminal = agent.requireServiceByType(TerminalService);
  const chatModelRegistry = agent.requireServiceByType(ChatModelRegistry);
  const chatService = agent.requireServiceByType(ChatService);

  const currentMessage = chatService.getLastMessage(agent);

  let gitCommitMessage = args.message; // Use provided message if available

  if (!gitCommitMessage) {
    // If no message provided, generate one
    agent.infoMessage(`[${name}] Asking OpenAI to generate a git commit message...`);
    gitCommitMessage = "TokenRing Coder Automatic Checkin"; // Default fallback
    
    if (currentMessage) {
      const model = chatService.requireModel(agent);
      const chatConfig = chatService.getChatConfig(agent);
      
      const messages = await chatService.buildChatMessages({
        input: "Please create a git commit message for the set of changes you recently made. The message should be a short description of the changes you made. Only output the exact git commit message. Do not include any other text..",
        chatConfig,
        agent
      });

      // Keep only the last two messages (system/user) if present
      messages.splice(0, messages.length - 2);

      const client = await chatModelRegistry.getClient(model);
      const [output] = await client.textChat({
        messages,
        tools: {}
      }, agent);
      
      if (output && output.trim() !== "") {
        gitCommitMessage = output;
      } else {
        agent.warningMessage(
          `[${name}] AI did not provide a commit message, using default.`,
        );
      }
    } else {
      agent.errorMessage(
        `[${name}] Most recent chat message does not have a response id, unable to generate a git commit message, using default.`,
      );
    }
  } else {
    agent.infoMessage(`[${name}] Using provided commit message.`);
  }

  await terminal.executeCommand("git", ["add", "."], {}, agent);
  await terminal.executeCommand("git", [
    "-c",
    "user.name=TokenRing Coder",
    "-c",
    "user.email=coder@tokenring.ai",
    "commit",
    "-m",
    gitCommitMessage,
  ], {}, agent);
  
  fileSystem.setDirty(false, agent);
  return "Changes successfully committed to git";
}
```

#### git_rollback

Rolls back to a previous git commit.

```typescript
import rollbackTool from "@tokenring-ai/git/tools/rollback";

const name = "git_rollback";
const displayName = "Git/rollback";
const description = "Rolls back to a previous git commit.";
```

**Input Schema:**
```typescript
const inputSchema = z.object({
  commit: z.string().describe("The commit hash to rollback to").optional(),
  steps: z.number().int().describe("Number of commits to roll back").optional(),
});
```

**Functionality:**
- Validates no uncommitted changes exist via `git status --porcelain`
- Aborts rollback if uncommitted changes detected
- Supports rollback to specific commit hash
- Supports rollback by number of steps
- Default behavior rolls back one commit (uses `HEAD~1`)
- Throws descriptive error on failure

**Implementation Details:**
```typescript
export async function execute(
  args: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<string> {
  const terminal = agent.requireServiceByType(TerminalService);

  // Ensure there are no uncommitted changes
  const result = await terminal.executeCommand("git", [
    "status",
    "--porcelain",
  ], {}, agent);
  const output = result.status === "success" || result.status === "badExitCode" ? result.output : "";
  
  if (output.trim() !== "") {
    throw new Error(`[${name}] Rollback aborted: uncommitted changes detected`);
  }

  try {
    // Determine which commit to roll back to
    if (args.commit) {
      // Rollback to specific commit
      agent.infoMessage(`[${name}] Rolling back to commit ${args.commit}...`);
      await terminal.executeCommand("git", ["reset", "--hard", args.commit], {}, agent);
    } else if (args.steps && Number.isInteger(args.steps) && args.steps > 0) {
      // Rollback by a number of steps
      agent.infoMessage(`[${name}] Rolling back ${args.steps} commit(s)...`);
      await terminal.executeCommand("git", [
        "reset",
        "--hard",
        `HEAD~${args.steps}`,
      ], {}, agent);
    } else {
      // Default: rollback one commit
      agent.infoMessage(`[${name}] Rolling back to previous commit...`);
      await terminal.executeCommand("git", ["reset", "--hard", "HEAD~1"], {}, agent);
    }

    agent.infoMessage(`[${name}] Rollback completed successfully.`);
    return "Successfully rolled back to previous state";
  } catch (error: any) {
    throw new Error(`[${name}] Rollback failed: ${error.shortMessage || error.message}`);
  }
}
```

**Note:** The `git_branch` tool exists in `pkg/git/tools/branch.ts` but is NOT exported from `tools.ts`. It must be imported directly if needed.

### Commands

Agent commands are exported from `commands.ts` and registered with AgentCommandService.

#### /git Command

Combined git commit/rollback/branch command.

```typescript
import gitCommand from "@tokenring-ai/git/commands/git";

const name = "git";
const description = "/git - Git operations.";
```

**Usage:** `/git <action> [options]`

**Available Actions:**
- **commit** - Commit changes in the source directory
- **rollback** - Roll back to a previous commit state
- **branch** - Manage git branches

**Implementation Details:**
```typescript
async function execute(remainder: string, agent: Agent): Promise<string> {
  if (!remainder || !remainder.trim()) {
    throw new CommandFailedError("Usage: /git <commit|rollback|branch> [options]");
  }

  const args = remainder.trim().split(/\s+/);
  const action = args[0].toLowerCase();

  switch (action) {
    case "commit": {
      const commitArgs: { message?: string } = {};
      if (args.length > 1) {
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
        // Default: list all branches (local and remote)
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
```

### Hooks

Hooks are exported from `hooks.ts` and registered with AgentLifecycleService.

#### autoCommit

Automatically commits changes to the source directory to git after successful testing.

```typescript
import {HookConfig} from "@tokenring-ai/agent/types";

const autoCommitConfig: HookConfig = {
  name: "autoCommit",
  displayName: "Git/Auto Commit",
  description: "Automatically commit changes to the source directory to git",
  callbacks: [
    new HookCallback(AfterTestsPassed, async (_data, agent) => {
      // Implementation
    })
  ]
};
```

**Functionality:**
- Triggered after testing completes (via `AfterTestsPassed` hook)
- Only commits if all tests pass (via `TestingService.allTestsPassed()`)
- Only commits if there are uncommitted changes (dirty state via `FileSystemService.isDirty()`)
- Commits with empty message, triggering AI-generated commit message
- Calls `filesystem.setDirty(false, agent)` after commit

**Implementation Details:**
```typescript
const callbacks = [
  new HookCallback(AfterTestsPassed, async (_data, agent) => {
    const testingService = agent.requireServiceByType(TestingService);
    const filesystem = agent.requireServiceByType(FileSystemService);
    
    if (filesystem.isDirty(agent)) {
      if (!testingService.allTestsPassed(agent)) {
        agent.errorMessage(
          "Not committing changes, due to tests not passing",
        );
        return;
      }
      await commit({message: ""}, agent);
    }
  })
];
```

**Required Services:**
- `TestingService`: Check if all tests passed
- `FileSystemService`: Check dirty state

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
- If no action specified, lists all branches (local and remote)
- **Actions:**
  - `list` - List all branches (local and remote) - **default when no action specified**
  - `current` - Show current branch
  - `create` - Create and switch to a new branch
  - `switch` - Switch to an existing branch
  - `delete` - Delete a branch

## Services

### GitService

The main service class that provides basic Git service metadata.

```typescript
import GitService from "@tokenring-ai/git/GitService";

const gitService = new GitService();
console.log(gitService.name); // "GitService"
console.log(gitService.description); // "Provides Git functionality"
```

**Properties:**
- `name: string = "GitService"`: Service identifier
- `description: string = "Provides Git functionality"`: Service description

## Plugin Configuration

The plugin has an empty configuration schema since it does not require any configuration options.

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import plugin from "@tokenring-ai/git/plugin";

const packageConfigSchema = z.object({});

// Plugin registration
app.use(plugin, {});
```

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

**Note:** The `git_branch` tool is NOT exported from `tools.ts`. Import it directly from `tools/branch.ts` if needed.

```typescript
// List all branches (uses git branch -a)
await agent.executeTool('git_branch', { action: "list" });

// Show current branch (uses git branch --show-current)
await agent.executeTool('git_branch', { action: "current" });

// Create a new branch and switch to it
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });

// Switch to an existing branch
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });

// Delete a branch
await agent.executeTool('git_branch', { action: "delete", branchName: "feature-xyz" });

// Using slash command
// /git branch (lists all branches - default)
// /git branch list
// /git branch current
// /git branch create feature-xyz
// /git branch switch main
// /git branch delete feature-xyz
```

**Direct tool import (since not exported from tools.ts):**
```typescript
import branchTool from "@tokenring-ai/git/tools/branch";

await agent.executeTool('git_branch', { action: "list" });
```

## Integration

### Plugin Registration

The plugin automatically registers GitService, tools, and hooks with the TokenRing app.

**Plugin Structure:**
```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {AgentCommandService, AgentLifecycleService} from "@tokenring-ai/agent";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import agentCommands from "./commands";
import GitService from "./GitService";
import hooks from "./hooks";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools";

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  config: packageConfigSchema,
  install(app, config) {
    // Register tools with ChatService
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    // Register commands with AgentCommandService
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(agentCommands)
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
- **FileSystemService**: Used for state checks
- **TerminalService**: Used for all Git command execution
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

// Interact via slash commands directly in chat
// Agent sends: /git commit "Fix bug"
// Response: Commit completed.
```

## RPC Endpoints

This package does not define any RPC endpoints. Git operations are performed via tools and commands.

## State Management

This package does not define any state slices. It relies on the FileSystemService for dirty state tracking.

**State Integration:**
- `filesystem.isDirty(agent)`: Checks if there are uncommitted changes
- `filesystem.setDirty(false, agent)`: Marks repository as clean after commit

## Error Handling

### Validation Errors

- **Branch name required**: Throws error if branchName is not provided for create/switch/delete actions
- **Invalid rollback position**: If specified as non-positive integer, throws descriptive error
- **Invalid branch action**: If action is not one of list/create/switch/delete/current, throws descriptive error
- **Unknown git action**: If action is not commit/rollback/branch, throws descriptive error

### Git Errors

- **Uncommitted changes**: Rollback aborts with clear message if any uncommitted changes exist
- **Git command failures**: All tool commands wrap errors in tool name prefix
- **Premature commit**: Commit only proceeds if repository is not in clean state (for autoCommit hook)

### Error Message Format

All git tools prefix errors with tool name:
```
[git_commit] AI did not provide a commit message, using default.
[git_commit] Most recent chat message does not have a response id, unable to generate a git commit message, using default.
[git_rollback] Rollback aborted: uncommitted changes detected
[git_rollback] Rollback failed: <error details>
[git_branch] Branch name is required for create action
```

## Configuration

### Default Git User

All git commits use the following identity:
- **Name**: `TokenRing Coder`
- **Email**: `coder@tokenring.ai`

This is set via command-line arguments to git and cannot be overridden via package configuration.

### Configuration Schema

```typescript
const packageConfigSchema = z.object({});

// No package-level configuration available
// All behavior is controlled via tools and commands
```

## Best Practices

### Commit Messages

- Provide explicit commit messages when possible for clarity
- Let AI generate messages for routine changes based on chat context
- Keep commit messages concise and descriptive

### Rollback Safety

- Always ensure repository is clean before rolling back
- Use specific commit hashes for precise rollbacks when needed
- Test rollback operations in a non-production environment first

### Branch Management

- Use descriptive branch names that follow Git conventions
- Always specify branch names explicitly for create/switch/delete operations
- Verify branch existence before switching or deleting

### Testing Integration

- Enable autoCommit hook only when tests are reliable
- Monitor test results before automatic commits
- Review AI-generated commit messages for accuracy

## Testing and Development

### Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Type check
bun run build
```

### Package Structure

```
pkg/git/
├── GitService.ts           # Main service class (TokenRingService implementation)
├── index.ts                # Main export (GitService)
├── plugin.ts               # Plugin registration and setup
├── tools.ts                # Tool exports (commitTool, rollbackTool)
├── commands.ts             # Command exports (git command)
├── hooks.ts                # Hook exports (autoCommit hook)
├── tools/
│   ├── commit.ts          # git_commit tool implementation
│   ├── rollback.ts        # git_rollback tool implementation
│   └── branch.ts          # git_branch tool implementation (NOT exported from tools.ts)
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
  "Please create a git commit message for the set of changes you recently made. The message should be a short description of the changes you made. Only output the exact git commit message. Do not include any other text..",
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
    // Execute list logic (git branch -a)
    break;
  case "create":
    if (!branchName) throw new Error("Branch name required");
    // Execute create logic (git checkout -b)
    break;
  // ... other cases
  default:
    // Note: No default case - all actions must be explicit
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
agent.infoMessage(`[${name}] Changes committed to git`);
```

## Limitations

- **Commit messages**: AI-generated messages only use the last 2 chat messages for context
- **Branch names**: Must follow standard Git naming conventions (no spaces)
- **Rollback**: Does not support interactive confirmation for safe commits
- **No status tracking**: Only basic Git operations, no advanced Git features (rebase, cherry-pick)
- **Tool return format**: Tools return only success message without context, all details logged via agent.infoMessage()
- **git_branch tool**: NOT exported from `tools.ts` - must be imported directly from `tools/branch.ts`

## Dependencies

### Production Dependencies

| Package | Version |
|---------|---------|
| @tokenring-ai/ai-client | 0.2.0 |
| @tokenring-ai/app | 0.2.0 |
| @tokenring-ai/chat | 0.2.0 |
| @tokenring-ai/agent | 0.2.0 |
| @tokenring-ai/filesystem | 0.2.0 |
| @tokenring-ai/testing | 0.2.0 |
| @tokenring-ai/utility | 0.2.0 |
| @tokenring-ai/terminal | 0.2.0 |
| execa | ^9.6.1 |
| zod | ^4.3.6 |

### Development Dependencies

| Package | Version |
|---------|---------|
| vitest | ^4.0.18 |
| typescript | ^5.9.3 |

## Related Components

- **@tokenring-ai/filesystem**: Provides FileSystemService used for state checks
- **@tokenring-ai/terminal**: Provides TerminalService used for executing git commands
- **@tokenring-ai/testing**: Provides TestingService used by autoCommit hook for test status
- **@tokenring-ai/chat**: Provides ChatService and ChatModelRegistry used by commitTool for AI message generation
- **@tokenring-ai/agent**: Provides Agent and Agent lifecycle management

## License

MIT License - see [LICENSE](./LICENSE) file for details.
