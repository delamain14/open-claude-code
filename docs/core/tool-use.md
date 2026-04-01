# Tool Use System

## Overview

The Tool Use System is the mechanism by which Claude Code exposes capabilities and receives instructions from Claude. Tools are the primary interface through which Claude takes actions in the system - executing commands, reading files, calling APIs, spawning agents, and more.

## Architecture

```
┌────────────────────────────────────────┐
│         Claude API Response             │
│  Contains tool_use blocks               │
└────────────────┬───────────────────────┘
                 ↓
       ┌─────────────────────┐
       │  Parse Tool Calls   │
       │  Extract parameters │
       └────────────┬────────┘
                    ↓
       ┌─────────────────────────────────┐
       │   Permission Check               │
       │ • User auto-approval rules       │
       │ • Classifier evaluation          │
       │ • Interactive prompts            │
       └────────────┬────────────────────┘
                    ↓
       ┌─────────────────────────────────┐
       │  Input Validation (Zod)         │
       │  Verify parameters match schema │
       └────────────┬────────────────────┘
                    ↓
       ┌─────────────────────────────────┐
       │  Tool Execution                 │
       │ • Call tool.call() method       │
       │ • Handle errors                 │
       │ • Capture output                │
       └────────────┬────────────────────┘
                    ↓
       ┌─────────────────────────────────┐
       │  Result Rendering               │
       │ • Format output                 │
       │ • Create tool_result block      │
       │ • Add to message stream         │
       └─────────────────────────────────┘
```

## Tool Interface

Every tool implements the `Tool` interface defined in `src/Tool.ts`:

```typescript
interface Tool {
  // Metadata
  name: string                    // Unique identifier (e.g., "Bash")
  userFacingName(): string       // Display name for users
  description(): string          // Brief description for Claude

  // Schemas
  inputSchema: ZodSchema         // Parameter validation
  outputSchema?: ZodSchema       // Optional output validation

  // Core Methods
  call(input: InputType): Promise<ToolResult>
  checkPermissions(input: InputType, context: PermissionContext)
    : Promise<PermissionResult>

  // Validation
  validateInput(input: unknown): Promise<void>

  // UI Rendering
  renderToolUseMessage(input: InputType): React.ReactNode
  renderToolResultMessage(result: ToolResult): React.ReactNode
  renderToolUseProgressMessage(update: ProgressUpdate): React.ReactNode

  // Metadata
  isConcurrencySafe(): boolean   // Safe to run in parallel?
  isReadOnly(): boolean          // No side effects?
  isDestructive(): boolean       // Irreversible operation?
}
```

## Built-in Tools

Claude Code provides 60+ built-in tools organized by category:

### File & Code Operations

| Tool | Purpose | Location |
|------|---------|----------|
| Bash | Execute shell commands | `/src/tools/BashTool/` |
| Read | Read file contents | `/src/tools/FileReadTool/` |
| Edit | Replace text in files | `/src/tools/FileEditTool/` |
| Write | Write new files | `/src/tools/FileWriteTool/` |
| Glob | Find files by pattern | `/src/tools/GlobTool/` |
| Grep | Search file contents | `/src/tools/GrepTool/` |
| Notebook Edit | Edit Jupyter notebook cells | `/src/tools/NotebookEditTool/` |

### Web & API

| Tool | Purpose |
|------|---------|
| WebFetch | Fetch and parse URLs |
| WebSearch | Search the web |

### Agent & Task Management

| Tool | Purpose |
|------|---------|
| Agent (Task tool) | Spawn subagents |
| Skill | Execute skills (reusable prompts) |
| TaskList | List tasks |
| TaskCreate | Create new tasks |
| TaskGet | Get single task |
| TaskUpdate | Update task status/metadata |

### Team & Collaboration

| Tool | Purpose |
|------|---------|
| TeamCreate | Create agent teams |
| TeamDelete | Delete teams |

### Planning & Execution

| Tool | Purpose |
|------|---------|
| EnterPlanMode | Enter structured planning mode |
| ExitPlanMode | Complete plan and request approval |

### System & State

| Tool | Purpose |
|------|---------|
| KillShell | Terminate background processes |
| TaskOutput | Get output from background tasks |
| Env | Read environment variables |

## Tool Definitions & Schemas

Tools are exposed to Claude via OpenAI-compatible tool definitions. The system dynamically generates these based on tool configurations:

### Tool Definition Structure

