import Agent from "@tokenring-ai/agent/Agent";
import {HookConfig} from "@tokenring-ai/agent/types";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import TestingService from "@tokenring-ai/testing/TestingService";
import {execute as commit} from "../tools/commit.ts";

const name = "autoCommit";
const description =
  "Automatically commit changes to the source directory to git";

async function afterTesting(agent: Agent): Promise<void> {
  const testingService = agent.requireServiceByType(TestingService);
  const filesystem = agent.requireServiceByType(FileSystemService);
  if (filesystem.dirty) {
    if (!testingService.allTestsPassed(agent)) {
      agent.errorLine(
        "Not committing changes, due to tests not passing",
      );
      return;
    }
    await commit({message: ""}, agent);
  }
}

export default {name, description, afterTesting} satisfies HookConfig;