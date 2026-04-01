# TodoWrite and V2 Task System

## Overview

Claude Code V2 provides a comprehensive task management system with persistent storage, dependency tracking, and multi-agent support. While the name "TodoWrite" references earlier todo management, the modern implementation is the **V2 Task System** providing a full-featured task database.

## Task System Architecture

```
┌──────────────────────────────────────────┐
│  User/Agent Creates/Updates Task         │
│  (TaskCreate, TaskUpdate, TaskDelete)    │
└──────────────────┬───────────────────────┘
                   ↓
        ┌──────────────────────────┐
        │ V2 Task API (tasks.ts)   │
        │ • Validation             │
        │ • File system locking    │
        │ • ID generation          │
        └──────────────┬───────────┘
                       ↓
        ┌──────────────────────────────────┐
        │ File System Storage              │
        │ ~/.claude/tasks/{sessionId}/     │
        │ ~/.claude/teams/{teamName}/      │
        │                                   │
        │ Structure:                        │
        │ ├── .lock (concurrency control)  │
        │ ├── .highwatermark (next ID)     │
        │ └── {taskId}.json (task data)   │
        └──────────────────────────────────┘
```

## Task Data Model

### Task Object

```typescript
interface Task {
  id: string                          // Unique identifier (auto-incremented)
  subject: string                     // Task title (imperative form)
  description: string                 // Detailed requirements
  activeForm?: string                 // Present continuous form for spinner
  owner?: string                      // Agent ID or agent name
  status: 'pending' | 'in_progress' | 'completed'
  blocks: string[]                    // Task IDs this task blocks
  blockedBy: string[]                 // Task IDs blocking this task
  metadata?: Record<string, unknown>  // Arbitrary custom data
}
```

### Status Workflow

```
    ┌──────────┐
    │ pending  │  Initial state
    └────┬─────┘
         │ agent claims task
         ↓
    ┌──────────────┐
    │ in_progress  │  Agent working
    └────┬─────────┘
         │ agent completes
         ↓
    ┌──────────┐
    │ completed│  Final state (immutable)
    └──────────┘
```

### Task Metadata Examples

Tasks can store arbitrary metadata for specialized workflows:

```typescript
// Example: Planning workflow
{
  id: "1",
  subject: "Implement user authentication",
  metadata: {
    priority: "high",
    estimate_hours: 8,
    skills_required: ["auth", "database"],
    related_issues: ["issue#123", "issue#456"]
  }
}

// Example: Review task
{
  id: "2",
  subject: "Code review of PR#789",
  metadata: {
    pr_url: "https://github.com/.../pull/789",
    reviewer: "agent-xyz",
    approval_required: true
  }
}
```

## Task Dependencies

Tasks can form dependency graphs to express blocking relationships:

```
Task A (blocked by Task B, Task C)
  ↑
  └─ blockedBy: ["B", "C"]

Task B
  ├─ blocks: ["A"]  (B blocks A)

Task C
  ├─ blocks: ["A"]  (C blocks A)

  Both B and C must complete before A can start
```

### Dependency Queries

```typescript
// Get all tasks blocking a task
task.blockedBy  // ["B", "C"]

// Get all tasks this task blocks
task.blocks     // ["A"]

// Check if task can start
isBlocked(taskId) // returns boolean
```

## File System Storage

### Storage Locations

**Session Tasks:**
```
~/.claude/tasks/
├── {sessionId1}/
│   ├── .lock              # Concurrency lock
│   ├── .highwatermark     # Next ID to assign
│   ├── 1.json            # Task 1
│   ├── 2.json            # Task 2
│   └── N.json            # Task N
└── {sessionId2}/
    └── ...
```

**Team Tasks:**
```
~/.claude/teams/{teamName}/
├── team.json              # Team metadata
├── tasks/                 # (Implicit location)
│   ├── .lock
│   ├── .highwatermark
│   └── {taskId}.json
└── ...
```

### Task File Format

Each task is stored as JSON (example: `1.json`):

```json
{
  "id": "1",
  "subject": "Fix authentication bug",
  "description": "JWT tokens expire after 30 minutes. Need to implement refresh token mechanism.",
  "activeForm": "Fixing authentication bug",
  "status": "in_progress",
  "owner": "agent-xyz@my-team",
  "blocks": [],
  "blockedBy": [],
  "metadata": {
    "created_at": 1712000000000,
    "updated_at": 1712001000000,
    "priority": "high"
  }
}
```

