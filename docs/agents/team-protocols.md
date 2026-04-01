# Team Protocols: Inter-Agent Communication Standards

## Overview

Team Protocols define the communication, synchronization, and coordination rules between team members. They ensure reliable cooperation even when agents operate in parallel across different processes.

## Core Protocols

### 1. Permission Synchronization Protocol

Ensures all teammates respect consistent permission rules set by team lead.

#### Flow: Permission Request

```
Teammate Query:
  1. Tool called: Edit("/forbidden-file.ts")
  2. Check: Local permission rules
  3. Local rules: DENIED
  4. Check: Team rules (team.json)
  5. Team rules: NEUTRAL (not specified)
  6. Action: Send permission request to lead

Message to Lead:
  {
    id: "perm-req-123",
    from: "frontend-agent",
    type: "permission_request",
    tool: "Edit",
    path: "/forbidden-file.ts",
    timestamp: 1712000000000
  }

Lead Processing:
  1. Receives mailbox message
  2. Evaluates: Is this path safe to edit?
  3. Decision: allow | deny | ask_user
  4. Response:
     {
       id: "perm-req-123",
       type: "permission_response",
       decision: "allow",
       reason: "Required for integration"
     }

Teammate Resumes:
  1. Polls mailbox for response
  2. Receives permission_response
  3. Decision: allow → proceed with Edit
  4. Tool execution continues
```

#### Permission Rule Inheritance

```
Lead grants permission:
  teamAllowedPaths: [
    {
      path: "src/**",
      toolName: "Edit",
      addedBy: "lead-agent"
    }
  ]

Teammate inherits:
  "I can edit src/** per team rules"

Teammate checks permission:
  1. Edit("/src/main.ts")
  2. Does "src/main.ts" match "src/**"? YES
  3. Permission: ALLOW (no request needed)

Teammate checks:
  1. Edit("/config/secrets.json")
  2. Does "config/secrets.json" match "src/**"? NO
  3. Permission: ASK LEAD
```

### 2. Task Notification Protocol

All team members receive notifications when tasks change.

#### Flow: Task Status Change

```
Teammate Updates:
  TaskUpdate({
    taskId: "1",
    status: "in_progress",
    owner: "frontend-agent"
  })

System Broadcasts:
  Notification to all teammates:
  {
    type: "task_notification",
    taskId: "1",
    change: {
      status: { old: "pending", new: "in_progress" },
      owner: { old: null, new: "frontend-agent" }
    },
    timestamp: 1712000000000
  }

Teammates Process:
  1. Receive notification
  2. Update local task cache
  3. Check if any of my tasks are now unblocked
  4. If unblocked: Log message "Task 2 now ready to start"
  5. Can immediately claim: TaskUpdate(taskId: 2, in_progress)

Example Cascade:
  Task 1 complete
    → Task 2 unblocked (was blockedBy 1)
    → Task 3 unblocked (was blockedBy 1 and 2)
    → Multiple teammates can now start their work
```

### 3. Session Reconnection Protocol

Allows teammates to recover from disconnection.

#### Flow: Session Recovery

```
Teammate Session Active:
  Agent running in tmux pane
  Session: "session-456"

Connection Lost:
  (Network issue, terminal closed, etc.)

Lead Detection:
  1. Poll team session status
  2. Detect: session-456 no longer active
  3. Mark: teammate "inactive"
  4. Log: "frontend offline at 2024-04-01 15:32"

Reconnection:
  1. User reconnects to tmux pane
  2. System detects: same session resumed
  3. Process: Still running or crashed?
     → If crashed: Restart
     → If running: Resume normal operation
  4. Mark: teammate "active"
  5. Replay: Any missed messages (permission updates, task changes)
```

### 4. Mailbox Message Protocol

Generic message passing system between lead and teammates.

#### Message Structure

```typescript
interface TeamMessage {
  id: string                 // Unique message ID
  from: AgentId             // Sender agent ID
  to: AgentId               // Recipient agent ID
  type: MessageType
  content: unknown          // Message-specific content
  timestamp: number         // Unix ms
  acknowledged?: boolean    // Has recipient processed?
}

type MessageType =
  | "permission_request"    // Teammate: ask lead
  | "permission_response"   // Lead: respond to request
  | "task_notification"     // Any: task changed
  | "status_update"         // Teammate: report progress
  | "error_report"          // Teammate: report failure
  | "instruction"           // Lead: direct teammate
  | "question"              // Teammate: ask for guidance
  | "acknowledgment"        // Any: confirm receipt
```

#### Mailbox Storage

