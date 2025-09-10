import {TokenRingPackage} from "@tokenring-ai/agent";
import * as chatCommands from "./chatCommands.ts";
import * as hooks from "./hooks.ts";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";

export {default as GitService} from "./GitService.ts";


export const packageInfo: TokenRingPackage = {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  chatCommands,
  tools,
  hooks
};
