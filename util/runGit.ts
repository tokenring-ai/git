import type Agent from "@tokenring-ai/agent/Agent";
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";
import { TerminalService } from "@tokenring-ai/terminal";

/**
 * Runs git in `cwd` and returns its output. A non-zero exit, a timeout or a failure to start is
 * thrown as a ToolCallError carrying git's output, so a failed command is never reported as done.
 */
export async function runGit(toolName: string, args: string[], cwd: string, agent: Agent): Promise<string> {
  const result = await agent.requireService(TerminalService).executeCommand("git", args, { workingDirectory: cwd }, agent);
  if (result.status === "success") return result.output;
  const detail =
    result.status === "unknownError"
      ? result.error
      : result.status === "timeout"
        ? `timed out\n${result.output}`
        : `exited with code ${result.exitCode}\n${result.output}`;
  throw new ToolCallError(toolName, `git ${args.join(" ")} failed: ${detail.trim()}`);
}
