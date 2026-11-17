import { afterEach, describe, expect, it } from "bun:test";
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
import { execute as branch } from "../tools/branch.ts";
import { execute as commit } from "../tools/commit.ts";
import { execute as rollback } from "../tools/rollback.ts";

/** Runs the real git binary: only the terminal service around it is a stand-in. */
async function runReal(command: string, args: string[], { workingDirectory }: { workingDirectory?: string }) {
  const proc = Bun.spawn([command, ...args], { ...(workingDirectory && { cwd: workingDirectory }), stdout: "pipe", stderr: "pipe" });
  const output = (await new Response(proc.stdout).text()) + (await new Response(proc.stderr).text());
  const exitCode = await proc.exited;
  return exitCode === 0 ? { status: "success" as const, output, exitCode: 0 as const } : { status: "badExitCode" as const, output, exitCode };
}

describe("git tools against a real repository", () => {
  let repo = "";
  afterEach(async () => {
    if (repo) await fs.rm(repo, { recursive: true, force: true });
  });

  async function setup() {
    repo = await fs.realpath(await fs.mkdtemp(path.join(tmpdir(), "git-tools-")));
    const git = (...args: string[]) => runReal("git", args, { workingDirectory: repo });
    await git("init", "-q", "-b", "main");
    await fs.writeFile(path.join(repo, "a.txt"), "one\n");
    await git("add", "a.txt");
    await git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "first");

    const app = createTestingApp();
    app.addService(TerminalService, { executeCommand: runReal } as never);
    app.addService(ChatService, { getLastMessage: () => null } as never);
    app.addService(ChatModelRegistry, {} as never);
    const fileSystem = new FileSystemService(app, FileSystemConfigSchema.parse({ allowedPaths: [{ path: repo, permission: "write" }] }));
    app.addService(FileSystemService, fileSystem);
    const agent = createTestingAgent(app);
    return { agent, fileSystem, git };
  }

  it("commits tracked changes and clears the dirty flag", async () => {
    const { agent, fileSystem, git } = await setup();
    await fs.writeFile(path.join(repo, "a.txt"), "two\n");
    fileSystem.setDirty(true, agent);

    const result = await commit({ cwd: repo, message: "change a" }, agent);
    expect(result.result).toContain("successfully committed");
    expect((await git("log", "--format=%s", "-1")).output.trim()).toBe("change a");
    expect(fileSystem.isDirty(agent)).toBe(false);
  });

  it("says there is nothing to commit when only new files changed, and leaves them marked uncommitted", async () => {
    const { agent, fileSystem } = await setup();
    await fs.writeFile(path.join(repo, "new.txt"), "untracked\n");
    fileSystem.setDirty(true, agent);

    const result = await commit({ cwd: repo, message: "nope" }, agent);
    expect(result.result).toContain("Nothing to commit");
    expect(fileSystem.isDirty(agent)).toBe(true);
  });

  it("fails, and keeps the changes marked uncommitted, when git refuses the commit", async () => {
    const { agent, fileSystem } = await setup();
    const hook = path.join(repo, ".git", "hooks", "pre-commit");
    await fs.writeFile(hook, "#!/bin/sh\necho 'lint failed'\nexit 1\n");
    await fs.chmod(hook, 0o755);
    await fs.writeFile(path.join(repo, "a.txt"), "two\n");
    fileSystem.setDirty(true, agent);

    await expect(commit({ cwd: repo, message: "blocked" }, agent)).rejects.toThrow("lint failed");
    expect(fileSystem.isDirty(agent)).toBe(true);
  });

  it("reports a branch git could not switch to", async () => {
    const { agent } = await setup();
    await expect(branch({ cwd: repo, action: "switch", branchName: "does-not-exist" }, agent)).rejects.toThrow("git checkout does-not-exist failed");
  });

  it("refuses to roll back when git status fails, instead of reading it as no changes", async () => {
    const { agent } = await setup();
    const notARepo = await fs.mkdtemp(path.join(tmpdir(), "not-a-repo-"));
    try {
      await expect(rollback({ cwd: notARepo }, agent)).rejects.toThrow("git status --porcelain failed");
    } finally {
      await fs.rm(notARepo, { recursive: true, force: true });
    }
  });
});
