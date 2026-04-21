import branchCreate from "./commands/git/branch/create.ts";
import branchCurrent from "./commands/git/branch/current.ts";
import branchDelete from "./commands/git/branch/delete.ts";
import branchList from "./commands/git/branch/list.ts";
import branchSwitch from "./commands/git/branch/switch.ts";
import commit from "./commands/git/commit.ts";
import rollback from "./commands/git/rollback.ts";

export default [branchCreate, branchCurrent, branchDelete, branchList, branchSwitch, commit, rollback];
