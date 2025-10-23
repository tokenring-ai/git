import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import * as chatCommands from "./chatCommands.ts";
import GitService from "./GitService.js";
import * as hooks from "./hooks.ts";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";

export {default as GitService} from "./GitService.ts";


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    agentTeam.addTools(packageJSON.name, tools)
    agentTeam.addChatCommands(chatCommands);
    agentTeam.addServices(new GitService());
    agentTeam.addHooks(packageJSON.name, hooks);
  },
} as TokenRingPackage;
