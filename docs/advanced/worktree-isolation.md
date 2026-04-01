# Worktree + Task Isolation: Isolated Development Environments

## Overview

Git worktrees provide isolated development environments for each agent session. This allows:

- Parallel work on different branches without interference
- Clean separation of concerns (one feature per worktree)
- Safe experimentation without affecting main workspace
- Per-session git state isolation
- Easy cleanup and restoration

## Architecture

```
Main Git Repository
│
├─ Main Worktree (default)
│  └─ /path/to/project/
│     └─ Files for main branch
│
├─ Session 1 Worktree
│  └─ /tmp/claude-abc123/
│     └─ Files for feature-1 branch
│
├─ Session 2 Worktree
│  └─ /tmp/claude-def456/
│     └─ Files for bugfix-2 branch
│
└─ Session 3 Worktree
   └─ /tmp/claude-ghi789/
      └─ Files for docs branch

Each worktree:
  ✓ Isolated git state
  ✓ Independent branch
  ✓ Separate file system
  ✓ Own git history
  ✓ Automatic cleanup
```

## What is a Git Worktree?

A git worktree is a separate working directory linked to the same repository:

```bash
# List worktrees
git worktree list
/path/to/project      abc1234 [main]
/tmp/claude-abc123    def5678 [feature-x]
/tmp/claude-def456    ghi9012 [bugfix-y]

# Each worktree:
# - Has its own branch checked out
# - Has independent working directory
# - Shares .git object database (efficient)
# - Can be deleted independently
```

## Session Workflow

### Before Entering Worktree

```
Initial state:
├─ User opens Claude Code in /path/to/project
├─ Current branch: main
├─ Agent reads/writes in main directory
└─ Risk: Accidental changes to main branch
```

### Entering Worktree

```typescript
// Agent calls EnterWorktreeTool
const result = await EnterWorktree({
  branchName: "feature/user-auth"
})

// System:
// 1. Check: Is git repo? YES
// 2. Check: Worktree mode enabled? YES
// 3. Create worktree:
//    git worktree add /tmp/claude-{hash} feature/user-auth
// 4. Switch: Agent's working directory → worktree
// 5. Update: Session state with worktree path
// 6. Clear: Any cached system prompts
// 7. Return: Worktree path info

Result:
{
  worktreePath: "/tmp/claude-abc123",
  branch: "feature/user-auth",
  mainRepoRoot: "/path/to/project"
}
```

### Working in Worktree

```
In Worktree:
├─ Agent can edit files freely
├─ Changes only affect this worktree
├─ Git operations work normally:
│  ├─ git add/commit
│  ├─ git log (only this branch)
│  └─ git push (safe, isolated)
├─ Other sessions unaffected
└─ Main repo untouched
```

### Exiting Worktree

```typescript
// Agent calls ExitWorktreeTool
const result = await ExitWorktree()

// System:
// 1. Check: Currently in worktree? YES
// 2. Commit/push: Any changes (if not done)
// 3. Remove: git worktree prune
// 4. Switch: Back to main repo directory
// 5. Update: Session state (clear worktree path)
// 6. Clear: Cached state
// 7. Return: Confirmation

Result:
{
  status: "exited",
  branch: "feature/user-auth",
  commitsCreated: 3,
  changes: "pushed to origin"
}
```

### Cleanup

```
Automatic cleanup:
├─ After worktree removal:
│  └─ Directory /tmp/claude-abc123/ deleted
├─ After session ends:
│  └─ Dangling worktrees pruned
└─ After 7 days:
   └─ Orphaned worktrees removed
```

## Data Model

### Worktree Session State

```typescript
interface WorktreeSession {
  worktreePath: string        // /tmp/claude-abc123
  worktreeBranch: string      // feature/user-auth
  mainRepoRoot: string        // /path/to/project
  createdAt: number           // Unix timestamp
  commitsBefore: number       // Commits in main before worktree
  commitsCreated?: number     // Commits in worktree
}

// Stored in session storage:
appState.worktreeSession = {
  worktreePath: "/tmp/claude-abc123",
  worktreeBranch: "feature/user-auth",
  mainRepoRoot: "/path/to/project"
}
```

### Environment Integration