```
~/.claude/teams/my-team/mailbox/

Frontend mailbox:
  [
    {
      id: "msg-1",
      from: "lead",
      type: "task_notification",
      content: { taskId: "2", status: "unblocked" }
    },
    {
      id: "msg-2",
      from: "lead",
      type: "permission_response",
      content: { decision: "allow", reason: "..." }
    }
  ]

Backend mailbox:
  [ ... ]

Lead doesn't have personal mailbox,
instead receives messages via polling.
```

#### Message Lifecycle

```
1. Create
   Message created and written to recipient mailbox

2. Deliver
   Recipient polled and reads mailbox
   → Message loaded into memory
   → Processed according to type

3. Acknowledge
   Recipient marks as processed
   → Removed from mailbox file
   → Frees disk space

4. Archive (optional)
   Processed messages can be archived for history
```

### 5. Execution Synchronization Protocol

Coordinates parallel work and prevents conflicts.

#### Sequential Constraint: Blocked Tasks

```
Task DAG:
  Database Schema → API Implementation → UI Integration

Execution:
  Time 0:
    Frontend: TaskList() → sees Task 3 (blockedBy 2)
    Backend: TaskList() → sees Task 2 (blockedBy 1)
    Database: Claims Task 1 → in_progress

  Time 5 minutes:
    Database: Task 1 complete
    → Notification sent: Task 1 completed
    → Task 2 unblocked

    Backend: Receives notification
    → Updates local TaskList
    → Task 2 no longer blocked
    → Claims Task 2 → in_progress

    Frontend: Task 3 still blocked (waiting for Task 2)

  Time 15 minutes:
    Backend: Task 2 complete
    → Notification sent: Task 2 completed
    → Task 3 unblocked

    Frontend: Receives notification
    → Task 3 now runnable
    → Claims Task 3 → in_progress
```

#### Conflict Prevention: File Locking

```
Scenario: Both teammates try to edit same file

Frontend attempts:
  Edit("/src/api.ts")
  1. Checks: Is file locked?
  2. Locked by: Backend
  3. Action: Ask lead
     "Backend is editing /src/api.ts, should I wait?"
  4. Lead response: "Wait for backend to complete"
  5. Frontend: Waits or works on different file

Backend completes:
  1. Releases lock
  2. Notification: "/src/api.ts now available"

Frontend resumes:
  1. Lock acquired
  2. Edit proceeds
```

## Communication Channels

### 1. Mailbox (Asynchronous)

Used for permissions, task changes, status updates:
- Non-blocking
- Persistent (survives disconnection)
- Polled by teammates
- Good for: decisions, notifications

### 2. WebSocket (Synchronous, optional)

For real-time coordination:
- Instant delivery
- Requires connection
- Used if available
- Fallback to mailbox if unavailable

### 3. Shared Task List (Eventual Consistency)

All agents see same task state (with slight delay):
- File system source of truth
- Locked for consistency
- Written by: TaskUpdateTool
- Read by: TaskListTool

## Protocol Examples

### Example 1: Frontend and Backend Racing

```
Scenario: Frontend and backend both want to edit same API response format

Time 0:
  Frontend: "I'll modify API response to include user profile"
  Backend: "I'll modify API response to add pagination"

Flow:
  1. Frontend attempts: Edit("/src/api.ts")
     → Checks file lock: not locked
     → Acquires lock
     → Edit proceeds

  2. Backend attempts: Edit("/src/api.ts")
     → Checks file lock: locked by Frontend
     → Sends permission request: "Can I edit?"
     → Lead responds: "Wait, frontend is editing"
     → Backend: Works on different file for now

  3. Frontend completes edit, releases lock
     → Notification sent: "File released"

  4. Backend retries: Edit("/src/api.ts")
     → Checks file lock: not locked
     → Acquires lock
     → Edit proceeds
     → But now conflicts with frontend changes!

  5. Backend detects conflict
     → Sends to lead: "Merge conflict in /src/api.ts"
     → Lead: Reviews both changes, decides merge strategy
     → Lead: Instructs both teammates on resolution
```

### Example 2: Permission Boundary Crossing

```
Scenario: Backend wants to edit frontend file (shouldn't normally happen)

Flow:
  1. Backend: "I need to fix UI component"
     → Edit("/src/components/Header.tsx")

  2. System checks:
     → Local rules: Denied (backend can't edit src/components)
     → Team rules: Denied (backend not in path allowlist)

  3. Sends permission request to lead:
     {
       tool: "Edit",
       path: "/src/components/Header.tsx",
       reason: "Need to update API integration with UI"
     }

  4. Lead reviews:
     → Is backend expertise needed? YES (API integration)
     → Grant temporary permission for this file

  5. Response to backend:
     {
       decision: "allow",
       reason: "API integration changes need backend knowledge",
       scope: "/src/components/Header.tsx only"
     }

  6. Backend: Edit proceeds
     → Makes necessary changes
     → Notifies frontend: "Updated Header.tsx for API"

  7. Frontend reviews and approves
     → Integration successful
```

