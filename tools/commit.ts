import Agent from "@tokenring-ai/agent/Agent";
import {ChatModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import {ChatService, createChatRequest} from "@tokenring-ai/chat";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import {FileSystemService} from "@tokenring-ai/filesystem";
import {z} from "zod";

// Exported tool name used for chat messages and identification
const name = "git_commit";

export async function execute(
  args: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<string> {
  const fileSystem = agent.requireServiceByType(FileSystemService);
  const chatModelRegistry = agent.requireServiceByType(ChatModelRegistry);
  const chatService = agent.requireServiceByType(ChatService);

  const currentMessage = chatService.getLastMessage(agent);

  let gitCommitMessage = args.message; // Use provided message if available

  if (!gitCommitMessage) {
    // If no message provided, generate one
    agent.infoLine(`[${name}] Asking OpenAI to generate a git commit message...`);
    gitCommitMessage = "TokenRing Coder Automatic Checkin"; // Default fallback
    if (currentMessage) {
      const model = chatService.getModel(agent);

      const chatConfig = chatService.getChatConfig(agent);

      const request = await createChatRequest(
        "Please create a git commit message for the set of changes you recently made. The message should be a short description of the changes you made. Only output the exact git commit message. Do not include any other text..",
        chatConfig,
        agent
      );

      // Keep only the last two messages (system/user) if present
      request.messages.splice(0, request.messages.length - 2);

      request.tools = {};

      const client = await chatModelRegistry.getFirstOnlineClient(model);
      const [output] = await client.textChat(request, agent);
      if (output && output.trim() !== "") {
        // Ensure AI provides a non-empty message
        gitCommitMessage = output;
      } else {
        agent.warningLine(
          `[${name}] AI did not provide a commit message, using default.`,
        );
      }
    } else {
      agent.errorLine(
        `[${name}] Most recent chat message does not have a response id, unable to generate a git commit message, using default.`,
      );
    }
  } else {
    agent.infoLine(`[${name}] Using provided commit message.`);
  }

  await fileSystem.executeCommand(["git", "add", "."]);
  await fileSystem.executeCommand([
    "git",
    "-c",
    "user.name=TokenRing Coder",
    "-c",
    "user.email=coder@tokenring.ai",
    "commit",
    "-m",
    gitCommitMessage,
  ]);
  agent.infoLine(`[${name}] Changes committed to git.`);

  fileSystem.setDirty(false);
  // Return only the result without tool name prefix
  return "Changes successfully committed to git";
}

const description = "Commits changes in the source directory to git.";
const inputSchema = z.object({
  message: z
    .string()
    .describe(
      "Optional commit message. If not provided, a message will be generated based on the chat context.",
    )
    .optional(),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;