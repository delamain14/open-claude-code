# Agent Loop: The Heart of Claude Code

## Overview

The Agent Loop is the core execution engine that drives Claude Code's entire interaction model. It implements a continuous "perceive → think → act" cycle that processes user requests, coordinates with external APIs, manages tool execution, and handles context management.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              User Request / Message                 │
└─────────────────────┬───────────────────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │   Message Normalization         │
        │ • Parse user input              │
        │ • Merge with conversation state │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Build System Prompt             │
        │ • Dynamic prompt generation     │
        │ • Include available tools       │
        │ • Context integration           │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ API Call to Claude              │
        │ • Stream response               │
        │ • Token tracking                │
        │ • Prompt caching                │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Parse Streaming Response        │
        │ • Extract tool calls            │
        │ • Collect text blocks           │
        │ • Build message object          │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Tool Execution (Concurrent)     │
        │ • Check permissions             │
        │ • Run tools in parallel         │
        │ • Collect results               │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Context Management              │
        │ • Check token usage             │
        │ • Trigger compaction if needed  │
        │ • Update message history        │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Should Continue?                │
        │ • All tools complete?           │
        │ • Budget remaining?             │
        │ • Loop again for next turn      │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │     Return Results to User      │
        └─────────────────────────────────┘
```

## Key Components

### 1. Query Engine (`src/query.ts`)

The main entry point and orchestrator of the agent loop. The `query()` function:

- **Receives** a configuration object with system prompts, messages, and constraints
- **Manages** multiple loop iterations until completion or budget exhaustion
- **Coordinates** tool execution, context compression, and result aggregation
- **Tracks** token usage across all API calls

```typescript
query(config: QueryConfig): Promise<QueryResult>
```

**Key responsibilities:**
- Initialize query state and token budget
- Build complete messages array for each iteration
- Call Claude API with streaming
- Parse and handle tool use blocks
- Execute tools and integrate results
- Detect loop termination conditions

### 2. Message Normalization

Converts user input into a standardized format:
- Merges pending messages from UI
- Validates message structure
- Handles special message types (system, user, assistant)
- Prepares for API submission

### 3. System Prompt Construction

Dynamically builds the prompt sent to Claude:

**Components:**
1. **Base system prompt** - Core instructions for Claude Code behavior
2. **Tool definitions** - OpenAI-compatible tool schemas
3. **Permission rules** - Current access constraints
4. **Context** - Recent relevant information
5. **Features** - Enabled experimental features

Tools are exposed via the `tools` parameter in the API request:
```typescript
{
  tools: [
    {
      name: "Bash",
      description: "Execute bash commands...",
      input_schema: {
        type: "object",
        properties: { /* ... */ }
      }
    },
    // More tools...
  ]
}
```

### 4. StreamingToolExecutor

Manages concurrent execution of multiple tools called in a single API response:

**Features:**
- Non-blocking parallel execution using `Promise.all()`
- Handles tool permission checks
- Catches and reports errors gracefully
- Integrates results back into message stream
- Supports timeout limits per tool
- Maintains execution order for sequential dependencies

```typescript
// Multiple tool calls executed in parallel
const toolResults = await Promise.all(
  toolCalls.map(call => executeTool(call))
)
```

### 5. Token Budget Management

Tracks and enforces token consumption limits:

**States:**
- `NORMAL` - < 80% of budget used
- `WARNING` - 80-95% used → triggers auto-compact
- `CRITICAL` - > 95% used → may force truncation

**Tracking includes:**
- API request tokens (input + output)
- Tool execution costs
- Context compaction overhead
- Cache write tokens (cheaper via prompt caching)

### 6. Context Compression (`autoCompact.ts`)

Automatically compresses message history when token usage approaches limits:

- **Trigger:** WARNING state or explicit `/compact` command
- **Method:** Summarizes old tool calls, preserves recent context
- **Benefit:** Allows unlimited conversation length within budget
- **Preserves:** Task state, permissions, recent work

## Loop Iteration Flow

### Iteration N:

1. **Prepare Messages**
   ```
   [system_prompt, ...conversation_history, user_message, ...tool_results]
   ```

2. **Calculate Tokens**
   - Input tokens: messages + system prompt
   - Reserved output tokens: typically 4000
   - Validate against budget

3. **API Call**
   ```typescript
   const response = await client.messages.create({
     model: "claude-3-5-sonnet-20241022",
     max_tokens: reservedOutputTokens,
     system: systemPrompt,
     tools: toolDefinitions,
     messages: messageHistory
   })
   ```

4. **Stream Processing**
   - Collect text content blocks
   - Extract tool_use blocks
   - Build response message

5. **Tool Execution**
   ```
   For each tool_use:
     - Check permissions (may prompt user)
     - Execute tool concurrently
     - Collect results
     - Add tool_result blocks
   ```

6. **Continuation Check**
   ```
   if (response.stop_reason === "end_turn"):
     return completed
   elif (response.stop_reason === "tool_use"):
     next_iteration = true
   elif (tokens_remaining < reserve):
     autoCompact() and continue
   else:
     return error
   ```

7. **Next Iteration** (if continuing)
   - Add current message and tool results to history
   - Loop back to step 1

## State Management

The Agent Loop maintains several key state variables:

```typescript
interface QueryState {
  messages: Message[]              // Conversation history
  usedTokens: number              // Running total
  budgetTokens: number            // Max allowed
  toolResults: ToolResult[]       // Current iteration results
  loopIteration: number           // Track attempts
  compactedAt?: Message           // Last compression point
  isCompacting: boolean           // Compression in progress
}
```

## Multi-Agent Interaction

When tool execution includes spawning subagents:

1. **Parent query loop** pauses
2. **Subagent** gets its own isolated context (via AsyncLocalStorage)
3. **Subagent** runs its own complete query loop
4. **Results** returned to parent as tool result
5. **Parent** continues with synthesized output

This nesting is unbounded - subagents can spawn their own subagents.

## Error Handling

The loop gracefully handles various failure modes:

| Error Type | Recovery |
|-----------|----------|
| Tool permission denied | Skip tool, continue |
| Tool execution failure | Capture error, return to API |
| API timeout | Retry with reduced budget |
| Invalid response format | Log error, terminate loop |
| Budget exhaustion | Force completion, warn user |

## Performance Optimizations

### 1. Prompt Caching
- First request: full system prompt and tools (creates cache)
- Subsequent requests: reference cache key (cheaper tokens)
- Shared across agent hierarchy (parent ↔ child agents)

### 2. Concurrent Tool Execution
- All tools in a single response run in parallel
- Reduces wall-clock time vs. sequential execution

### 3. Context Compression
- Automatic when approaching token limits
- Preserves semantic information in summaries
- Allows infinite conversation length

### 4. Lazy Initialization
- Tools loaded on-demand
- Features enabled based on configuration
- Reduces startup overhead

## Configuration & Customization

The Agent Loop behavior is controlled via:

1. **Environment Variables**
   - `CLAUDE_COMPUTE_BUDGET` - Token limit
   - `EXPERIMENTAL_FEATURES` - Feature flags

2. **Runtime Options**
   - System prompt template
   - Tool definitions
   - Permission rules
   - Budget distribution

3. **Hooks**
   - `on_loop_start` - Called before first iteration
   - `on_iteration_complete` - Called after each iteration
   - `on_context_compact` - Called during compression

## Examples

### Simple Query with Single Tool
```
User: "What's in this file?"
  ↓ query(...)
  [API call with FileReadTool]
    ↓ API returns: tool_use(FileReadTool, path="file.txt")
  [Execute FileReadTool]
    ↓ Tool returns: file contents
  [API call with tool result]
    ↓ API returns: text response (stop_reason=end_turn)
  [Return result to user]
