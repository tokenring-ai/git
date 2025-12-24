# @tokenring-ai/git

Git integration package for TokenRing AI agents, providing automated Git operations within the agent framework.

## Overview

The `@tokenring-ai/git` package enables AI-driven Git operations for TokenRing agents, including automated commits, rollbacks, branch management, and AI-generated commit messages. This package is designed to work seamlessly with the TokenRing ecosystem, providing both programmatic tools and interactive slash commands for Git operations.

Key features include:
- AI-powered commit message generation based on chat context
- Automated commits after successful testing
- Interactive slash commands for Git operations
- Branch management capabilities
- Safe rollback operations with validation
- Git status checks and dirty file detection
- Integrated with TokenRing's filesystem and testing services

## Installation

```bash
bun install @tokenring-ai/git
```

## Usage

### Basic Setup

```typescript
import { GitService } from '@tokenring-ai/git';

// The package automatically registers with the TokenRing app
// GitService is available as a service in the agent system
```

### Package Registration

The package exports a default plugin that automatically integrates with the TokenRing app:

```typescript
import gitPackage from '@tokenring-ai/git';

// Register with your TokenRing app
app.registerPackage(gitPackage);
```

## API Reference

### Core Service

#### GitService

The main service class that provides Git functionality.

```typescript
import GitService from '@tokenring-ai/git/GitService';

// Access via dependency injection
const gitService = agent.requireServiceByType(GitService);
```

**Properties:**
- `name: string = "GitService"` - Service identifier
- `description: string = "Provides Git functionality"` - Service description

### Tools

#### commitTool

Commits changes to the Git repository with optional AI-generated commit messages.

```typescript
import { commitTool } from '@tokenring-ai/git/tools';

// Usage in agent code
await commitTool.execute({ message: "Fix authentication bug" }, agent);
```

**Parameters:**
- `message?: string` - Optional custom commit message. If not provided, generates one using AI based on chat context

**Features:**
- Automatically adds all changes (`git add .`)
- Uses AI to generate commit messages when none provided
- Sets filesystem as clean after successful commit
- Uses default Git user: `TokenRing Coder <coder@tokenring.ai>`
- Validates git repository state before committing
- Generates commit messages based on recent chat context

#### rollbackTool

Rolls back to a previous commit state.

```typescript
import { rollbackTool } from '@tokenring-ai/git/tools';

// Roll back by number of commits
await rollbackTool.execute({ steps: 2 }, agent);

// Roll back to specific commit
await rollbackTool.execute({ commit: "abc123" }, agent);
```

**Parameters:**
- `commit?: string` - Specific commit hash to reset to
- `steps?: number` - Number of commits to roll back (default: 1)

**Features:**
- Validates no uncommitted changes exist before rollback
- Performs hard reset (`git reset --hard`)
- Ensures clean filesystem state after operation
- Validates input parameters

#### branchTool

Manages Git branches with various operations.

```typescript
import { branchTool } from '@tokenring-ai/git/tools';

// List all branches
await branchTool.execute({ action: "list" }, agent);

// Create new branch
await branchTool.execute({ action: "create", branchName: "feature-xyz" }, agent);

// Switch to existing branch
await branchTool.execute({ action: "switch", branchName: "main" }, agent);

// Show current branch
await branchTool.execute({ action: "current" }, agent);

// Delete branch
await branchTool.execute({ action: "delete", branchName: "old-feature" }, agent);
```

**Parameters:**
- `action: "list" | "create" | "switch" | "delete" | "current"` - Branch operation to perform
- `branchName?: string` - Required for create, switch, and delete actions

**Features:**
- Supports local and remote branch listing
- Creates and switches to new branches in one operation
- Validates branch existence before switch
- Provides detailed branch information

### Chat Commands

#### /git Command

Interactive slash command for Git operations in chat interfaces.

```bash
# Commit changes
/git commit "Update README documentation"

# Roll back commits
/git rollback
/git rollback 3

# Branch operations
/git branch
/git branch list
/git branch create feature-xyz
/git branch switch main
/git branch delete feature-xyz
```

**Subcommands:**
- `commit [message]` - Commit changes with optional message
- `rollback [steps]` - Roll back by specified number of commits (default: 1)
- `branch [action] [branchName]` - Perform branch operations

