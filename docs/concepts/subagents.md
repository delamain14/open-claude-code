# Subagents: Creating Isolated Agents

## Overview

Subagents are isolated agents spawned by a parent agent to delegate specialized tasks. Unlike the main agent, subagents:

- Run in the same process (fast, low overhead)
- Have isolated context via `AsyncLocalStorage`
- Execute their own complete agent loop
- Share prompt cache with parent (cheaper tokens)
- Can be resumed via `SendMessage`
- Can spawn further subagents (unbounded nesting)

## Architecture

```
┌─────────────────────────────────────┐
│     Parent Agent (Main Loop)        │
│                                     │
│  1. User: "Analyze this bug"       │
│  2. API: spawn research subagent   │
│  3. Tool Call: Agent(type=explore) │
└────────────┬────────────────────────┘
             │ Create subagent context
             ↓
┌─────────────────────────────────────┐
│  Subagent #1 (Isolated Context)     │
│                                     │
│  - Unique agentId                   │
│  - Own message history              │
│  - Own token budget (from parent)   │
│  - Same prompt cache (shared)       │
│  - Can spawn subagent #2            │
│                                     │
│  1. Analyzes code structure         │
│  2. Calls Grep, Read tools          │
│  3. Returns findings                │
└────────────┬────────────────────────┘
             │ Complete, return results
             ↓
┌─────────────────────────────────────┐
│     Parent Agent (Resumed)          │
│                                     │
│  4. Receive task notification       │
│  5. Synthesize findings             │
│  6. Generate response               │
└─────────────────────────────────────┘
```

## Subagent Contexts

### AsyncLocalStorage Isolation

Subagents use `AsyncLocalStorage` to maintain isolated context without shared state:

```typescript
// Parent agent context
{
  agentId: "parent-uuid",
  parentSessionId: undefined,
  agentType: "main",
  subagentName: undefined
}

// Subagent context (automatically set)
{
  agentId: "sub-uuid-1",
  parentSessionId: "parent-uuid",
  agentType: "subagent",
  subagentName: "explorer",
  invokingRequestId: "tool-use-id-123",
  invocationKind: "spawn"
}

// Nested subagent context
{
  agentId: "sub-uuid-2",
  parentSessionId: "sub-uuid-1",  // Parent is itself a subagent!
  agentType: "subagent",
  subagentName: "general-purpose",
  invocationKind: "spawn"
}
```

### Context Isolation Benefits

- **No shared state**: Each agent has its own message buffer, file caches
- **Concurrent safety**: Multiple agents run without interference
- **Clean separation**: No cross-contamination of context
- **Automatic cleanup**: Context destroyed when agent exits

## Spawning Subagents

### Agent Tool (Main Mechanism)

The `Agent` tool spawns subagents:

```typescript
// Input schema
{
  description: string              // What to do
  subagent_type?: string          // 'general-purpose', 'explorer', etc.
  prompt?: string                 // Custom system prompt
  max_turns?: number              // Iteration limit
}

// Example
await Agent({
  description: "Find all database query optimization opportunities",
  subagent_type: "explorer",
  prompt: "You are a performance optimization specialist..."
})
```

### Built-in Subagent Types

Claude Code provides 5 specialized subagent types:

| Type | Purpose | Use Case |
|------|---------|----------|
| `general-purpose` | Generic task assistant | Refactoring, writing code, analysis |
| `explorer` | Code research specialist | Find files, understand structure |
| `verifier` | Testing & validation | Run tests, verify implementations |
| `plan-agent` | Planning specialist | Create detailed plans |
| `claude-code-guide` | Documentation reference | Answer Claude Code questions |

### Custom Subagent Types

Projects can define custom subagent types:

```typescript
// ~/.claude/agents/my-analyzer.md
---
name: "my-analyzer"
description: "Analyzes code for specific patterns"
type: "subagent"
---

You are a code pattern analyzer. Your job is to:
1. Find all occurrences of a pattern
2. Analyze their context
3. Report findings
```

Then spawn:
```typescript
await Agent({
  description: "Find all singleton patterns",
  subagent_type: "my-analyzer"
})
```

## Subagent Lifecycle

### 1. Creation

```typescript
// Parent calls Agent tool
const result = await Agent({
  description: "Do something",
  subagent_type: "explorer"
})

// Internally:
// 1. Generate UUID: "sub-abc123"
// 2. Create agentContext (AsyncLocalStorage)
// 3. Clone FileStateCache (isolated file state)
// 4. Prepare CacheSafeParams (shared safe data)
```

### 2. Initialization

