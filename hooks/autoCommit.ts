import ChatService from "@token-ring/chat/ChatService";
import FileSystemService from "@token-ring/filesystem/FileSystemService";
import {Registry} from "@token-ring/registry";
import TestingService from "@token-ring/testing/TestingService";
import {execute as commit} from "../tools/commit.ts";


export const description =
  "Automatically commit changes to the source directory to git";

export async function afterTesting(registry: Registry): Promise<void> {
  const chatService = registry.requireFirstServiceByType(ChatService);

  const filesystem = registry.requireFirstServiceByType(FileSystemService);
  if (filesystem.dirty) {
    const testingServices = registry.services.getServicesByType(TestingService);
    for (const testingService of testingServices) {
      if (!testingService.allTestsPassed(registry)) {
        chatService.errorLine(
          "Not committing changes, due to tests not passing",
        );
        return;
      }
    }
    await commit({message: ""}, registry);
  }
}