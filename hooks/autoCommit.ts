import path from "node:path";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import { topLevelRoots } from "@tokenring-ai/filesystem/util/allowedPaths";
import type { HookSubscription } from "@tokenring-ai/lifecycle/types";
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import { AfterTestsPassed } from "@tokenring-ai/testing/hooks";
import TestingService from "@tokenring-ai/testing/TestingService";
import GitService from "../GitService.ts";
import { execute as commit } from "../tools/commit.ts";
import { runGit } from "../util/runGit.ts";

const name = "autoCommit";
const displayName = "Git/Auto Commit";
const description = "Automatically commit changes to the source directory to git";

const callbacks = [
  new HookCallback(AfterTestsPassed, async (_data, agent) => {
    // Opt-in: `git.autoCommit: true` in config. Otherwise history stays under the user's control.
    if (!agent.requireService(GitService).isAutoCommitEnabled()) return;
    const testingService = agent.requireService(TestingService);
    const filesystem = agent.requireService(FileSystemService);
    if (filesystem.isDirty(agent)) {
      if (!testingService.allTestsPassed(agent)) {
        agent.errorMessage("Not committing changes, due to tests not passing");
        return;
      }
      // No single agent cwd anymore: commit each top-level write-allowed root
      // that is a git repository.
      const writeRoots = topLevelRoots(filesystem.getConfiguredAllowedPaths().filter(entry => entry.permission === "write"));
      for (const root of writeRoots) {
        if (await filesystem.exists(path.join(root.path, ".git"), agent)) {
          const result = await commit({ cwd: root.path }, agent);
          if (!result.result.startsWith("Changes successfully")) continue;
          const [hash, subject] = (await runGit(name, ["log", "-1", "--format=%h%n%s"], root.path, agent)).trim().split("\n");
          agent.infoMessage(`[autoCommit] Committed ${hash} "${subject}" in ${root.path}. To undo: git -C ${root.path} reset --soft HEAD~1`);
        }
      }
    }
  }),
];

export default {
  name,
  displayName,
  description,
  callbacks,
} satisfies HookSubscription;