```json
{
  "name": "Bash",
  "description": "Execute bash commands with optional timeout",
  "input_schema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "The bash command to execute"
      },
      "timeout": {
        "type": "number",
        "description": "Timeout in milliseconds"
      }
    },
    "required": ["command"]
  }
}
```

### Zod Schema Validation

Tools use Zod for runtime validation:

```typescript
// BashTool example
const inputSchema = z.object({
  command: z.string().describe("The bash command to execute"),
  timeout: z.number().optional().describe("Timeout in milliseconds"),
  description: z.string().describe("What this command does"),
  run_in_background: z.boolean().optional()
})

// Called by: validateInput(input)
// Throws ZodError if invalid
```

## Execution Flow

### 1. Tool Call Parsing

Claude's response contains:
```xml
<tool_use id="abc123" name="Bash" input='{"command":"ls -la"}'>
```

The system extracts:
- Tool name: `"Bash"`
- Parameters: `{command: "ls -la"}`
- Tool use ID: `"abc123"` (for result association)

### 2. Permission Checking

For each tool call, `checkPermissions()` is invoked:

```typescript
const permission = await tool.checkPermissions(input, {
  userId: "claude",
  sessionId: "...",
  toolName: "Bash",
  operation: "execute",
  context: "query_loop"
})

// Returns: { behavior: "allow" | "deny" | "ask" }
```

**Permission Rules:**
- **Auto-allow** - Pre-approved operations (read-only files)
- **Auto-deny** - Blocked operations (destructive without confirmation)
- **Ask** - Interactive prompts for sensitive operations
- **Classify** - ML classifier evaluates safety

### 3. Input Validation

```typescript
try {
  await tool.validateInput(input)
} catch (error) {
  // Return validation error to Claude
  // Claude can retry with corrected input
}
```

### 4. Tool Invocation

```typescript
const result = await tool.call(input)
// Returns: { stdout?: string, stderr?: string, exitCode?: number }
//         or specific format for tool
```

### 5. Result Formatting

The tool's `renderToolResultMessage()` formats output:

```typescript
// Bash tool renders:
{
  type: "tool_result",
  tool_use_id: "abc123",
  content: [{
    type: "text",
    text: "command output..."
  }]
}
```

## Concurrent Tool Execution

When Claude's response contains multiple tool calls, they execute in parallel:

```typescript
const toolCalls = [
  { name: "Read", input: { file_path: "/file1" } },
  { name: "Grep", input: { pattern: "foo", path: "/file2" } },
  { name: "Bash", input: { command: "ls" } }
]

// All three execute simultaneously
const results = await Promise.all(
  toolCalls.map(call => executeTool(call))
)
```

**Benefits:**
- Faster wall-clock execution
- Better utilization of system resources
- Reduced latency vs. sequential execution

**Constraints:**
- Tools must declare `isConcurrencySafe() = true`
- Default is `false` (assume unsafe)
- Bash, Read, Glob, WebFetch are safe
- Edit, Write, FileOperations are unsafe

## Tool Result Integration

Tool results are added back to the message stream as `tool_result` blocks:

```typescript
const updatedMessages = [
  ...previousMessages,
  {
    role: "assistant",
    content: [
      { type: "text", text: "I'll check the file..." },
      { type: "tool_use", name: "Read", input: {...}, id: "abc" }
    ]
  },
  {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: "abc",
        content: [{
          type: "text",
          text: "File contents..."
        }]
      }
    ]
  }
]
```

The loop continues with Claude seeing these results and deciding next steps.

## Special Tool Types

### Agent Tool (Spawn Subagents)

Spawns isolated subagents to handle specialized tasks:

```typescript
// Input
{
  description: "Analyze code for bugs",
  subagent_type: "explorer",      // or "general-purpose"
  prompt: "Find the bug in src/main.ts"
}

// Returns
{
  status: "completed",
  output: "Found bug at line 42..."
}
```

**Key features:**
- Isolated context via AsyncLocalStorage
- Own message history
- Shared prompt cache (cheaper)
- Can spawn further subagents (unlimited nesting)

### Skill Tool (Execute Skills)

Executes reusable skill prompts:

```typescript
// Input
{
  skill: "write-unit-test",
  args: {
    file: "src/api.ts",
    testFramework: "jest"
  }
}

// Internally:
// 1. Load skill .md file
// 2. Parse frontmatter for configuration
// 3. Create subagent with skill prompt
// 4. Inject args via user message
// 5. Execute and return results
```

### Task Tools (Create/List/Update Tasks)

Manage persistent task lists:

```typescript
// TaskCreate
{
  subject: "Fix authentication bug",
  description: "JWT tokens expire too quickly...",
  activeForm: "Fixing auth bug"
}

// TaskList
// Returns all tasks with status, owner, dependencies

// TaskUpdate
{
  taskId: "task-123",
  status: "in_progress",
  owner: "agent-xyz"
}
```

## Permission System

### Permission Rules

Rules are defined in configuration and control tool access:

```typescript
interface PermissionRule {
  toolName: string              // "Bash", "Edit", etc.
  pathPattern?: string          // Glob pattern
  behavior: "allow" | "deny" | "ask" | "classify"
  reason?: string               // Explanation for users
}

// Examples:
{ toolName: "Read", behavior: "allow" }                    // All reads OK
{ toolName: "Edit", pathPattern: "src/**", behavior: "ask" } // Prompt for code edits
{ toolName: "Bash", behavior: "classify" }                 // ML classifier decides
```

### Permission Modes

Global permission mode affects all tool execution:

| Mode | Behavior |
|------|----------|
| `default` | Prompt user for each decision |
| `bypass` | Auto-allow all (dangerous!) |
| `deferToClassifier` | Use ML classifier for decisions |
| `delegatedByTeamLead` | Accept decisions from team lead |

### Interactive Permission Prompts

When `behavior: "ask"`, user is prompted:

```
BashTool wants to execute: "rm -rf /important"

⚠️  This is a destructive operation that cannot be undone.

[Allow Once] [Allow Always] [Deny] [Cancel]
```

## Tool Development & Registration

### Creating Custom Tools

New tools must implement the Tool interface:

```typescript
import { buildTool } from "src/Tool"
import { z } from "zod"

export const MyTool = buildTool({
  name: "MyTool",
  description: "Does something useful",

  inputSchema: z.object({
    param1: z.string().describe("Required parameter"),
    param2: z.number().optional()
  }),

  async call(input) {
    // Execute tool logic
    return { success: true, output: "result" }
  },

  checkPermissions(input, context) {
    // Allow if safe, deny if risky
    return { behavior: "allow" }
  },

  isConcurrencySafe() {
    return true  // Safe to run in parallel
  },

  renderToolUseMessage(input) {
    return <p>Executing with {input.param1}</p>
  },

  renderToolResultMessage(result) {
    return <pre>{JSON.stringify(result)}</pre>
  }
})
```

### Tool Registration

Tools are registered in `src/commands.ts` and exposed to Claude:

```typescript
const tools: Tool[] = [
  BashTool,
  FileReadTool,
  FileEditTool,
  MyTool,  // New custom tool
  // ... more tools
]
```

## Error Handling

Tools can signal errors which Claude receives:

```typescript
// In tool result
{
  type: "tool_result",
  tool_use_id: "abc123",
  is_error: true,
  content: [{
    type: "text",
    text: "Permission denied: /etc/passwd is protected"
  }]
}
```

Claude then:
- Acknowledges the error
- Adjusts strategy
- Retries with different parameters
- Or terminates if unrecoverable

## Performance Optimizations

### 1. Concurrent Execution
As discussed above - multiple tools run in parallel when safe.

### 2. Input Pre-validation
Zod schemas catch invalid parameters before tool execution:
```typescript
// Fast failure before expensive operations
validateInput(input) throws immediately for bad input
```

### 3. Output Streaming
Some tools (Bash) stream output as available:
- Don't wait for full completion
- User sees progress immediately
- Better interactivity

### 4. Caching
- File contents cached (invalidated on edits)
- Glob results cached (invalidated on writes)
- Reduces repeated tool calls

## Key Files

| File | Purpose |
|------|---------|
| `src/Tool.ts` | Tool interface and base implementation |
| `src/tools/BashTool/` | Shell command execution |
| `src/tools/FileReadTool/` | File reading |
| `src/tools/FileEditTool/` | Text replacement in files |
| `src/tools/GrepTool/` | Content searching |
| `src/tools/AgentTool/` | Subagent spawning |
| `src/tools/SkillTool/` | Skill execution |
| `src/tools/TaskListTool/` | Task management |
| `src/hooks/toolPermission/` | Permission checking |

## See Also

- [Agent Loop](./agent-loop.md) - How tools are called in the main loop
- [Subagents](../concepts/subagents.md) - Agent Tool details
- [Skills](../concepts/skills.md) - Skill Tool mechanics
- [Tasks](../tasks/tasks.md) - Task tool ecosystem
- [Permissions](../../architecture/permissions.md) - Permission system details
