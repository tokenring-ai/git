import {AgentCommandService} from "@tokenring-ai/agent";
import type {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {AgentLifecycleService} from "@tokenring-ai/lifecycle";
import {z} from "zod";
import agentCommands from "./commands.ts";
import GitService from "./GitService.ts";
import hooks from "./hooks.ts";
import packageJSON from "./package.json" with {type: "json"};
import tools from "./tools.ts";

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  displayName: "Git Integration",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, _config) {
    app.waitForService(ChatService, (chatService) =>
      chatService.addTools(tools),
    );
    app.waitForService(AgentCommandService, (agentCommandService) =>
      agentCommandService.addAgentCommands(agentCommands),
    );
    app.addServices(new GitService());
    app.waitForService(AgentLifecycleService, (lifecycleService) =>
      lifecycleService.addHooks(hooks),
    );
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