### Hooks

#### autoCommit Hook

Automatically commits changes after successful testing.

```typescript
import { autoCommit } from '@tokenring-ai/git/hooks';

// Hook is automatically registered and triggers after testing
// Commits changes if filesystem is dirty and all tests pass
```

**Behavior:**
- Triggers after testing completes
- Checks if filesystem has uncommitted changes
- Only commits if all tests pass
- Uses the commit tool with empty message (AI generates from context)

## Package Structure

```
pkg/git/
├── index.ts              # Main entry point and package registration
├── GitService.ts         # Core Git service implementation
├── tools.ts              # Tool exports
├── chatCommands.ts       # Chat command exports
├── hooks.ts              # Hook exports
├── commands/
│   └── git.ts           # /git slash command implementation
├── tools/
│   ├── commit.ts        # Commit tool implementation
│   ├── rollback.ts      # Rollback tool implementation
│   └── branch.ts        # Branch management tool
├── hooks/
│   └── autoCommit.ts    # Auto-commit hook implementation
├── package.json         # Package metadata and dependencies
├── tsconfig.json        # TypeScript configuration
└── LICENSE              # MIT license
```

## Dependencies

- `@tokenring-ai/ai-client@0.2.0` - AI service integration for commit message generation
- `@tokenring-ai/app@0.2.0` - Application framework
- `@tokenring-ai/chat@0.2.0` - Chat service integration
- `@tokenring-ai/agent@0.2.0` - Agent framework
- `@tokenring-ai/filesystem@0.2.0` - Filesystem operations
- `@tokenring-ai/testing@0.2.0` - Testing service integration
- `@tokenring-ai/utility@0.2.0` - Utility functions
- `execa@^9.6.1` - Shell command execution
- `zod` - Schema validation

## Configuration

### Git User Configuration

The package uses default Git user configuration:
- Name: `TokenRing Coder`
- Email: `coder@tokenring.ai`

This can be overridden by setting your own Git configuration or through environment variables.

### AI Integration

Commit message generation relies on the agent's AI service configuration. The AI analyzes recent chat context to generate appropriate commit messages.

## Examples

### 1. Automated Commit with AI Message

```typescript
// In agent code - no message provided, AI generates from context
await commitTool.execute({}, agent);
```

### 2. Manual Commit with Custom Message

```typescript
// In agent code - provide custom message
await commitTool.execute({ 
  message: "Fix authentication vulnerability" 
}, agent);
```

### 3. Branch Management via Chat

```bash
# In chat interface
/git branch create new-auth-feature
/git branch switch new-auth-feature
```

### 4. Rollback Operations

```typescript
// Roll back one commit
await rollbackTool.execute({}, agent);

// Roll back multiple commits
await rollbackTool.execute({ steps: 3 }, agent);

// Roll back to specific commit
await rollbackTool.execute({ 
  commit: "a1b2c3d4e5f6" 
}, agent);
```

### 5. Using the Chat Command

```bash
# Commit with AI-generated message
/git commit

# Commit with custom message
/git commit "Fix bug in authentication logic"

# Roll back 2 commits
/git rollback 2

# List all branches
/git branch list

# Create and switch to new branch
/git branch create feature-update
```

## Development

### Scripts

```bash
# Lint the code
bun run eslint

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### TypeScript Configuration

The package uses TypeScript with modern ES modules configuration:
- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Includes all .ts files in the package

## Limitations and Considerations

- **Git Repository**: Assumes the working directory is a Git repository
- **Local Operations**: Currently only supports local Git operations (no remote push/pull)
- **Safety**: Rollback operations discard changes - use with caution
- **AI Dependencies**: Commit message generation depends on available AI services and chat context
- **Testing**: No specific tests in this package; relies on agent-level testing
- **Branch Operations**: Requires proper Git branch naming conventions

## Contributing

1. Follow the existing code style and patterns
2. Run `bun run eslint` before committing changes
3. Ensure all functionality works with the TokenRing agent framework
4. Add appropriate error handling and logging
5. Update tests if adding new functionality

## License

MIT License - see LICENSE file for details.