### High-Water Mark

The `.highwatermark` file tracks the next task ID to assign:

```
1  # Next task ID is 2
```

This enables simple auto-incrementing IDs without collisions.

## Task Management Tools

### TaskCreateTool

Create a new task:

```typescript
// Input schema
{
  subject: string              // Required
  description: string          // Required
  activeForm?: string         // Optional
  metadata?: object           // Optional custom data
}

// Example
const result = await TaskCreate({
  subject: "Run tests",
  description: "Execute test suite to verify all features",
  activeForm: "Running tests",
  metadata: { test_framework: "jest" }
})

// Returns
{
  id: "1",
  subject: "Run tests",
  // ... full task object
}
```

**Behavior:**
- Auto-assigns unique ID
- Status defaults to `pending`
- Owner unset (can be claimed later)
- Creates task file in task directory

### TaskListTool

List tasks matching criteria:

```typescript
// Input schema (all optional)
{
  // No parameters - lists all tasks
}

// Returns
[
  {
    id: "1",
    subject: "Fix auth bug",
    status: "in_progress",
    owner: "agent-xyz",
    blockedBy: [],
    blocks: []
  },
  {
    id: "2",
    subject: "Write tests",
    status: "pending",
    owner: undefined,
    blockedBy: ["1"],  // Blocked by task 1
    blocks: []
  }
]
```

**Filtering (implicit):**
- UI displays pending/in_progress prominently
- Shows blocked status visually
- Allows owner filtering

### TaskGetTool

Retrieve a single task with full details:

```typescript
// Input schema
{
  taskId: string  // Required
}

// Returns
{
  id: "1",
  subject: "Fix auth bug",
  description: "JWT tokens expire too quickly...",
  activeForm: "Fixing authentication bug",
  status: "in_progress",
  owner: "agent-xyz",
  blocks: [],
  blockedBy: [],
  metadata: { /* custom data */ }
}
```

### TaskUpdateTool

Update task fields:

```typescript
// Input schema (at least one field required)
{
  taskId: string                    // Required
  status?: 'pending' | 'in_progress' | 'completed'
  subject?: string                  // Update title
  description?: string              // Update description
  activeForm?: string               // Update spinner text
  owner?: string                    // Assign to agent
  metadata?: Record<string, unknown> // Merge metadata
  addBlocks?: string[]              // Task IDs to block
  addBlockedBy?: string[]           // Task IDs to be blocked by
}

// Example: Agent claims task
await TaskUpdate({
  taskId: "1",
  status: "in_progress",
  owner: "agent-xyz"
})

// Example: Establish dependency
await TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"]  // Task 2 now depends on task 1
})

// Example: Complete task
await TaskUpdate({
  taskId: "1",
  status: "completed"
})
```

### TaskDeleteTool (Implicit)

While there's no explicit delete tool, tasks can be removed via:
- Setting `status: "deleted"` (soft delete)
- Or removing task files from storage

## Concurrency & Locking

### File System Locking

Multiple agents can access tasks simultaneously. Locking prevents corruption:

```typescript
// Lock acquisition (with retry)
function acquireLock(taskDir: string, maxRetries: number = 10)
  // 1. Check if .lock file exists
  // 2. If exists and age < timeout: wait 100ms, retry
  // 3. If doesn't exist or stale: create .lock file
  // 4. Return locked state

// Lock release
function releaseLock(taskDir: string)
  // 1. Delete .lock file
  // 2. Other waiting agents can now proceed
```

### Concurrency Guarantees

- **Multiple readers**: OK (reading task files)
- **Single writer**: Enforced (via lock)
- **Reader + Writer**: Serialized (writer waits for lock)
- **Timeout**: 5 seconds default (prevents deadlock)

## Integration with Agent Loop

Tasks are accessed through tools during the agent loop:

```
Query Loop Iteration:
  1. Check for available tasks: TaskList
  2. Claim a task: TaskUpdate (status="in_progress", owner=agentId)
  3. Work on task...
  4. Update progress: TaskUpdate (metadata.progress=50%)
  5. Complete task: TaskUpdate (status="completed")
  6. Next iteration: TaskList → fetch next pending task
```

