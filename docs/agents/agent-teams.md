# Agent Teams: Multi-Agent Collaboration

## Overview

Agent Teams (Swarms) allow multiple agents to collaborate on a project:

- **Team Lead** (queue master) coordinates work
- **Teammates** (workers) execute tasks in parallel
- **Shared Tasks** visible to all members
- **Synchronized Permissions** managed by team lead
- **Message Mailbox** for inter-agent communication

## Architecture

```
┌──────────────────────────────────────────────────┐
│         Team Lead Agent (Control Session)       │
│                                                  │
│  • Coordinate work                              │
│  • Create tasks                                 │
│  • Manage permissions                           │
│  • Monitor progress                             │
│  • Approve teammate decisions                   │
└────┬─────────────────┬──────────────┬──────────┘
     │                 │              │
     ↓                 ↓              ↓
 ┌────────────┐  ┌────────────┐  ┌────────────┐
 │ Teammate 1 │  │ Teammate 2 │  │ Teammate 3 │
 │ "Frontend" │  │ "Backend"  │  │ "Database" │
 │            │  │            │  │            │
 │ Session A  │  │ Session B  │  │ Session C  │
 └────────────┘  └────────────┘  └────────────┘
     ↓                 ↓              ↓
 Parallel Execution (tmux/iTerm2/in-process)

     ↓ Shared Task List ↓ Shared Permissions ↓
```

## Team Lifecycle

### Creating a Team

```typescript
// TeamCreate tool
{
  name: "my-team",
  description: "Cross-functional feature team"
}

// System:
// 1. Generate unique team name
// 2. Create ~/.claude/teams/my-team/
// 3. Create team.json metadata
// 4. Initialize shared task list
// 5. Return team configuration
```

### Team File Structure

```
~/.claude/teams/my-team/
├── team.json                # Team metadata
├── tasks/                   # Shared task directory
│   ├── .lock
│   ├── .highwatermark
│   └── {taskId}.json
├── permissions/             # Shared permissions
│   └── allowed-paths.json
└── mailbox/                 # Inter-agent messages
    ├── teammate-1.mailbox
    ├── teammate-2.mailbox
    └── teammate-3.mailbox
```

### Team Metadata File

```json
{
  "name": "my-team",
  "description": "Cross-functional feature team",
  "createdAt": 1712000000000,
  "leadAgentId": "agent-xyz",
  "leadSessionId": "session-123",

  "members": [
    {
      "agentId": "frontend-agent@my-team",
      "name": "frontend",
      "agentType": "general-purpose",
      "model": "claude-3-5-sonnet-20241022",
      "color": "blue",
      "joinedAt": 1712000000000,
      "sessionId": "session-456",
      "tmuxPaneId": "window:pane",
      "cwd": "/path/to/project",
      "backendType": "tmux",
      "isActive": true,
      "mode": "bypassPermissions"
    },
    {
      "agentId": "backend-agent@my-team",
      "name": "backend",
      "agentType": "general-purpose",
      "joinedAt": 1712000000001,
      "sessionId": "session-789",
      "tmuxPaneId": "window:pane",
      "backendType": "tmux",
      "isActive": true,
      "mode": "bypassPermissions"
    }
  ],

  "teamAllowedPaths": [
    {
      "path": "src/**",
      "toolName": "Edit",
      "addedBy": "agent-xyz",
      "addedAt": 1712000000000
    }
  ]
}
```

## Adding Teammates

### Teammate Initialization

```typescript
// TeamCreateTool adds teammates:
{
  teamName: "my-team",
  members: [
    {
      name: "frontend",
      agentType: "general-purpose",
      prompt: "You are frontend specialist..."
    },
    {
      name: "backend",
      agentType: "general-purpose",
      prompt: "You are backend specialist..."
    }
  ]
}

// System:
// 1. Update team.json with members
// 2. Create backend sessions (tmux/iTerm2)
// 3. Initialize each teammate's context
// 4. Create mailbox files
// 5. Set permissions mode
```

### Backend Types

Teams support different execution backends:

| Backend | Platform | Pros | Cons |
|---------|----------|------|------|
| `tmux` | Linux/macOS | Persistent, visible | Requires tmux |
| `iTerm2` | macOS | Native integration | macOS only |
| `in-process` | All | No subprocess overhead | Limited isolation |

## Shared Task List

All team members access the same task list:

```typescript
// Team Lead creates task:
TaskCreate({
  subject: "Implement user profile page",
  description: "Frontend component + backend API + database"
})
// Stored: ~/.claude/teams/my-team/tasks/1.json

// Frontend teammate sees:
TaskList() → includes above task

// Frontend claims task:
TaskUpdate({
  taskId: "1",
  status: "in_progress",
  owner: "frontend-agent@my-team"
})

// Backend can see:
TaskList() → shows "1" owned by frontend, status in_progress
```

### Task Dependencies in Teams

Tasks can express team-level dependencies:

```
Frontend Task: "Create profile UI"
  blocks: ["Backend Task 1"]

Backend Task 1: "Implement profile API"
  blockedBy: ["Frontend Task"]
  blocks: ["Backend Task 2"]

Database Task: "Create profile table"
  blocks: ["Backend Task 1"]

Execution:
  Frontend starts immediately
  Database starts immediately (parallel)
  Backend waits for Database (dependency enforced)
  Once Database done, Backend can start
  Frontend doesn't wait (independent UI work)
```

## Permission Synchronization

### Team Lead Permission Management

Team lead defines shared permissions:

```typescript
// Team lead grants paths
{
  teamAllowedPaths: [
    {
      path: "src/**",
      toolName: "Edit",
      addedBy: "agent-xyz",
      reason: "Core feature implementation"
    },
    {
      path: "tests/**",
      toolName: "Write",
      addedBy: "agent-xyz"
    }
  ]
}

// All teammates get these permissions
```

### Permission Inheritance

Teammates inherit and ask permissions from team lead:

```
Teammate: "Can I edit /src/main.ts?"

Flow:
  1. Check local rules: denied (not in allowlist)
  2. Check team rules: allowed (matches src/**)
  3. Proceed with operation

OR:

  1. Check team rules: denied
  2. Ask team lead (via mailbox)
  3. Team lead responds: allow/deny
  4. Proceed or reject
```

### Permission Modes

Each teammate has a mode controlling permission behavior:

| Mode | Behavior |
|------|----------|
| `default` | Ask lead for each decision |
| `bypass` | Auto-allow all operations |
| `deferToClassifier` | ML classifier decides |
| `delegatedByTeamLead` | Lead sends permission batches |

## Inter-Agent Communication

### Mailbox System

Teammates communicate via JSON mailbox files:

```
~/.claude/teams/my-team/mailbox/
├── frontend.mailbox
├── backend.mailbox
└── database.mailbox
```

### Message Format

```json
{
  "id": "msg-12345",
  "from": "lead-agent",
  "to": "frontend-agent",
  "type": "permission_request",
  "content": {
    "tool": "Edit",
    "path": "/src/new-feature.ts",
    "action": "allow" | "deny"
  },
  "timestamp": 1712000000000
}
```

### Message Types

| Type | Sender | Purpose |
|------|--------|---------|
| `task_notification` | Lead/Teammate | Task status changed |
| `permission_request` | Teammate | Ask lead for permission |
| `permission_response` | Lead | Grant/deny permission |
| `status_update` | Teammate | Report progress |
| `error_report` | Teammate | Report failure |
| `question` | Teammate | Ask lead for guidance |

## Monitoring & Control

### Team Lead Dashboard

Team lead can monitor all teammates:

```typescript
// Get status of all team members
const status = {
  "frontend": {
    sessionId: "session-456",
    status: "active",
    lastMessage: "Implementing header component",
    currentTask: "1",
    tokensUsed: 45000
  },
  "backend": {
    sessionId: "session-789",
    status: "idle",
    currentTask: "none",
    tokensUsed: 2000
  }
}
```

### Task Reassignment

Team lead can reassign tasks:

```typescript
// Reassign from one teammate to another
TaskUpdate({
  taskId: "1",
  owner: "backend-agent@my-team"
})

// Notified via mailbox message
// Teammate acknowledges or rejects
```

