import Agent from "@tokenring-ai/agent/Agent";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import TestingService from "@tokenring-ai/testing/TestingService";
import {execute as commit} from "../tools/commit.ts";


export const description =
  "Automatically commit changes to the source directory to git";

export async function afterTesting(agent: Agent): Promise<void> {

  const filesystem = agent.requireFirstServiceByType(FileSystemService);
  if (filesystem.dirty) {
    const testingServices = agent.team.services.getItemsByType(TestingService);
    for (const testingService of testingServices) {
      if (!testingService.allTestsPassed(agent)) {
        agent.errorLine(
          "Not committing changes, due to tests not passing",
        );
        return;
      }
    }
    await commit({message: ""}, agent);
  }
}