## Integration with Teams

In team environments, tasks are shared:

1. **Team Lead** creates shared task list
   ```typescript
   TaskCreate({
     subject: "Refactor authentication",
     description: "Update auth module for security",
     // Stored in team task directory
   })
   ```

2. **Teammates** claim and work on tasks
   ```typescript
   TaskUpdate({
     taskId: "1",
     owner: "teammate-agent@team-name"  // Full agent ID
   })
   ```

3. **Team Lead** monitors progress
   ```typescript
   TaskList()  // Shows all team tasks with current status
   ```

## Best Practices

### Task Naming

Use imperative form for task subjects:

✅ Good:
- "Fix authentication bug"
- "Add user profile page"
- "Review pull request #123"
- "Write deployment documentation"

❌ Bad:
- "Authentication bug"
- "User profile feature"
- "Pull request review"

### Task Descriptions

Include enough context for an agent to understand what to do:

✅ Good:
```
Fix JWT token expiration issue. Tokens currently expire
after 30 minutes which interrupts user sessions. Need to
implement refresh token mechanism that allows users to
stay logged in for 7 days. See issue #456 for details.
```

❌ Bad:
```
Fix bug
```

### Dependency Management

Create dependencies to express blocking relationships:

✅ Good:
```
Task A: "Create database schema"
Task B: "Write database migrations" (depends on A)
Task C: "Implement API endpoints" (depends on B)
Task D: "Write integration tests" (depends on A, B, C)
```

❌ Bad:
```
All tasks independent, no dependencies tracked
→ Agents might work on tasks out of order
```

### Metadata Usage

Use metadata for structured task properties:

✅ Good:
```
{
  subject: "Implement feature X",
  metadata: {
    priority: "high",
    estimated_hours: 4,
    assignee_skills: ["frontend", "react"],
    dependencies: ["issue#123"]
  }
}
```

❌ Bad:
```
{
  subject: "Implement feature X (high priority, 4 hours, requires frontend skills)"
}
```

## Example Workflows

### Simple Sequential Workflow

```
User creates tasks:
1. "Write API endpoint" (pending)
2. "Write tests" (pending, blocked by 1)
3. "Deploy to staging" (pending, blocked by 2)

Agent 1:
  TaskList() → sees task 1 (not blocked)
  TaskUpdate(1, in_progress, owner=agent-1)
  → Implements endpoint
  TaskUpdate(1, completed)

Agent 2:
  TaskList() → sees task 2 (blocked by 1)
  → Waits for task 1 completion

Agent 1:
  TaskList() → sees task 2 (not blocked now)
  TaskUpdate(2, in_progress, owner=agent-1)
  → Writes tests
  TaskUpdate(2, completed)

Agent 3:
  TaskList() → sees task 3 (not blocked)
  TaskUpdate(3, in_progress, owner=agent-3)
  → Deploys
  TaskUpdate(3, completed)
```

### Parallel Work with Dependencies

```
     Task A (in_progress)
     /                 \
Task B (blocked)    Task C (blocked)
     \                 /
     Task D (blocked by B,C)

Agent-1: works on A
Agent-2: works on C (once C unblocked)
Agent-3: works on B (once B unblocked)
Agent-4: waits for D (blocked by B and C)

Once A completes:
  B and C now unblocked → agents 2,3 start immediately

Once B,C complete:
  D unblocked → agent 4 starts
```

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/tasks.ts` | Core task system implementation |
| `src/tools/TaskListTool/` | List tasks |
| `src/tools/TaskCreateTool/` | Create tasks |
| `src/tools/TaskGetTool/` | Get single task |
| `src/tools/TaskUpdateTool/` | Update tasks |
| `src/utils/swarm/taskNotification.ts` | Task state events |

## See Also

- [Tasks (Advanced)](../tasks/background-tasks.md) - Background task execution
- [Autonomous Agents](../agents/autonomous-agents.md) - Agent teams using tasks
- [Agent Teams](../agents/agent-teams.md) - Team task sharing
- [Subagents](../concepts/subagents.md) - Per-agent task isolation
