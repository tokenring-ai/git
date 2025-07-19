import commit from "../tools/commit";
import ChatService from "@token-ring/chat/ChatService";
import FileSystemService from "@token-ring/filesystem/FileSystemService";
import TestingService from "@token-ring/testing/TestingService";

export const description = "Automatically commit changes to the source directory to git";


export async function afterTesting(registry) {
 const chatService = registry.requireFirstServiceByType(ChatService);

 const filesystem = registry.requireFirstServiceByType(FileSystemService);
 if (filesystem.dirty) {
  const testingServices = registry.getServicesByType(TestingService);
  for (const testingService of testingServices) {
   if (!testingService.allTestsPassed()) {
     chatService.errorLine("Not committing changes, due to tests not passing");
    return;
   }
  }
  await commit("",registry);
 }
}