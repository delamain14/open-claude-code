# Autonomous Agents: Self-Directed Operation

## Overview

Autonomous Agents operate with minimal human intervention by making decisions automatically through:

- **Coordinator Pattern** - One agent coordinates multiple workers
- **Permission Automation** - Rules automatically approve/deny safe operations
- **Plan Mode** - Agents create and execute their own plans
- **Classifier-Based Safety** - ML evaluates safety of operations
- **Swarm Execution** - Multiple agents work in parallel toward a goal

## Architecture

```
┌──────────────────────────────────────────────┐
│      Main User Prompt: "Build feature X"    │
└──────────────────────┬───────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │  Coordinator Agent (Lead)    │
        │                              │
        │  Strategy:                   │
        │  1. Research problem         │
        │  2. Design solution          │
        │  3. Delegate implementation  │
        │  4. Verify results           │
        └──────────────────┬───────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │  Spawn Worker Agents (Parallel)     │
        │  ├─ Researcher (explore)            │
        │  ├─ Implementer (code)              │
        │  └─ Tester (verify)                 │
        └──────────────────┬───────────────────┘
                           ↓
        ┌─────────────────────────────────────┐
        │  Each Agent Autonomously:           │
        │  • Makes decisions (classifier)     │
        │  • Gets auto-approved permissions   │
        │  • Executes tools                   │
        │  • Reports back                     │
        └──────────────────┬──────────────────┘
                           ↓
        ┌──────────────────────────────┐
        │  Coordinator Synthesizes     │
        │  All findings & decisions    │
        │  Returns final result        │
        └──────────────────────────────┘
```

## Autonomy Mechanisms

### 1. Coordinator Pattern

One agent coordinates multiple specialist agents:

```typescript
// Coordinator System Prompt
You are a project coordinator. Your job is to:

1. Understand the user's goal
2. Break it into subtasks
3. Spawn specialist agents for each subtask
4. Coordinate their work
5. Integrate their results
6. Present final solution

Tools available:
- Agent: Spawn subagents (researcher, coder, tester, etc.)
- SendMessage: Check on subagents, get updates
- Task*: Create/track work items

Process:
1. Research: "Find current implementation patterns"
   → Spawn researcher agent
   → Let it explore codebase

2. Plan: "Create implementation plan"
   → Get researcher findings
   → Create detailed plan

3. Implement: "Build the feature"
   → Spawn implementer agent
   → Monitor progress

4. Test: "Verify functionality"
   → Spawn tester agent
   → Get test results

5. Integration: "Ensure components work together"
   → Review all results
   → Make integration decisions

6. Deliver: "Present solution"
   → Summarize work done
   → Return solution to user
```

### 2. Permission Automation

Permissions automatically approve/deny without user intervention:

```typescript
// Permission Rules (defined once)
{
  rules: [
    // Auto-allow safe operations
    {
      toolName: "Read",
      behavior: "allow"              // Always allow reads
    },
    {
      toolName: "Bash",
      operation: "view",
      pattern: "ls, cat, grep",
      behavior: "allow"              // Safe read-only bash
    },

    // Deny dangerous operations
    {
      toolName: "Bash",
      operation: "execute",
      pattern: "rm, kill, reboot",
      behavior: "deny"               // Never run destructive
    },

    // Auto-allow for specific safe contexts
    {
      toolName: "Edit",
      pathPattern: "src/**",
      fileSize: { maxBytes: 100000 }, // Only small files
      behavior: "allow"               // Safe edits
    },

    // Use classifier for uncertain cases
    {
      toolName: "Edit",
      pathPattern: "tests/**",
      behavior: "classify"            // ML decides
    }
  ]
}

// When tool is called:
// 1. Check rules in order
// 2. First match → apply behavior
// 3. allow → execute
// 4. deny → reject
// 5. classify → use ML classifier
```

### 3. ML Classifier (YOLO Mode)

ML-based safety classifier for uncertain operations:

```typescript
// YOLO Classifier evaluates:
function classifyToolCall(tool, input, context) {
  const signals = {
    // Low-risk signals
    + isReadOnlyOperation: input.tool === "Read",
    + isKnownSafeOperation: input.operation in ["ls", "grep"],
    + hasValidationChecks: schema.validateInput(input),

    // High-risk signals
    - isDestructiveOperation: input.command includes "rm",
    - modifiesSystemFiles: input.path.startsWith("/etc/"),
    - executesWithElevation: input.sudo === true,
    - accessesSecrets: input.path.includes("secret"),

    // Context signals
    + hasBeenAllowedBefore: input.path in approvedPaths,
    + isInTestContext: context.isRunningTests,
    - isFirstTime: newOperation,
    - userWarningLevel: isHighRisk
  }

  // Score: sum of signals
  confidence = calculateConfidence(signals)

  // Threshold
  if (confidence > 0.85) {
    return "allow"     // High confidence: auto-approve
  } else if (confidence < 0.35) {
    return "deny"      // Low confidence: auto-reject
  } else {
    return "ask_user"  // Mid confidence: prompt user
  }
}
```

