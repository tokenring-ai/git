import TokenRingApp from "@tokenring-ai/app"; 
import {AgentCommandService, AgentLifecycleService} from "@tokenring-ai/agent";
import {ChatService} from "@tokenring-ai/chat";
import {TokenRingPlugin} from "@tokenring-ai/app";
import chatCommands from "./chatCommands.ts";
import GitService from "./GitService.js";
import hooks from "./hooks.ts";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

export {default as GitService} from "./GitService.ts";


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.addServices(new GitService());
    app.waitForService(AgentLifecycleService, lifecycleService =>
      lifecycleService.addHooks(packageJSON.name, hooks)
    );
  },
} as TokenRingPlugin;
