import {TokenRingService} from "@tokenring-ai/app/types";

export default class GitService implements TokenRingService {
  readonly name = "GitService";
  description = "Provides Git functionality";
}