```bash
# During worktree session:
export CLAUDE_WORKTREE_PATH="/tmp/claude-abc123"
export CLAUDE_MAIN_REPO="/path/to/project"
export CLAUDE_WORKTREE_BRANCH="feature/user-auth"

# All tools respect these:
cd "${CLAUDE_WORKTREE_PATH}" # Work in worktree
```

## Use Cases

### 1. Feature Development Isolation

```
Scenario: Develop new feature without affecting main

User: "Implement user authentication feature"

Agent:
  1. EnterWorktree({branchName: "feature/auth"})
     → Creates worktree, switches to feature branch

  2. Develop feature:
     → Create auth.ts
     → Create auth.test.ts
     → Create migrations
     → All in worktree

  3. Git operations:
     git add .
     git commit -m "Implement authentication"
     git push -u origin feature/auth

  4. ExitWorktree()
     → Cleanup worktree
     → Back to main directory
     → Main branch unchanged

Result:
  - Main branch untouched
  - Feature branch has all commits
  - Ready for pull request
  - Worktree cleaned up
```

### 2. Parallel Experiments

```
User wants multiple agents working on different features:

Team Lead:
  Session 1: EnterWorktree("feature/payments")
  Session 2: EnterWorktree("feature/notifications")
  Session 3: EnterWorktree("feature/analytics")

Each session:
  ✓ Independent worktree
  ✓ Different branch
  ✓ Parallel development
  ✓ No interference

Result:
  - 3 feature branches ready
  - Each merged independently
  - Main branch never touched
```

### 3. Safe Refactoring

```
User: "Refactor database layer"

Agent:
  1. EnterWorktree("refactor/db-layer")
  2. Analysis: Read all database code
  3. Planning: Create refactoring plan
  4. Implementation: Refactor classes
  5. Testing: Run tests (in worktree)
  6. Verification: Commit changes
  7. ExitWorktree()

Safety benefits:
  - Main untouched during refactoring
  - Can test thoroughly in isolation
  - Easy rollback (delete worktree)
  - No impact on other developers
```

### 4. Hotfix on Old Version

```
Scenario: Fix bug in released version

Main repo: at v2.0
Need to fix: bug in v1.5 (still in production)

Worktree workflow:
  1. git tag -l (check available versions)
  2. EnterWorktree({branchName: "v1.5-hotfix"})
     → Worktree created from v1.5 tag
  3. Fix bug: Edit /file.ts
  4. Test: npm run test
  5. Commit: git commit -m "Fix: XYZ bug"
  6. Push: git push
  7. ExitWorktree()

Result:
  - Hotfix on v1.5 branch
  - Main v2.0 untouched
  - Can merge hotfix to main if needed
  - Old version users can update
```

## Technical Details

### Creating a Worktree

```bash
# What Claude Code does internally:
git worktree add [path] [branch]

# Example:
git worktree add /tmp/claude-abc123 feature/user-auth

# Git automatically:
# 1. Creates /tmp/claude-abc123/
# 2. Checks out feature/user-auth branch
# 3. Sets up worktree metadata
# 4. Shares .git/objects with main repo
```

### Removing a Worktree

```bash
# What Claude Code does:
git worktree remove [path]
# OR
git worktree prune

# Cleans up:
# 1. Removes /tmp/claude-abc123/
# 2. Removes worktree metadata
# 3. Doesn't delete branch (can do manually)
```

### Shared Objects vs. Separate State

```
Git Worktree Design:
├─ .git/objects/      SHARED (same for all worktrees)
│  └─ Commits, trees, blobs (efficient reuse)
├─ .git/refs/heads/   SEPARATE (per-worktree)
│  └─ Branch pointers (independent for each)
└─ Working tree/      SEPARATE (per-worktree)
   └─ Actual files (isolated)

Benefit:
  Multiple worktrees don't duplicate commits
  But each has independent branch/working state
```

## Configuration

### Enable Worktree Mode

```bash
# Feature flag
export CLAUDE_WORKTREE_MODE=true

# Or per-session
claude-code --worktree-mode

# Check status
claude-code --check-worktree-support
# Output: Git worktrees supported: YES
#         Current worktree: NO
#         Available worktrees: 3
```

### Worktree Directory

```bash
# Configure worktree base path
export CLAUDE_WORKTREE_BASE="/tmp"  # default
export CLAUDE_WORKTREE_BASE="/var/tmp"  # alternative

# Worktrees created:
/tmp/claude-{hash}/
/tmp/claude-{hash}/  # Different agents get different hashes
```

