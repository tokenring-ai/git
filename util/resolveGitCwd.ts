import path from "node:path";
import type Agent from "@tokenring-ai/agent/Agent";
import { CommandFailedError } from "@tokenring-ai/agent/AgentError";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import { topLevelRoots } from "@tokenring-ai/filesystem/util/allowedPaths";

/**
 * The git repository the /git commands operate on: the single top-level
 * write-allowed root containing a `.git` directory. With zero or several
 * candidates there is nothing safe to pick — the caller must name a repo.
 */
export default async function resolveGitCwd(agent: Agent): Promise<string> {
  const fileSystem = agent.requireService(FileSystemService);
  const roots = topLevelRoots(fileSystem.getConfiguredAllowedPaths().filter(entry => entry.permission === "write"));

  const repoRoots: string[] = [];
  for (const root of roots) {
    if (await fileSystem.exists(path.join(root.path, ".git"), agent)) repoRoots.push(root.path);
  }

  if (repoRoots.length === 1) return repoRoots[0]!;
  if (repoRoots.length === 0) {
    throw new CommandFailedError("No git repository found among the allowed write paths. Add one with /filesystem path add <dir>.");
  }
  throw new CommandFailedError(
    `Multiple git repositories are on the allow-list (${repoRoots.join(", ")}). Ask the agent to use the git tools with an explicit cwd.`,
  );
}