### 4. Plan Mode

Agents create detailed plans before implementation:

```
User: "Implement user authentication"

Agent in Plan Mode:
  1. Analyze requirements
  2. Research existing code
  3. Design solution
  4. Create step-by-step plan:
     ```
     ## Implementation Plan

     ### Phase 1: Infrastructure
     Step 1.1: Create User table
       File: migrations/001_create_users.sql
       Details: schema with email, password_hash, created_at

     Step 1.2: Create JWT middleware
       File: src/middleware/auth.ts
       Details: verify tokens, attach to request

     ### Phase 2: API Endpoints
     Step 2.1: POST /auth/signup
       File: src/routes/auth.ts
       Endpoint: accept email/password, hash, store
     ...
     ```

  4. Submit plan to user for review:
     [Approve] [Request Changes] [Cancel]

  5. User approves

  6. Execute plan step-by-step:
     - For each step: create task
     - Spawn worker agents
     - Integrate results
     - Verify completeness
```

### 5. Autonomous Decision Making

Agents make decisions without user input:

```
Query Execution Loop:
  Iteration 1:
    Tool call: Read file
    Check permission: allowed (auto-rule)
    Execute immediately
    No user prompt

  Iteration 2:
    Tool call: Edit file
    Check permission: classify needed
    ML classifier scores: 0.92 (high confidence)
    Execute immediately
    No user prompt

  Iteration 3:
    Analyze results
    Plan next step
    Spawn subagent
    Continue autonomously

  Iteration N:
    Final synthesis
    Return results to user
```

## Use Cases

### 1. Feature Implementation (Coordinator)

```
User: "Add dark mode support"

Coordinator Agent:
  1. Spawn researcher:
     "Analyze current theming system"
     → Find: CSS variables, Tailwind config, etc.

  2. Spawn designer:
     "Design dark mode implementation"
     → Create: plan for dark colors, icons, etc.

  3. Spawn implementer:
     "Implement dark mode from design"
     → Create: CSS, toggle button, localStorage

  4. Spawn tester:
     "Test dark mode across browsers"
     → Verify: contrast, performance, UX

  5. Integrate all results:
     → Merge code
     → Run tests
     → Generate summary

Result: Complete dark mode feature, implemented autonomously
```

### 2. Bug Investigation (Autonomy)

```
User: "App crashes on login"

Autonomous Agent:
  1. Gather reproduction info
     (Auto-allowed: Read logs, check configs)

  2. Analyze error signature
     (Auto-allowed: Grep for error patterns)

  3. Examine relevant code
     (Auto-allowed: Read source files)

  4. Identify root cause
     (Decision made by classifier)

  5. Propose fix
     (Auto-allowed: Create fix in isolated test file)

  6. Verify fix
     (Auto-allowed: Run tests)

Result: Bug fixed, all autonomously (user just sees result)
```

### 3. Multi-Specialist Swarm

```
User: "Build REST API for user management"

Coordinator spawns team:
  - Database Specialist: Design schema
  - Backend Specialist: Implement endpoints
  - Test Specialist: Write tests
  - Documentation Specialist: Write API docs

Each works autonomously:
  - Makes decisions within their domain
  - Follows auto-approval rules
  - Reports progress
  - Integrates with others

Coordinator monitors:
  - Tracks task completion
  - Resolves cross-team conflicts
  - Merges all results
```

## Implementation Details

### Coordinator System Prompt Injection

```typescript
// In parent agent execution:
const coordinatorPrompt = `
You are a project coordinator agent. Your role is to:

1. **Understand**: Parse user request
2. **Plan**: Break into subtasks
3. **Delegate**: Spawn specialist agents
4. **Monitor**: Track progress
5. **Integrate**: Combine results
6. **Deliver**: Present solution

Available agents:
- general-purpose: For generic tasks
- explorer: For code research
- verifier: For testing
- plan-agent: For planning

Your workflow:
Step 1: Analyze the task
  → Read relevant files
  → Understand constraints
  → Identify specialist needs

Step 2: Create plan
  → List subtasks
  → Identify dependencies
  → Estimate effort