### Example 3: Parallel Work with Dependencies

```
Initial Task Setup:
  Task A: "Database schema" (independent)
  Task B: "Backend API" (blockedBy: A)
  Task C: "Frontend UI" (independent)
  Task D: "Integration tests" (blockedBy: B, C)

Time 0:
  Database: Claims A → in_progress
  Frontend: Claims C → in_progress
  Backend: Task B blocked, waits

Time 5:
  Database: Task A complete → notification
  → Backend: Receives notification
  → Task B unblocked!
  → Backend: Claims B → in_progress

Time 10:
  Frontend: Task C complete
  → Database and Backend both working (not needed)

Time 15:
  Backend: Task B complete
  → Tester: Receives notification
  → Task D unblocked (both A and C done)
  → Tester: Claims D → in_progress

Time 25:
  Tester: Task D complete
  → All work finished!
```

## Protocol Compliance

### Guarantees

✅ **Guaranteed:**
- All teammates see same task state (eventually)
- Permission decisions are consistent
- No concurrent writes to same file
- Messages are delivered in order

❌ **Not guaranteed:**
- Real-time synchronization (async)
- Instant message delivery (relies on polling)
- Perfect conflict prevention (must use locks)

### Trade-offs

**Resilience over Consistency:**
- Teammates can work offline
- Mailbox persists across disconnections
- Catch up when reconnected

**Simplicity over Efficiency:**
- File-based storage (no database)
- Polling (no complex signaling)
- Human-friendly conflict resolution

## Implementation Details

### Lead-Teammate Permission Bridge

```typescript
// leaderPermissionBridge.ts
function syncPermissionsToTeammate(lead, teammate) {
  // 1. Teammate makes tool call
  // 2. Check: Is this permitted?
  // 3. Local rules: apply first
  // 4. No match: Query lead via bridge

  const leadDecision = await askLeadForPermission(tool, input)
  // Bridge queries lead's permission state
  // Returns: allow | deny | ask_user

  return leadDecision
}
```

### Task Update Notification

```typescript
// taskNotification.ts
function notifyTasksUpdated(taskId, changes) {
  // 1. Task file updated
  // 2. System detects: task change
  // 3. Broadcasts to all teammates:
  //    - Message in each mailbox
  //    - Local task cache invalidation
  //    - UI refresh
}
```

### Mailbox Polling

```typescript
// teammateMailbox.ts
async function pollMailbox(agentId) {
  // Every 5 seconds:
  // 1. Check mailbox file for this agent
  // 2. Read new messages
  // 3. Process by type:
  //    - task_notification → update task list
  //    - permission_response → unblock waiting tool
  //    - instruction → execute lead's direction
  // 4. Mark processed messages
  // 5. Remove from mailbox
}
```

## Best Practices

### 1. Clear Responsibility Boundaries

✅ Good:
```json
{
  "frontend-agent": {
    "allowedPaths": ["src/components/**", "src/hooks/**"],
    "cannotEdit": ["src/api/**", "src/db/**"]
  }
}
```

❌ Bad:
```json
{
  "all-agents": {
    "allowedPaths": ["**"],
    "cannotEdit": []
  }
}
// No boundaries = conflicts inevitable
```

### 2. Explicit Task Dependencies

✅ Good:
```
Task 1: "Schema design" (independent)
Task 2: "API impl" (blockedBy: 1)
Task 3: "Tests" (blockedBy: 2)
```

❌ Bad:
```
All tasks independent
// Teammates guess order
// Risk of rework
```

### 3. Regular Synchronization Check-ins

✅ Good:
```
Team lead: Poll team status every iteration
→ Check for stalled teammates
→ Resolve permission disputes
→ Update blockers
```

❌ Bad:
```
Team lead: Set and forget
// Teammates stuck waiting
// Problems accumulate
```

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/swarm/permissionSync.ts` | Permission protocol |
| `src/utils/swarm/teamHelpers.ts` | Team utilities |
| `src/utils/swarm/leaderPermissionBridge.ts` | Lead-teammate bridge |
| `src/utils/swarm/reconnection.ts` | Reconnection logic |
| `src/utils/swarm/taskNotification.ts` | Task notifications |
| `src/utils/teammateMailbox.ts` | Mailbox implementation |

## See Also

- [Agent Teams](./agent-teams.md) - Team structure
- [Tasks](../core/todowrite.md) - Task management
- [Permissions](../../architecture/permissions.md) - Permission system
