import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { FileSystemService } from "@tokenring-ai/filesystem";
import { z } from "zod";
import { runGit } from "../util/runGit.ts";

const name = "git_diff";
const displayName = "Git/diff";

export async function execute(args: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const gitArgs = ["diff", "--submodule=diff"];

  if (args.staged === true) {
    gitArgs.push("--cached");
  } else if (args.staged === false) {
    // Unstaged changes only (default git diff behavior).
  } else {
    // All uncommitted changes (staged and unstaged) compared to HEAD.
    gitArgs.push("HEAD");
  }

  if (args.path) {
    gitArgs.push("--", args.path);
  }

  const output = await runGit(name, gitArgs, args.cwd, agent);

  if (output.trim() === "") {
    return {
      message: `**Retrieved** git diff`,
      result: "No changes detected",
    };
  }

  return {
    message: `**Retrieved** git diff`,
    result: output.trimEnd(),
  };
}

const description = "Returns the current git diff for uncommitted changes in the repository & submodules.";
const inputSchema = z.object({
  cwd: z.string().describe("Absolute path of the git repository to operate in. Must be inside an allowed path."),
  staged: z
    .boolean()
    .describe("If true, return only staged changes. If false, return only unstaged changes. If omitted, return all uncommitted changes.")
    .exactOptional(),
  path: z.string().describe("Optional file or directory path to limit the diff to.").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
  adjustActivation: async (enabled: boolean, agent: Agent) => {
    if (enabled) return true;

    const filesystem = agent.getService(FileSystemService);
    if (filesystem) {
      if (await filesystem.exists(".git", agent)) {
        return true;
      }
    }

    return false;
  },
} satisfies TokenRingToolDefinition<typeof inputSchema>;
