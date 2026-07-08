import { CommandFailedError } from "@tokenring-ai/agent/AgentError";
import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand, TokenRingAgentCommandResult } from "@tokenring-ai/agent/types";
import { execute as diff } from "../../tools/diff.ts";

const inputSchema = {
  args: {
    staged: {
      type: "flag",
      description: "Show only staged changes",
    },
    unstaged: {
      type: "flag",
      description: "Show only unstaged changes",
    },
  },
  positionals: [
    {
      name: "path",
      description: "Optional file or directory path to limit the diff to",
      required: false,
    },
  ],
} as const satisfies AgentCommandInputSchema;

async function execute({ args, positionals, agent }: AgentCommandInputType<typeof inputSchema>): Promise<TokenRingAgentCommandResult> {
  if (args.staged && args.unstaged) {
    throw new CommandFailedError("Cannot use both --staged and --unstaged");
  }

  const diffArgs: { staged?: boolean; path?: string } = {};
  if (args.staged) {
    diffArgs.staged = true;
  } else if (args.unstaged) {
    diffArgs.staged = false;
  }
  if (positionals.path) {
    diffArgs.path = positionals.path;
  }

  return {
    message: "See attached file for git diff output.",
    attachments: [
      {
        type: "attachment",
        name: "git_diff.txt",
        mimeType: "text/x-diff",
        body: await diff(diffArgs, agent),
        encoding: "text",
        timestamp: Date.now(),
      },
    ],
  };
}

export default {
  name: "git diff",
  description: "Show uncommitted changes in the repository",
  inputSchema,
  execute,
  help: `Show the current git diff for uncommitted changes.

## Options

--staged     Show only staged changes
--unstaged   Show only unstaged changes

## Examples

/git diff
/git diff --staged
/git diff src/index.ts`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
