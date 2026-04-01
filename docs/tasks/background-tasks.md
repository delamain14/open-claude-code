# Background Tasks: Asynchronous Operation Execution

## Overview

Background Tasks allow long-running operations to execute without blocking the main agent. Users can:

- Spawn a task with Ctrl+B
- Continue working in a new session
- Monitor task progress
- Retrieve results when ready

## Architecture

```
Main Session (Foreground)
    ↓
[User spawns task: Ctrl+B]
    ↓
┌─────────────────────────────┐
│ Create Background Task      │
│ - Generate taskId           │
│ - Initialize state          │
│ - Set initial status        │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Save Task State                 │
│ ~/.claude/tasks/{sessionId}/    │
│ {taskId}.state.json             │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Spawn Background Process                │
│ • Detached session                      │
│ • Separate terminal (tmux/iTerm2)       │
│ • Redirected I/O (output file)          │
└────────┬────────────────────────────────┘
         ↓
Main Session Continues
(User can create new session or work elsewhere)
         ↓
┌─────────────────────────────────┐
│ Background Task Execution       │
│ • Run bash command              │
│ • Or spawn subagent             │
│ • Stream output to file         │
│ • Update state: pending→running │
└────────┬───────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Task Completion/Failure                 │
│ • Finalize output file                  │
│ • Update status: completed/failed       │
│ • Set endTime                           │
│ • Store results                         │
└─────────────────────────────────────────┘
         ↓
User can later:
  • TaskOutput to retrieve results
  • Kill task if still running
  • Check status in task list
```

## Task Types

Background tasks support several execution types:

```typescript
type TaskType =
  | "local_bash"              // Execute bash command
  | "local_agent"             // Spawn local subagent
  | "remote_agent"            // SSH to remote, spawn agent
  | "in_process_teammate"     // Team member in same process
  | "local_workflow"          // Execute workflow script
  | "monitor_mcp"             // Monitor MCP server
  | "dream"                   // Dream mode (special)
```

## Task State Model

```typescript
interface TaskState {
  id: string                  // b{8chars} format
  type: TaskType
  status: TaskStatus          // pending|running|completed|failed|killed
  description: string         // Human readable

  toolUseId?: string          // Tool call that created it
  startTime: number           // Unix timestamp (ms)
  endTime?: number            // Unix timestamp (ms)
  totalPausedMs?: number      // Pause duration

  // Output handling
  outputFile: string          // Path to output file
  outputOffset: number        // Current read position

  // Notification
  notified: boolean           // User been notified?
}

type TaskStatus =
  | "pending"                 // Created, not started
  | "running"                 // Active execution
  | "completed"               // Success
  | "failed"                  // Error
  | "killed"                  // User killed
```

## Background Bash Tasks

### Creating a Bash Task

```bash
# User presses Ctrl+B during agenent execution
# System prompts for command to run in background

Enter command: npm run tests
```

### Bash Task Execution

```typescript
interface BashTaskState extends TaskState {
  type: "local_bash"
  command: string
  cwd: string
  env?: Record<string, string>
}

// Execution:
const child = spawn("bash", ["-c", command], {
  detached: true,  // Detach from parent process
  stdio: ["ignore", outputFile, outputFile],  // Redirect to file
  cwd: cwd
})

// Child process continues even if parent exits
process.kill(-child.pid)  // Kill group if needed later
```

### Example: Test Execution

```
User is working on code
Ctrl+B pressed → spawn background task

Command: npm run test
Output file: ~/.claude/tasks/{sessionId}/b12345678.out

Main session:
  ↓ Continue working in new session

Background process:
  → npm run test
  → Streaming output to file
  → Status: running

After 30 seconds:
  → Tests complete
  → Status: completed
  → Output available via TaskOutput
```

## Background Agent Tasks

### Creating an Agent Task

```typescript
// Agent tool can spawn background subagent:
{
  run_in_background: true,
  description: "Long-running analysis task",
  subagent_type: "explorer"
}

// System:
// 1. Creates BashTaskState
// 2. Spawns subprocess
// 3. Subprocess runs agent loop
// 4. Output streamed to file
// 5. Returns immediately with taskId
```

### In-Process Teammate Tasks

For Agent Teams, teammates run as background tasks:

```typescript
interface InProcessTeammateTask extends TaskState {
  type: "in_process_teammate"
  agentId: string             // Team member ID
  sessionId: string           // Team member session

  // Process management
  subprocess?: ChildProcess
}

// Execution:
// 1. Create subprocess running teammate
// 2. Communicate via pipes/sockets
// 3. Maintain message queue (mailbox)
// 4. Stream output
// 5. Track status
```

## Output Streaming

### Output File Format

Background tasks write to files with specific format:

```
~/.claude/tasks/{sessionId}/
├── b12345678.out            # Raw output
├── b12345678.state.json     # State metadata
└── ...
```

### Reading Output

```typescript
// Get task output
const result = await TaskOutput({
  taskId: "b12345678",
  block: true,               // Wait for completion?
  timeout: 30000            // Max wait (ms)
})

// Returns:
{
  status: "completed",
  output: "command output...",
  exitCode: 0
}
```

### Streaming vs. Polling

User can monitor in real-time or get results later:

```bash
# Real-time monitoring
# Terminal watches output file and updates UI

# Later retrieval
> TaskOutput b12345678
# Fetches stored output
```

## Task Lifecycle

### State Transitions

```
pending → running → completed
      ↘    ↗
       failed
      ↙ ↗
      killed (terminal state)
```

### Creating a Task

```typescript
function createTask(config: TaskConfig): TaskState {
  const id = generateTaskId()  // "b" + 8 random chars

  return {
    id,
    type: config.type,
    status: "pending",
    description: config.description,
    outputFile: `${tasksDir}/${id}.out`,
    outputOffset: 0,
    startTime: Date.now(),
    notified: false
  }
}
```

### Starting Execution

```typescript
async function startTask(task: TaskState) {
  // Update state
  task.status = "running"
  task.startTime = Date.now()

  // Spawn child process
  const subprocess = spawn(...)

  // Stream output
  subprocess.stdout.pipe(fs.createWriteStream(task.outputFile))

  // Monitor completion
  subprocess.on("close", (code) => {
    task.status = code === 0 ? "completed" : "failed"
    task.endTime = Date.now()
    notifyUser(task)
  })
}
```

### Tracking Tasks

Active tasks stored in AppState:

```typescript
interface AppState {
  tasks: {
    [taskId: string]: TaskState
  }
}

// UI displays task list:
"Background Tasks:
  [●] b12345678  npm run tests      (running, 2m30s elapsed)
  [✓] b87654321  npm run build      (completed, 1m12s)
  [●] b11111111  agent research     (running, 45s elapsed)"
```

## Killing Tasks

Users can terminate running tasks:

```typescript
// KillShell tool
{
  shell_id: "b12345678"
}

// Internally:
process.kill(-taskProcess.pid)  // Kill process group
task.status = "killed"
task.endTime = Date.now()
```

## Background Housekeeping

System periodically cleans up tasks:

```typescript
function backgroundHousekeeping() {
  // 1. Scan AppState for terminal tasks
  // 2. For each completed/failed task:
  //    - Finalize output file
  //    - Keep metadata (for history)
  //    - Remove from active task list
  // 3. Clean old completed tasks (> 24 hours)
}

// Run frequency: every 30 seconds
// Non-blocking (doesn't interrupt main agent)
```

## Long-Running Operations

### Problem: Stuck Agents

Without backgrounding, long operations block user:

```
❌ Bad:
User: "Run full test suite"
Agent starts: pytest (30 minutes)
User stuck waiting for 30 minutes
No feedback or ability to stop
```

### Solution: Background Execution

```
✅ Good:
User: "Run full test suite"
Agent: "I'll run tests in background"
[spawns: pytest in subprocess]
Returns immediately with taskId: b12345678

User: Continues in new session
  - Can work on other tasks
  - Check progress: TaskOutput
  - Can kill if needed: KillShell
```

## Integration with Agent Loop

```
Query Loop Iteration:
  ...
  Tool: Agent (run_in_background=true)
  → System creates task
  → Spawns subprocess
  → Returns taskId immediately
  → Loop continues

User can:
  → Check task list: TaskList
  → Monitor output: TaskOutput(taskId)
  → Kill task: KillShell(taskId)
  → Use new session for new work
```

## Worktree Integration

Background tasks support worktree isolation:

```
Background Task:
  - Spawned in git worktree
  - Isolated from main branch
  - Clean state
  - Can merge back later
```

## Best Practices

### 1. Use for Long Operations

✅ Good:
```bash
# Long running
npm run tests
npm run build
npm run deploy
agent research (30+ minutes)
```

❌ Bad:
```bash
# Quick operations should run inline
cat file.txt
ls directory
echo message
```

### 2. Monitor Important Tasks

```bash
# Check critical task status
TaskOutput b12345678

# Monitor in real-time
# (UI shows live progress)
```

### 3. Clean Up When Done

```bash
# After work complete, cleanup old tasks
# (Automatic: > 24 hours old)
```

## Use Cases

### 1. Test Execution

```
User: "Run full test suite"
→ Background task spawned
→ Tests run for 20 minutes
→ User continues coding
→ Results available via TaskOutput
```

### 2. Long Analysis

```
Agent: "Analyze 1000 files for pattern"
→ Run as background subagent
→ Stream results as available
→ User can review incrementally
```

### 3. Deployment

```
User: "Deploy to production"
→ Background bash task
→ Build → test → deploy
→ Monitor with TaskOutput
→ User stays responsive
```

### 4. Team Member Tasks

```
Team Lead: Spawn 3 teammates
→ Each runs as background process
→ Tasks execute in parallel
→ Results merged by team lead
```

## Key Files

| File | Purpose |
|------|---------|
| `src/Task.ts` | Task type definitions |
| `src/utils/task/framework.ts` | Task execution framework |
| `src/utils/backgroundHousekeeping.ts` | Cleanup/monitoring |
| `src/hooks/useSessionBackgrounding.ts` | Session backgrounding |
| `src/tools/TaskOutputTool/` | Get task output |
| `src/tools/KillShellTool/` | Terminate tasks |

## See Also

- [Tasks (V2 System)](../core/todowrite.md) - Task management
- [Agent Teams](./agent-teams.md) - Background teammate execution
- [Worktrees](./worktree-isolation.md) - Isolated execution environment
