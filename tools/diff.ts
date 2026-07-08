import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition } from "@tokenring-ai/chat/schema";
import { FileSystemService } from "@tokenring-ai/filesystem";
import { TerminalService } from "@tokenring-ai/terminal";
import { z } from "zod";

const name = "git_diff";
const displayName = "Git/diff";

export async function execute(args: z.output<typeof inputSchema>, agent: Agent): Promise<string> {
  const terminal = agent.requireServiceByType(TerminalService);

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

  const result = await terminal.executeCommand("git", gitArgs, {}, agent);
  const output = result.status === "success" || result.status === "badExitCode" ? result.output : "";

  if (output.trim() === "") {
    return "No changes detected";
  }

  return output.trimEnd();
}

const description = "Returns the current git diff for uncommitted changes in the repository & submodules.";
const inputSchema = z.object({
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

    const filesystem = agent.getServiceByType(FileSystemService);
    if (filesystem) {
      if (await filesystem.exists(".git", agent)) {
        return true;
      }
    }

    return false;
  },
} satisfies TokenRingToolDefinition<typeof inputSchema>;
