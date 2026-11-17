import type Agent from "@tokenring-ai/agent/Agent";
import ChatService from "@tokenring-ai/chat/ChatService";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";
import codeBlock from "@tokenring-ai/utility/string/codeBlock";
import { z } from "zod";
import { runGit } from "../util/runGit.ts";

const name = "git_rollback";
const displayName = "Git/rollback";

/** Discards local changes; earlier commits stay in the reflog (approval standard: own data loss). */
const ROLLBACK_SAFETY_LEVEL = 6;

export async function execute(args: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const chatService = agent.requireService(ChatService);

  const toolName = "rollback";

  // Ensure there are no uncommitted changes
  // A failed status (not a repository, say) must stop the rollback, not read as "no changes".
  const output = await runGit(name, ["status", "--porcelain"], args.cwd, agent);
  if (output.trim() !== "") {
    throw new ToolCallError(name, `Rollback aborted: uncommitted changes detected`);
  }

  // Determine which commit to roll back to
  let resetTarget: string;
  let summary: string;
  if (args.commit) {
    resetTarget = args.commit;
    summary = `commit ${args.commit}`;
  } else if (args.steps && Number.isInteger(args.steps) && args.steps > 0) {
    resetTarget = `HEAD~${args.steps}`;
    summary = `${args.steps} commit(s)`;
  } else {
    resetTarget = "HEAD~1";
    summary = "the previous commit";
  }

  const confirmed = await chatService.checkToolApproval(
    {
      toolName: name,
      message: `Run \`git reset --hard ${resetTarget}\` in ${args.cwd}? This permanently discards commits.`,
      detailedDescription: [
        `Rewind the repository to ${summary}:`,
        codeBlock(`git reset --hard ${resetTarget}`, "bash"),
        "",
        "Commits after the target are removed from the branch. Uncommitted changes abort the rollback before this point, but the reset itself cannot be undone.",
      ].join("\n"),
      safetyLevel: ROLLBACK_SAFETY_LEVEL,
      default: false,
    },
    agent,
  );
  if (!confirmed) {
    throw new ToolCallError(name, "User did not approve the rollback");
  }

  agent.infoMessage(`[${toolName}] Rolling back to ${summary}...`);
  await runGit(name, ["reset", "--hard", resetTarget], args.cwd, agent);

  agent.infoMessage(`[${toolName}] Rollback completed successfully.`);
  return {
    message: `**Rolled back**`,
    result: "Successfully rolled back to previous state",
  };
}

const description = "Rolls back to a previous git commit. Requires user approval because the reset is destructive.";

const inputSchema = z.object({
  cwd: z.string().describe("Absolute path of the git repository to operate in. Must be inside an allowed path."),
  commit: z.string().describe("The commit hash to rollback to").exactOptional(),
  steps: z.number().int().describe("Number of commits to roll back").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