## Permissions in Worktrees

### Automatic Permission Elevation

Worktree sessions may get elevated permissions:

```typescript
// When in worktree:
const permissions = {
  default: "bypass",  // More permissive
  // OR
  default: "ask"      // Still ask, but scoped to worktree
}

// Reasoning:
// - Changes are isolated to worktree
// - Won't affect main branch
// - Can always rollback (delete worktree)
// - Safer to experiment
```

### Scope-Limited Permissions

Even in worktrees, some operations stay restricted:

```
Always allowed:
  ✓ Edit within worktree
  ✓ Bash commands in worktree
  ✓ Git operations

Always denied (regardless of worktree):
  ✗ Execute sudo/rm -rf
  ✗ Access /etc/ or system files
  ✗ Install packages globally
  ✗ Modify ~/.ssh or ~/.git/config
```

## Task Isolation

### Tasks in Worktrees

Background tasks can run in worktrees:

```typescript
// Main agent in worktree
await Agent({
  description: "Long-running analysis",
  run_in_background: true  // Runs in same worktree
})

// Task operates in:
// - Same isolated branch
// - Same directory
// - Same git state
// - Completes, results available
```

### Worktree + Task Parallelization

```
Team with worktrees:
├─ Session 1: Worktree "feature/1"
│  └─ Spawn task: Long analysis
│     → Task runs in same worktree
│
├─ Session 2: Worktree "feature/2"
│  └─ Spawn task: Test suite
│     → Task runs in same worktree
│
└─ Session 3: Worktree "feature/3"
   └─ Spawn task: Documentation
      → Task runs in same worktree

All parallel, no interference
```

## Best Practices

### 1. Use for Any Non-Trivial Change

✅ Good:
```
User: "Implement new feature"
→ Automatically use worktree
→ Safe development environment

User: "Fix critical bug"
→ Automatically use worktree
→ Isolated from main work
```

❌ Bad:
```
User: "Read this file"
→ No need for worktree
→ Just read main directory
```

### 2. Always Exit Explicitly

✅ Good:
```
Done with feature:
→ ExitWorktree()
→ Explicit cleanup
→ Clear session state
```

❌ Bad:
```
Forget to exit
→ Automatic cleanup (eventual)
→ But resources held temporarily
→ State confusion
```

### 3. Commit Work Before Exiting

✅ Good:
```
In worktree:
→ Make changes
→ git add .
→ git commit -m "..."
→ ExitWorktree()
→ All work preserved
```

❌ Bad:
```
Changes not committed
→ ExitWorktree()
→ Changes lost
→ Uncommitted work discarded
```

### 4. Use Meaningful Branch Names

✅ Good:
```
feature/user-authentication
bugfix/payment-processing
docs/api-reference
refactor/database-layer
```

❌ Bad:
```
work
temp
fix-stuff
test123
```

## Edge Cases

### 1. Nested Worktrees

Not supported (prevented by git):

```
Cannot: EnterWorktree while already in worktree
→ Error: "Already in worktree"
→ Must: ExitWorktree() first
```

### 2. Worktree on Detached HEAD

```
Scenario: Branch deleted on origin, worktree still exists

Solution:
  1. Check git status
  2. Commit/push work if needed
  3. Switch branch (if desired)
  4. ExitWorktree()
  5. Create new worktree
```

### 3. Merge Conflicts in Main

```
Scenario: Feature branch has conflicts with main

Worktree allows:
  1. Resolve conflicts locally
  2. Create pull request
  3. Handle merge in GitHub/Git
  4. Main branch updated
  5. ExitWorktree()
  6. Feature branch can be deleted

No special handling needed
```

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/worktree.ts` | Worktree git operations |
| `src/tools/EnterWorktreeTool/` | Enter worktree |
| `src/tools/ExitWorktreeTool/` | Exit worktree |
| `src/utils/sessionStorage.ts` | Session state (worktree path) |
| `src/utils/worktreeModeEnabled.ts` | Feature gate |
| `src/hooks/useSessionBackgrounding.ts` | Session management |

## See Also

- [Background Tasks](../tasks/background-tasks.md) - Task execution
- [Agent Teams](./agent-teams.md) - Team coordination
- [Autonomous Agents](./autonomous-agents.md) - Auto-spawning
- [Task System](../core/todowrite.md) - Task isolation