Step 3: Spawn agents
  For each task:
    agent = Agent({
      description: "...",
      subagent_type: "appropriate-type"
    })
    results[task] = agent

Step 4: Integrate
  → Combine all results
  → Resolve any conflicts
  → Create unified solution

Step 5: Verify
  → Ensure completeness
  → Check quality
  → Address gaps

Step 6: Deliver
  → Summarize process
  → Present final result
  → Offer follow-ups

Remember: Work autonomously, make safe decisions,
use tools liberally, spawn agents generously.
`
```

### Auto-Approval Rules

```typescript
// Permission rules for autonomous agents
const autonomousRules = [
  // Reading files - always OK
  { toolName: "Read", behavior: "allow" },
  { toolName: "Glob", behavior: "allow" },
  { toolName: "Grep", behavior: "allow" },

  // Writing tests - always OK
  {
    toolName: "Write",
    pathPattern: "**/*.test.ts",
    behavior: "allow"
  },

  // Bash read-only operations - always OK
  {
    toolName: "Bash",
    commandPattern: ["ls", "cat", "grep", "git log"],
    behavior: "allow"
  },

  // Editing known files - OK
  {
    toolName: "Edit",
    pathPattern: ["src/**", "tests/**"],
    behavior: "allow"
  },

  // Dangerous operations - always deny
  {
    toolName: "Bash",
    commandPattern: ["rm -rf", "reboot", "sudo"],
    behavior: "deny"
  },

  // Uncertain cases - use classifier
  {
    behavior: "classify"  // Default fallback
  }
]
```

## Configuration

### Enable Autonomy

```bash
# Feature flags
export CLAUDE_AUTONOMOUS_AGENTS=true
export CLAUDE_AUTO_PERMISSION=true
export CLAUDE_CLASSIFIER_MODE=true

# Or per-session
claude-code --autonomous --auto-permission
```

### Coordinator Mode

```bash
# Spawn coordinator agent automatically
claude-code --coordinator-mode "Build feature X"

# Or manually invoke
/skill coordinating-agents
```

## Safety Considerations

### 1. Scope Limitation

Autonomous agents operate within defined scope:
- Specific project directory
- Specific file patterns (src/**, tests/**)
- Specific tool whitelist (Read, Bash view, etc.)

### 2. Permission Boundaries

Even with autonomy, permissions respected:
- Can't write to /etc/
- Can't execute rm/reboot
- Can't access secrets
- All checked by permission rules

### 3. Human Override

Users can:
- Interrupt agent at any time (Ctrl+C)
- Review plan before execution (Plan Mode)
- Set permission rules to be more restrictive
- Require prompts for any high-risk operation

### 4. Audit Trail

All autonomous decisions logged:
- Which tool was called
- What permission rule applied
- What permission was granted/denied
- Who/what made the decision

## Best Practices

### 1. Use Coordinator for Complex Tasks

✅ Good:
```
Complex task: "Refactor API layer with new error handling"
→ Use coordinator to break into subtasks
→ Spawn specialists for each part
→ Each works autonomously
```

❌ Bad:
```
Simple task: "Read this file and tell me what it does"
→ Single agent, no need for coordinator
→ Simpler and faster
```

### 2. Enable Plan Mode for Major Changes

✅ Good:
```
Major refactor:
1. Enter Plan Mode
2. Agent creates plan
3. Review plan with team
4. Approve
5. Agent executes autonomously
```

❌ Bad:
```
Major change without plan
→ Uncoordinated work
→ Rework and conflicts
```

### 3. Set Clear Permission Boundaries

✅ Good:
```
Autonomous permissions:
- Can edit: src/**, tests/**
- Can execute: npm test, npm build
- Cannot: rm, ssh, sudo
```

❌ Bad:
```
All permissions auto-approve
→ Risk of accidental damage
→ No safety checks
```

## Key Files

| File | Purpose |
|------|---------|
| `src/coordinator/coordinatorMode.ts` | Coordinator mode |
| `src/utils/permissions/yoloClassifier.ts` | ML classifier |
| `src/tools/EnterPlanModeTool/` | Plan mode entry |
| `src/tools/ExitPlanModeTool/` | Plan mode exit |
| `src/tools/AgentTool/` | Subagent spawning |

## See Also

- [Agent Loop](../core/agent-loop.md) - Basic execution
- [Subagents](../concepts/subagents.md) - Agent spawning
- [Agent Teams](./agent-teams.md) - Team coordination
- [Permissions](../../architecture/permissions.md) - Permission system