```

### Complex Query with Multiple Iterations
```
User: "Analyze this bug and propose a fix"
  ↓ [Iteration 1: API plans approach, calls FileReadTool]
  ↓ [Iteration 2: API analyzes code, calls GrepTool for similar patterns]
  ↓ [Iteration 3: API writes fix, calls FileEditTool]
  ↓ [Iteration 4: API verifies, calls BashTool to run tests]
  ↓ [API generates summary response]
  [Return to user]
```

### Context Compression Scenario
```
Long conversation: 20+ messages, 50,000 tokens used
  ↓ New user message arrives
  ↓ Query engine calculates: 45,000 used of 100,000 budget
  ↓ WARNING state triggered (45% buffer for this iteration)
  ↓ autoCompact() summarizes old tool calls
  ↓ Message history compressed to 25,000 tokens
  ↓ Continues normally with freed capacity
```

## Key Files

| File | Purpose |
|------|---------|
| `src/query.ts` | Main query engine and loop orchestration |
| `src/QueryEngine.ts` | Initialization and configuration |
| `src/query/transitions.ts` | State transition logic |
| `src/query/tokenBudget.ts` | Token tracking and budget enforcement |
| `src/services/tools/StreamingToolExecutor.ts` | Concurrent tool execution |
| `src/services/compact/autoCompact.ts` | Context compression logic |

## See Also

- [Tool Use System](../core/tool-use.md) - How tools are invoked
- [Context Compaction](../concepts/context-compact.md) - Compression mechanism
- [Subagents](../concepts/subagents.md) - Nested agent execution
- [Tasks and TodoWrite](../tasks/tasks.md) - Task management integration
