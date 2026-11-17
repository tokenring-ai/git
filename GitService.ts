import type { TokenRingService } from "@tokenring-ai/app/types";
import { GitServiceConfigSchema, type ParsedGitServiceConfig } from "./schema.ts";

export default class GitService implements TokenRingService {
  readonly name = "GitService";
  description = "Provides Git functionality";

  private options: ParsedGitServiceConfig = GitServiceConfigSchema.parse({});

  reconfigure(options: ParsedGitServiceConfig): void {
    this.options = options;
  }

  /** True only when the user set `git.autoCommit: true`. */
  isAutoCommitEnabled(): boolean {
    return this.options.autoCommit;
  }
}