### Teammate Removal

```typescript
// Remove teammate from team
TeamDeleteMember({
  teamName: "my-team",
  agentId: "frontend-agent@my-team"
})

// System:
// 1. Update team.json
// 2. Kill backend session
// 3. Archive tasks/messages
// 4. Clean up resources
```

## Real-World Workflow

### Sprint Example: Multi-Feature Development

```
Team Lead:
  1. Create team with 3 teammates (frontend, backend, db)
  2. Create 3 tasks (one per specialist):
     - Task 1: Frontend UI
     - Task 2: Backend API
     - Task 3: Database schema

Frontend Teammate:
  TaskList() → sees 3 tasks
  TaskUpdate(Task 1, in_progress)
  → Develops React component
  → Commits code
  → TaskUpdate(Task 1, completed)

Backend Teammate:
  TaskList() → sees Task 2 is not blocked (can start)
  TaskUpdate(Task 2, in_progress)
  → Waits for database (Task 3 blocker)
  → Asks lead: "Database table ready?"
  → Lead: "Almost done, 10 mins"
  → Works on API scaffolding

Database Teammate:
  TaskList() → sees Task 3
  TaskUpdate(Task 3, in_progress)
  → Creates database schema
  → Runs migrations
  → TaskUpdate(Task 3, completed)

Backend Teammate (resumed):
  → Database now complete
  → Integrates with database
  → Implements full API
  → Tests with frontend
  → TaskUpdate(Task 2, completed)

Team Lead:
  TaskList() → All 3 tasks completed
  → Verify integration
  → Prepare release
```

## Best Practices

### 1. Clear Role Definition

✅ Good:
```
Frontend Team:
  - React component implementation
  - CSS styling
  - Client-side validation

Backend Team:
  - REST API endpoints
  - Database queries
  - Authentication logic

Database Team:
  - Schema design
  - Migration management
  - Performance optimization
```

❌ Bad:
```
Team 1: "Do everything"
Team 2: "Do everything"
→ Undefined responsibilities, conflicts
```

### 2. Dependency Declaration

✅ Good:
```
Task 1: "Design database schema"
Task 2: "Implement API" (blockedBy: 1)
Task 3: "Build UI" (independent)

→ Clear dependencies prevent bottlenecks
```

❌ Bad:
```
Task 1, 2, 3: No dependencies
→ Teammates guess order
→ Possible rework
```

### 3. Permission Boundaries

✅ Good:
```
Frontend can edit: src/components/**, tests/ui/**
Backend can edit: src/api/**, src/db/**, tests/backend/**
Database can edit: migrations/**, src/db/schema/**
```

❌ Bad:
```
All teammates: bypassPermissions mode
→ Accidental edits to wrong code
→ Conflicts
```

### 4. Regular Check-ins

✅ Good:
```
Team lead: Periodically check TaskList
→ Update blockers: "Task 1 complete, Task 2 unblocked"
→ Redirect teammates as needed
→ Resolve permission disputes
```

❌ Bad:
```
Team lead: Hands off after setup
→ Teammates stuck waiting
→ Unresolved conflicts
→ Wasted time
```

## Key Files

| File | Purpose |
|------|---------|
| `src/tools/TeamCreateTool/` | Create/manage teams |
| `src/tools/TeamDeleteTool/` | Delete teams |
| `src/utils/swarm/teamHelpers.ts` | Team utilities |
| `src/utils/swarm/permissionSync.ts` | Permission synchronization |
| `src/utils/swarm/leaderPermissionBridge.ts` | Lead permission bridge |
| `src/utils/swarm/reconnection.ts` | Session recovery |
| `src/utils/swarm/inProcessRunner.ts` | In-process execution |
| `src/utils/swarm/teammateInit.ts` | Teammate initialization |
| `src/utils/swarm/teammateMailbox.ts` | Message queue system |

## See Also

- [Team Protocols](./team-protocols.md) - Communication between agents
- [Agent Loop](../core/agent-loop.md) - Individual agent execution
- [Tasks](../core/todowrite.md) - Shared task management
- [Background Tasks](../tasks/background-tasks.md) - Async teammate execution
