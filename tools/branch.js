import ChatService from "@token-ring/chat/ChatService";
import { FileSystemService } from "@token-ring/filesystem";
import { z } from "zod";

export default execute;
export async function execute(args, registry) {
	const chatService = registry.requireFirstServiceByType(ChatService);
	const fileSystem = registry.requireFirstServiceByType(FileSystemService);

	try {
		const action = args.action;
		const branchName = args.branchName;

		switch (action) {
			case "list": {
				// List all branches
				chatService.infoLine("Listing all branches...");
				const { stdout } = await fileSystem.executeCommand([
					"git",
					"branch",
					"-a",
				]);
				chatService.systemLine("Branches:");
				stdout.split("\n").forEach((line) => {
					if (line.trim()) {
						chatService.systemLine(`  ${line}`);
					}
				});
				return "Branch list displayed successfully";
			}
			case "create":
				if (!branchName) {
					chatService.errorLine("Branch name is required for create action");
					return "Create failed: no branch name provided";
				}
				// Create a new branch
				chatService.infoLine(`Creating new branch: ${branchName}...`);
				await fileSystem.executeCommand(["git", "checkout", "-b", branchName]);
				chatService.systemLine(
					`Successfully created and switched to branch: ${branchName}`,
				);
				return `Branch '${branchName}' created and checked out`;

			case "switch":
				if (!branchName) {
					chatService.errorLine("Branch name is required for switch action");
					return "Switch failed: no branch name provided";
				}
				// Switch to existing branch
				chatService.infoLine(`Switching to branch: ${branchName}...`);
				await fileSystem.executeCommand(["git", "checkout", branchName]);
				chatService.systemLine(
					`Successfully switched to branch: ${branchName}`,
				);
				return `Switched to branch '${branchName}'`;

			case "delete":
				if (!branchName) {
					chatService.errorLine("Branch name is required for delete action");
					return "Delete failed: no branch name provided";
				}
				// Delete a branch
				chatService.infoLine(`Deleting branch: ${branchName}...`);
				await fileSystem.executeCommand(["git", "branch", "-d", branchName]);
				chatService.systemLine(`Successfully deleted branch: ${branchName}`);
				return `Branch '${branchName}' deleted`;

			case "current": {
				// Show current branch
				const { stdout: currentBranch } = await fileSystem.executeCommand([
					"git",
					"branch",
					"--show-current",
				]);
				const current = currentBranch.trim();
				chatService.systemLine(`Current branch: ${current}`);
				return `Current branch: ${current}`;
			}
			default: {
				// Default: show current branch and list local branches
				const { stdout: currentBranchDefault } =
					await fileSystem.executeCommand(["git", "branch", "--show-current"]);
				const { stdout: branches } = await fileSystem.executeCommand([
					"git",
					"branch",
				]);

				chatService.systemLine(
					`Current branch: ${currentBranchDefault.trim()}`,
				);
				chatService.systemLine("Local branches:");
				branches.split("\n").forEach((line) => {
					if (line.trim()) {
						chatService.systemLine(`  ${line}`);
					}
				});
				return "Branch information displayed successfully";
			}
		}
	} catch (error) {
		chatService.errorLine(
			`Error with git branch operation: ${error.shortMessage || error.message}`,
		);
		return `Branch operation failed: ${error.shortMessage || error.message}`;
	}
}

export const description =
	"Manages git branches - list, create, switch, or delete branches.";
export const parameters = z.object({
	action: z
		.enum(["list", "create", "switch", "delete", "current"])
		.describe("The branch action to perform"),
	branchName: z
		.string()
		.describe(
			"The name of the branch (required for create, switch, and delete actions)",
		)
		.optional(),
});
