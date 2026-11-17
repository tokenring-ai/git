import { afterEach, describe, expect, it, spyOn } from "bun:test";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent.test";
import { ChatModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp.test";
import ChatService from "@tokenring-ai/chat/ChatService";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import { FileSystemConfigSchema } from "@tokenring-ai/filesystem/schema";
import { TerminalService } from "@tokenring-ai/terminal";
import TestingService from "@tokenring-ai/testing/TestingService";
import GitService from "../GitService.ts";
import autoCommit from "../hooks/autoCommit.ts";
import { GitServiceConfigSchema } from "../schema.ts";

async function runReal(command: string, args: string[], { workingDirectory }: { workingDirectory?: string }) {
  const proc = Bun.spawn([command, ...args], { ...(workingDirectory && { cwd: workingDirectory }), stdout: "pipe", stderr: "pipe" });
  const output = (await new Response(proc.stdout).text()) + (await new Response(proc.stderr).text());
  const exitCode = await proc.exited;
  return exitCode === 0 ? { status: "success" as const, output, exitCode: 0 as const } : { status: "badExitCode" as const, output, exitCode };
}

describe("autoCommit hook", () => {
  let repo = "";
  afterEach(async () => {
    if (repo) await fs.rm(repo, { recursive: true, force: true });
  });

  async function setup(config: unknown, testsPassed: boolean) {
    repo = await fs.realpath(await fs.mkdtemp(path.join(tmpdir(), "git-autocommit-")));
    const git = (...args: string[]) => runReal("git", args, { workingDirectory: repo });
    await git("init", "-q", "-b", "main");
    await fs.writeFile(path.join(repo, "a.txt"), "one\n");
    await git("add", "a.txt");
    await git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "first");
    await fs.writeFile(path.join(repo, "a.txt"), "two\n");

    const app = createTestingApp();
    app.addService(TerminalService, { executeCommand: runReal } as never);
    app.addService(ChatService, { getLastMessage: () => null } as never);
    app.addService(ChatModelRegistry, {} as never);
    app.addService(TestingService, { allTestsPassed: () => testsPassed } as never);
    const gitService = new GitService();
    gitService.reconfigure(GitServiceConfigSchema.parse(config));
    app.addService(GitService, gitService);
    const fileSystem = new FileSystemService(app, FileSystemConfigSchema.parse({ allowedPaths: [{ path: repo, permission: "write" }] }));
    app.addService(FileSystemService, fileSystem);
    const agent = createTestingAgent(app);
    fileSystem.setDirty(true, agent);
    const info = spyOn(agent, "infoMessage");
    const error = spyOn(agent, "errorMessage");
    const run = () => autoCommit.callbacks[0]!.callback({} as never, agent);
    const log = async () => (await git("log", "--format=%s")).output.trim().split("\n");
    return { run, log, info, error };
  }

  it("is off by default and does nothing", async () => {
    const { run, log } = await setup({}, true);
    await run();
    expect(await log()).toEqual(["first"]);
  });

  it("commits a dirty repo when enabled and tests passed, and says how to undo", async () => {
    const { run, log, info } = await setup({ autoCommit: true }, true);
    await run();
    expect(await log()).toHaveLength(2);
    const messages = info.mock.calls.map(c => String(c[0]));
    const line = messages.find(m => m.includes("[autoCommit]"));
    expect(line).toContain(repo);
    expect(line).toContain("TokenRing Automatic Checkin");
    expect(line).toContain("reset --soft HEAD~1");
    expect(line).toMatch(/Committed [0-9a-f]{7,}/);
  });

  it("does not commit when tests failed, and reports why", async () => {
    const { run, log, error } = await setup({ autoCommit: true }, false);
    await run();
    expect(await log()).toEqual(["first"]);
    expect(error).toHaveBeenCalledWith("Not committing changes, due to tests not passing");
  });
});
