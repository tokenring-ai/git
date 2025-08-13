import ChatService from "@token-ring/chat/ChatService";
import ModelRegistry from "@token-ring/ai-client/ModelRegistry";
import { FileSystemService } from "@token-ring/filesystem";
import { ChatMessageStorage, createChatRequest } from "@token-ring/ai-client";
import { z } from "zod";
import { Registry } from "@token-ring/registry";


export async function execute(
  args: { message?: string },
  registry: Registry,
) {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const chatMessageStorage =
    registry.requireFirstServiceByType(ChatMessageStorage);
  const fileSystem = registry.requireFirstServiceByType(FileSystemService);
  const modelRegistry = registry.requireFirstServiceByType(ModelRegistry);

  const currentMessage = chatMessageStorage.getCurrentMessage();

  let gitCommitMessage = args.message; // Use provided message if available

  if (!gitCommitMessage) {
    // If no message provided, generate one
    chatService.infoLine("Asking OpenAI to generate a git commit message...");
    gitCommitMessage = "TokenRing Coder Automatic Checkin"; // Default fallback
    if (currentMessage) {
      const request = await createChatRequest(
        {
          input: {
            role: "user",
            content:
              "Please create a git commit message for the set of changes you recently made. The message should be a short description of the changes you made. Only output the exact git commit message. Do not include any other text..",
          },
        },
        registry,
      );

      request.input.splice(0, request.input.length - 2);

      delete (request as any).tools;

      const client = modelRegistry.chat.getFirstOnlineClient('auto');
      const [output] = await client.textChat(request, registry);
      if (output && output.trim() !== "") {
        // Ensure AI provides a non-empty message
        gitCommitMessage = output;
      } else {
        chatService.warningLine(
          "AI did not provide a commit message, using default.",
        );
      }
    } else {
      chatService.errorLine(
        "Most recent chat message does not have a response id, unable to generate a git commit message, using default.",
      );
    }
  } else {
    chatService.infoLine("Using provided commit message.");
  }

  await fileSystem.executeCommand(["git", "add", "."], registry);
  await fileSystem.executeCommand([
    "git",
    "-c",
    "user.name=TokenRing Coder",
    "-c",
    "user.email=coder@tokenring.ai",
    "commit",
    "-m",
    gitCommitMessage as string,
  ]);
  chatService.systemLine("Changes committed to git.");

  fileSystem.setDirty(false);
  return "Changes successfully committed to git";
}

export const description = "Commits changes in the source directory to git.";
export const parameters = z.object({
  message: z
    .string()
    .describe(
      "Optional commit message. If not provided, a message will be generated based on the chat context.",
    )
    .optional(),
});