```typescript
// Subagent starts its own query loop
const subagentConfig = {
  systemPrompt: parentPrompt,           // Inherit parent's prompt
  messages: [
    userMessage(description),           // Task description
    ...parentSidechain.messages        // Parent's conversation so far
  ],
  budget: parentBudget * 0.8,          // Get portion of parent's budget
  ...
}

// Start query loop for subagent
await query(subagentConfig)
```

### 3. Execution

Subagent runs its own complete agent loop:
- Builds own system prompt
- Makes API calls (with parent's prompt cache)
- Executes tools in own context
- Manages own token budget
- Accumulates own message history

```
Subagent Query Loop:
  Iteration 1: API call → tool calls (Read, Grep)
  Iteration 2: Tool results → synthesis → API call
  Iteration 3: Final analysis → stop
```

### 4. Completion

```typescript
// When subagent stops (end_turn or budget exhausted):
const result = {
  status: "completed" | "failed",
  output: "findings or error",
  sidechain: {
    messages: [...],        // Full conversation history
    tokenUsage: {...}       // Token stats
  }
}

// Parent receives: <task-notification>
// Parent can:
// - Synthesize findings
// - Spawn more subagents
// - Continue main loop
```

### 5. Optional Resumption

A completed subagent can be resumed:

```typescript
// Parent can send follow-up message
await SendMessage({
  agentId: subagentId,
  message: "Can you investigate X further?"
})

// Subagent resumes execution:
// - Retains message history
// - Continues from last point
// - Uses remaining budget
// - Can spawn more agents
```

## Prompt Caching (Optimization)

Subagents share the parent's prompt cache to reduce token costs:

```
Parent Agent:
  1. First API call: sends full system prompt
     → Creates cache entry
     → Returns cache_creation_input_tokens (expensive)

Subagent:
  1. First API call: sends same system prompt
     → Claude recognizes: "I've seen this before"
     → Uses cache instead
     → Returns cache_read_input_tokens (90% cheaper!)

Multiple subagents:
  All share same cache → exponential savings on large trees
```

**Token savings example:**
```
Without caching:
  Parent: 2000 tokens (prompt) × 1 = 2000
  Sub-1:  2000 tokens (prompt) × 1 = 2000
  Sub-2:  2000 tokens (prompt) × 1 = 2000
  Total: 6000 tokens

With caching:
  Parent: 2000 tokens (prompt creation)
  Sub-1:  200 tokens (cache read)
  Sub-2:  200 tokens (cache read)
  Total: 2400 tokens (60% savings!)
```

## File State Isolation

Each subagent gets a cloned file state cache:

```typescript
// Parent's file cache
{
  "/src/main.ts": "file contents",
  "/src/utils.ts": "cached"
}

// When spawning subagent:
// Clone to isolated copy
subagentFileCache = {
  "/src/main.ts": "file contents",  // Same data
  "/src/utils.ts": "cached"          // Same data
}

// Operations:
// Parent edits: /src/main.ts
// Subagent still sees old version (until refreshed)
// This is often desired to avoid inconsistent state
```

## Message History Sidechain

Each subagent maintains its own message sidechain:

```typescript
// Parent's conversation
[
  user: "Analyze this bug",
  assistant: "I'll spawn a research agent...",
  tool_use: Agent(...)
]

// Subagent's sidechain
[
  user: "Find all database query optimization opportunities",
  assistant: "Searching for N+1 problems...",
  tool_use: Grep(...),
  tool_result: "Found 5 locations...",
  assistant: "Analyzing patterns...",
  tool_use: Read(...),
  // ... many more messages
]

// Subagent result returned to parent as single tool result:
{
  type: "tool_result",
  tool_use_id: "...",
  content: "Completed analysis with findings: ..."
}
```

## Nested Subagents (Unbounded Depth)

Subagents can spawn other subagents:

```
Level 0 (Main Agent)
  └─ Level 1 (Subagent #1: "explorer")
      ├─ Level 2 (Subagent #1.1: "general-purpose")
      │   └─ Level 3 (Subagent #1.1.1: "verifier")
      │       └─ Level 4 (Subagent #1.1.1.1: custom)
      │           └─ ... (unlimited nesting)
      └─ Level 2 (Subagent #1.2: "general-purpose")
```

**Constraints:**
- Shared parent budget is divided
- Deeper nesting = less budget per agent
- No hard limit on depth
- Practical limit: ~5-7 levels (budget exhaustion)

**Example cascade:**
```
Main Agent (100k tokens):
  1. Spawns researcher (50k)
     └─ Spawns analyzer (25k)
        └─ Spawns verifier (12.5k)
           └─ Uses remaining budget for testing
```

## Communication Between Agents

### Subagent to Parent (Returns)

Subagent results returned as tool result:

```typescript
// Tool result contains entire subagent output
{
  type: "tool_result",
  tool_use_id: "agent-call-id",
  content: [{
    type: "text",
    text: "Subagent findings: ... (detailed results)"
  }]
}

// Parent sees this in next loop iteration
// Can synthesize findings or spawn more agents
```

### Resuming Subagents (Message Sending)

Send follow-up messages to subagents:

```typescript
// Parent continues subagent conversation
await SendMessage({
  agentId: "sub-abc123",
  message: "Based on your findings, please investigate X"
})

// Subagent resumes:
// - Receives new message
// - Adds to its message history
// - Continues its agent loop
// - Returns new findings
```

### Parent to Subagent (Task Description)

Initial direction via task description:

```typescript
await Agent({
  description: "Find all Python files that import tensorflow",
  subagent_type: "explorer"
})

// Subagent receives as user message in its loop
```

## Use Cases

### 1. Parallel Research

```typescript
// Task: Refactor authentication module
await Promise.all([
  Agent({
    description: "Research current auth patterns in codebase",
    subagent_type: "explorer"
  }),
  Agent({
    description: "Research industry best practices for JWT",
    subagent_type: "claude-code-guide"
  }),
  Agent({
    description: "Find similar refactoring PRs in history",
    subagent_type: "explorer"
  })
])

// All run in parallel, results synthesized
```

### 2. Divide & Conquer Implementation

```typescript
// Task: Implement complex feature in 3 components
const results = await Promise.all([
  Agent({
    description: "Implement API layer (REST endpoints)",
    subagent_type: "general-purpose"
  }),
  Agent({
    description: "Implement database layer (migrations)",
    subagent_type: "general-purpose"
  }),
  Agent({
    description: "Implement UI layer (React components)",
    subagent_type: "general-purpose"
  })
])

// Combine: components[0] + components[1] + components[2]
```

### 3. Verification & Testing

```typescript
// Main agent writes code
// Then verify it:
const code = await Agent({
  description: "Write the sort function"
})

// Spawn verifier
const tests = await Agent({
  description: "Write comprehensive tests for the sort function",
  subagent_type: "verifier"
})

// Verify tests pass
const result = await Agent({
  description: "Run the tests and report results",
  subagent_type: "verifier"
})
```

### 4. Specialized Analysis

```typescript
// Create custom subagent for domain-specific task
await Agent({
  description: "Analyze SQL queries for N+1 problems",
  subagent_type: "performance-analyzer",
  prompt: `You are a database performance specialist.
           Look for N+1 queries, missing indices, etc.`
})
```

## Best Practices

### When to Use Subagents

✅ **Good use cases:**
- Parallel independent tasks
- Specialized subtasks (explore, verify)
- Long-running research
- Isolating risky operations
- Divide-and-conquer approaches

❌ **Bad use cases:**
- Single sequential task (overhead not worth it)
- Simple one-off tools
- Tight loops (spawning agents in a loop)

### Budget Management

Always be aware of budget constraints:

```typescript
// ❌ Bad: Multiple deep trees waste budget
for (let i = 0; i < 100; i++) {
  Agent({ description: "Analyze file..." })  // 100 agents!
}

// ✅ Good: Batch and use careful spawning
const results = await Promise.all([
  Agent({ description: "Analyze files 1-10" }),
  Agent({ description: "Analyze files 11-20" }),
  Agent({ description: "Analyze files 21-30" })
])
```

### Naming & Description

Make subagent purposes clear:

✅ Good:
```typescript
Agent({
  description: "Find all TypeScript files that import React hooks"
})
```

❌ Bad:
```typescript
Agent({
  description: "Look at stuff"
})
```

## Key Files

| File | Purpose |
|------|---------|
| `src/tools/AgentTool/` | Agent tool implementation |
| `src/tools/AgentTool/runAgent.ts` | Spawn new subagent |
| `src/tools/AgentTool/resumeAgent.ts` | Resume existing subagent |
| `src/utils/agentContext.ts` | AsyncLocalStorage setup |
| `src/utils/forkedAgent.ts` | Subagent parameter handling |
| `src/tools/SendMessageTool/` | Resume subagent communication |

## See Also

- [Agent Loop](../core/agent-loop.md) - Main execution loop
- [Skills](./skills.md) - Reusable skill execution
- [Agent Teams](../agents/agent-teams.md) - Multi-agent collaboration
- [Autonomous Agents](../agents/autonomous-agents.md) - Auto-spawning patterns
