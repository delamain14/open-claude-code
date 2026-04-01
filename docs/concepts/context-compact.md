# Context Compaction: Managing Conversation History

## Overview

Context Compaction is the automatic compression of conversation history to prevent exceeding token budget limits. It allows unlimited conversation length by intelligently summarizing completed work while preserving recent context and task state.

## Problem: Token Budget Limits

The agent loop operates within a token budget (typically 100k-200k tokens):

```
Budget: 100,000 tokens
├─ System prompt: ~2,000 tokens
├─ Current iteration API response: ~5,000 tokens
├─ Message history: grows with every iteration
└─ Reserve for next iteration: ~4,000 tokens

After many iterations:
  Iteration 50: Message history is 60,000 tokens
  Iteration 51: Only 20,000 remaining for next iteration
  → Cannot ask Claude substantive questions
  → Loop must terminate soon
```

**Solution:** Compress old messages before budget is exhausted.

## Token Budget States

```
State Indicator    Token Usage    Behavior
─────────────────────────────────────────────
NORMAL             < 80%          Continue normally
WARNING            80-95%         Auto-compact if enabled
CRITICAL           > 95%          May force truncation
EXHAUSTED          >= 100%        Loop terminates
```

The system tracks tokens in real-time and adjusts behavior accordingly.

## Automatic Compaction

### Trigger Conditions

Automatic compaction occurs when:

1. **Token usage enters WARNING state** (80%+ of budget)
   AND
2. **Auto-compact is enabled** (default: yes)

Example:
```
Budget: 100,000 tokens
Current usage: 84,000 tokens (84%)
→ WARNING state → autoCompact() triggered
→ Compress old messages
→ Reclaim 40,000 tokens
→ Continue with 44,000 tokens available
```

### Compaction Algorithm

The `compact()` function applies the following strategy:

```typescript
function compact(messages: Message[], config: CompactConfig) {
  // Step 1: Find compaction boundary
  // Skip recent messages, start from older ones
  const boundaryIndex = findCompactionBoundary(
    messages,
    keepRecentMessages: 5,  // Always keep 5 recent
    minCompactSize: 10000   // Need at least 10k tokens to compact
  )

  // Step 2: Build pre-compact messages (unchanged)
  const preCompactMessages = messages.slice(0, boundaryIndex)

  // Step 3: Generate summary
  const summary = await generateCompactSummary(
    preCompactMessages,
    {
      includeToolUse: true,
      includeReasons: true,
      preserveState: ["tasks", "permissions"]
    }
  )

  // Step 4: Create boundary message
  const boundaryMessage = {
    type: "SystemCompactBoundaryMessage",
    content: summary,
    timestamp: Date.now(),
    tokensReclaimed: preCompactTokens - summaryTokens
  }

  // Step 5: Build post-compact messages
  const postCompactMessages = [
    boundaryMessage,  // Synthetic message marking compaction point
    ...messages.slice(boundaryIndex)  // Recent messages unchanged
  ]

  // Step 6: Return compressed messages
  return postCompactMessages
}
```

## Compaction Example

### Before Compaction

```
Message 1:  User: "Analyze this bug"
            [50 tokens]
Message 2:  Assistant: "I'll investigate..."
            [100 tokens]
Message 3:  ToolUse: Read src/main.ts
            [50 tokens]
Message 4:  ToolResult: [file contents - 500 tokens]
            [500 tokens]
Message 5:  Assistant: "I found the bug..."
            [200 tokens]
Message 6:  ToolUse: Edit src/main.ts (fix)
            [100 tokens]
Message 7:  ToolResult: Success [50 tokens]
            [50 tokens]
... 50+ more messages ...
Message 60: [3000 tokens]
Message 61: [Current user query - 200 tokens]

Total: 87,000 tokens (87% of budget) → WARNING
```

### Compaction Strategy

Keep messages 58-61 (recent), summarize 1-57 (old):

```
Summary:
"The user asked to analyze a bug in src/main.ts.
After investigation, found memory leak in loop variable.
Fixed with variable initialization on line 42.
User then asked for testing. Created 5 new unit tests
covering edge cases. All tests passing."

[300 tokens]
```

### After Compaction

```
SystemCompactBoundaryMessage (generated):
  "Previous conversation: Analyzed bug in src/main.ts,
   found memory leak, applied fix (line 42), wrote tests."
  [300 tokens]

Message 58: User: "..."
            [1000 tokens]
Message 59: Assistant: "..."
            [1200 tokens]
Message 60: ToolUse: "..."
            [100 tokens]
Message 61: User: "..."
            [200 tokens]

Total: 2,800 tokens (2.8% of budget) → NORMAL
Tokens reclaimed: ~84,200 tokens
```

## Preserved Information

Compaction preserves critical state:

### 1. Task State

All task information preserved:
- Current tasks and status
- Dependencies (blockedBy, blocks)
- Assigned agents
- Task metadata

```typescript
// Tasks extracted and preserved in summary
"Active tasks:
  - Task 1 (in_progress): Fix API endpoint
  - Task 2 (pending): Write tests (blocked by Task 1)
  - Task 3 (completed): Database migration"
```

### 2. Permission Rules

All permission context preserved:
- Allowed/denied paths
- Tool access levels
- Permission mode

```typescript
"Permissions:
  - Can edit: src/**, tests/**
  - Can execute: npm test, npm run build
  - Cannot execute: rm, destructive commands"
```

### 3. Key Decisions

Important decisions and findings:
- Why certain approaches were chosen
- Known issues or constraints
- API keys or configuration (if appropriate)

```typescript
"Decided: Use React for UI (not Vue) due to existing
codebase. Constraint: Cannot modify database schema
until migration complete."
```

### 4. Recent Context

