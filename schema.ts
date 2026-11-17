import type { ConfigFieldMeta } from "@tokenring-ai/app/config/metadata";
import { z } from "zod";

export const GitServiceConfigSchema = z
  .object({
    autoCommit: z
      .boolean()
      .default(false)
      .meta({
        label: "Auto Commit",
        description:
          "Let the autoCommit lifecycle hook commit tracked changes after a test run passes. Off by default; the hook must also be enabled for the agent (lifecycle.enabledHooks or lifecycle.globalHooks).",
      } satisfies ConfigFieldMeta),
  })
  .prefault({})
  .meta({ label: "Git", description: "Git integration settings" } satisfies ConfigFieldMeta);

export type ParsedGitServiceConfig = z.output<typeof GitServiceConfigSchema>;
