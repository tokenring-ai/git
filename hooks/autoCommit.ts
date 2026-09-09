import path from "node:path";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import { topLevelRoots } from "@tokenring-ai/filesystem/util/allowedPaths";
import type { HookSubscription } from "@tokenring-ai/lifecycle/types";
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import { AfterTestsPassed } from "@tokenring-ai/testing/hooks";
import TestingService from "@tokenring-ai/testing/TestingService";
import { execute as commit } from "../tools/commit.ts";

const name = "autoCommit";
const displayName = "Git/Auto Commit";
const description = "Automatically commit changes to the source directory to git";

const callbacks = [
  new HookCallback(AfterTestsPassed, async (_data, agent) => {
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
          await commit({ cwd: root.path }, agent);
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