Always kept verbatim:
- Last N messages (user-configurable, default: 5)
- Current state
- Active operations

## Manual Compaction

Users can manually trigger compaction:

```bash
# Interactive command
> /compact

# Initiates:
// 1. Display token usage
// 2. Show what will be summarized
// 3. Execute compaction
// 4. Display tokens reclaimed
```

## Context Collapse (Experimental)

Advanced feature that aggressively collapses context:

**When enabled:** Further compaction by:
- Combining redundant messages
- Summarizing tool chains
- Removing intermediate steps

Example:
```
Before collapse:
  Tool: Read file A
  Result: contents
  Tool: Read file B
  Result: contents
  Tool: Grep pattern
  Result: matches

After collapse:
  Summary: Searched pattern across files A and B,
           found N matches in file A, 0 in file B
```

## Reactive Compaction (Experimental)

Proactive compaction before WARNING state:

```
Normal operation: < 80% used
→ Reactive compaction triggers at 70%
→ Preemptively compresses
→ Maintains larger buffer for next iteration
→ Smoother operation, fewer stalls
```

## Compaction Events & Hooks

System emits events during compaction:

```typescript
// Hook: pre_compact
// Called before compaction starts
{
  type: "hooks_start",
  hookType: "pre_compact",
  tokensUsed: 84000,
  tokenBudget: 100000
}

// Compaction executes...

// Hook: post_compact
// Called after compaction completes
{
  type: "hooks_end",
  hookType: "post_compact",
  tokensBefore: 84000,
  tokensAfter: 2800,
  tokensReclaimed: 81200
}
```

## Configuration

### Auto-Compact Settings

Control compaction behavior:

```typescript
// In config
const compactConfig = {
  enabled: true,                      // Enable auto-compact
  triggerThreshold: 0.80,             // 80% budget = trigger
  keepRecentMessages: 5,              // Always preserve 5 recent
  minCompactSize: 10000,              // Need 10k+ to compact
  maxCompactSize: 50000,              // Compact max 50k per round
  enableReactiveCompact: false,       // (experimental)
  enableContextCollapse: false        // (experimental)
}
```

### Disable Auto-Compact

For development or specific workflows:

```bash
export CLAUDE_AUTO_COMPACT=false

# Now manual /compact only
```

## Performance Characteristics

### Compaction Time

Typical compaction takes 1-5 seconds:

```
Time Breakdown:
  Parse old messages:        0.5s
  Generate summary (API):    2-3s
  Build new message list:    0.5s
  Write to disk:             0.1s
  ─────────────────────────────
  Total:                     3-4s
```

### Token Reclamation

Typical reclamation: 80-90% of compacted messages

```
Messages to compact: 50,000 tokens
Summary generated: 300-500 tokens
Net reclamation: ~49,500 tokens (99% savings!)
```

### Impact on Loop

Compaction pauses the agent loop:

```
Loop iteration N:
  API call, tool results, etc.
  Check tokens: 85% used → WARNING

→ Trigger compaction (user notified)
→ Pause for 3-4 seconds
→ Reclaim 50,000 tokens

Loop iteration N+1:
  Continue with 32% usage (refreshed!)
```

## Edge Cases

### Small Conversations

Compaction is skipped if too little to compact:

```
Messages: 5, total tokens: 3,000
→ All under minCompactSize threshold
→ Compaction skipped
→ No benefit from compacting so little
```

### Recent Message-Heavy Conversations

If many recent messages can't be compacted:

```
Recent 10 messages: 70,000 tokens (protected)
Older messages: 18,000 tokens (compactible)

→ Compaction only targets 18,000
→ Maybe not enough to drop below WARNING
→ Might need to terminate loop
```

### Circular Tool Calls

Tool calls that repeat (loop):

```
Iteration 1: Call Grep
Iteration 2: Call Grep (similar query)
Iteration 3: Call Grep (similar query)

Summary: "Executed similar grep queries N times
          with results: ..."
```

## Best Practices

### 1. Clear Task Descriptions

Help compaction preserve important context:

✅ Good:
```
Task: "Fix critical security vulnerability in JWT validation.
       Tokens currently don't verify algorithm field.
       See CVE-2023-1234 for details."
```

❌ Bad:
```
Task: "Fix security bug"
```

### 2. Checkpoint Completion

Mark tasks/milestones as complete:

✅ Good:
```
// Periodically:
TaskUpdate(task, status="completed")  // Clear checkpoint

// New task:
TaskCreate(task)  // Start fresh
```

❌ Bad:
```
// One massive conversation:
User: "Do everything..."
// 200+ messages accumulate
// Hard to compact meaningfully
```

### 3. Use Subagents for Long Tasks

Delegate to subagents to keep parent loop clean:

✅ Good:
```
Parent spawns:
  Subagent-1: "Analyze API"
  Subagent-2: "Analyze Database"

Parent compacts between spawns
Each subagent has fresh budget
```

❌ Bad:
```
Single agent does everything
Message history grows unbounded
Compaction becomes very lossy
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/compact/autoCompact.ts` | Compaction trigger logic |
| `src/services/compact/compact.ts` | Core compaction algorithm |
| `src/services/compact/reactiveCompact.ts` | (experimental) proactive compaction |
| `src/services/contextCollapse/` | (experimental) aggressive collapse |
| `src/query/tokenBudget.ts` | Token tracking and states |
| `src/query/transitions.ts` | State transition logic |

## See Also

- [Agent Loop](../core/agent-loop.md) - Where compaction is triggered
- [Tasks](../core/todowrite.md) - Task preservation during compaction
- [Permissions](../../architecture/permissions.md) - Permission preservation
- [Hooks System](../../architecture/application-state.md) - Compaction events
