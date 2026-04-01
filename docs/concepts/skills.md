# Skills System: Reusable Prompts and Tools

## Overview

Skills are reusable prompt templates that encapsulate specialized workflows. They can be:

- Triggered by Claude or users
- Customized with parameters
- Discovered from multiple sources (local, project, MCP servers)
- Executed in isolated subagent contexts
- Maintained separately from main code

## Architecture

```
User/Claude Request
        ↓
┌───────────────────────┐
│  Skill Tool invoked   │
│  skill="write-tests"  │
│  args={ file: "..." } │
└───────┬───────────────┘
        ↓
┌─────────────────────────────┐
│ Skill Discovery             │
│ • Check local ~/.claude/    │
│ • Check project ./skills/   │
│ • Check MCP servers         │
└───────┬─────────────────────┘
        ↓
┌─────────────────────────────┐
│ Load Skill .md file         │
│ Parse YAML frontmatter      │
│ Extract prompt content      │
└───────┬─────────────────────┘
        ↓
┌─────────────────────────────────┐
│ Create Subagent Context         │
│ (If not forked mode disabled)   │
│ Inherit parent's capabilities   │
└───────┬─────────────────────────┘
        ↓
┌─────────────────────────────┐
│ Execute in Subagent         │
│ • Skill prompt as system    │
│ • Args injected as message  │
│ • Run full agent loop       │
└───────┬─────────────────────┘
        ↓
┌─────────────────────────────┐
│ Return Results to Caller    │
│ Skill output/findings       │
└─────────────────────────────┘
```

## Skill File Format

Skills are stored as Markdown files with YAML frontmatter:

```yaml
---
name: "write-unit-tests"
description: "Generate unit tests for a given file"
type: "prompt"
source: "user"
args: ["file", "test_framework"]
keywords: ["testing", "jest", "unit-tests"]
---

# Your Skill Prompt Here

You are an expert test writer. Your job is to:
1. Read the provided file
2. Understand its functionality
3. Write comprehensive unit tests

Focus on:
- Edge cases
- Error conditions
- Integration points

The user will provide:
- File path ({{ file }})
- Test framework ({{ test_framework }})

Start by reading the file and analyzing its structure.
```

### Frontmatter Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `name` | string | ✅ | Unique skill identifier |
| `description` | string | ✅ | Human-readable description |
| `type` | string | ✅ | "prompt" (other types future) |
| `source` | string | | "bundled", "project", "user", "mcp" |
| `args` | array | | Parameter names to inject |
| `keywords` | array | | Search tags |
| `mcpServers` | array | | MCP servers to enable |
| `forked` | boolean | | Run in subagent? (default: true) |

## Skill Sources

### 1. User Skills (`~/.claude/skills/`)

User-created skills stored locally:

```
~/.claude/skills/
├── write-unit-tests.md
├── refactor-function.md
├── debug-api.md
└── analyze-performance.md
```

### 2. Project Skills (`./claude_skills/`)

Project-specific skills checked into repo:

```
./claude_skills/
├── setup-db.md
├── run-tests.md
├── deploy.md
└── code-review.md
```

### 3. Bundled Skills

Skills shipped with Claude Code (built-in):

```
src/tools/SkillTool/built-in/
├── tdd.md
├── systematic-debugging.md
├── brainstorming.md
└── ...
```

### 4. MCP Server Skills

Skills provided by Model Context Protocol servers:

```typescript
// MCP server exposes skills via ListPrompts RPC:
{
  name: "analyze-logs",
  description: "Analyze application logs",
  arguments: [
    { name: "log_file", description: "Path to log" }
  ]
}
```

## Skill Tool Interface

The `Skill` tool executes skills:

```typescript
// Input schema
{
  skill: string                    // Skill name
  args?: Record<string, string>   // Optional parameters
}

// Example
await Skill({
  skill: "write-unit-tests",
  args: {
    file: "src/api.ts",
    test_framework: "jest"
  }
})

// Returns
{
  status: "completed",
  output: "Generated tests...",
  // Full subagent execution details
}
```

## Skill Execution Flow

### 1. Skill Discovery

System searches for skill in this order:
1. **Bundled skills** - Claude Code built-ins
2. **Project skills** - `./claude_skills/*.md`
3. **User skills** - `~/.claude/skills/*.md`
4. **MCP skills** - Connected servers (via ListPrompts)

First match wins. Projects can override built-in skills.

### 2. Parameter Injection

Parameters are injected into the skill prompt:

```markdown
---
name: "write-tests"
args: ["file", "framework"]
---

Write tests for: {{ file }}
Using framework: {{ framework }}
```

When called with:
```typescript
await Skill({
  skill: "write-tests",
  args: { file: "app.ts", framework: "vitest" }
})
```

The prompt becomes:
```
Write tests for: app.ts
Using framework: vitest
```

### 3. Subagent Execution

By default, skills run in isolated subagents:

```typescript
// Internally (if forked=true):
const subagent = createSubagent({
  name: "write-tests-skill",
  prompt: skillContent,
  parentBudget: currentBudget
})

await subagent.query({
  systemPrompt: skillContent,
  messages: [
    {
      role: "user",
      content: "Run this skill with args: " + JSON.stringify(args)
    }
  ]
})
```

### 4. Result Aggregation

```typescript
// Subagent completes, results returned:
{
  status: "completed",
  sidechain: {
    messages: [...],      // Full conversation
    tokenUsage: {...}
  }
}
```

## Built-in Superpowers Skills

Claude Code includes specialized skills accessible via `/skill`:

| Skill | Purpose | Invocation |
|-------|---------|-----------|
| `brainstorming` | Explore design before implementation | `/skill brainstorming` |
| `systematic-debugging` | Structured debugging process | `/skill systematic-debugging` |
| `test-driven-development` | TDD workflow with tests first | `/skill test-driven-development` |
| `code-review` | Peer code review checklist | `/skill code-review` |
| `writing-plans` | Create detailed implementation plans | `/skill writing-plans` |

### Superpower Skill: TDD

The TDD skill guides test-driven development:

```markdown
---
name: "test-driven-development"
description: "Write tests first, then implementation"
type: "prompt"
---

# Test-Driven Development Workflow

## Phase 1: Write Failing Tests
1. Understand requirements
2. Write minimal test that fails
3. Verify test fails for right reason

## Phase 2: Write Minimal Implementation
1. Write simplest code to pass test
2. No over-engineering
3. Code passes test

## Phase 3: Refactor
1. Improve code quality
2. Don't change behavior
3. Tests still pass

## Phase 4: Repeat
For each new feature, repeat phases 1-3
```

## Creating Custom Skills

### Basic Skill Template

```markdown
---
name: "my-skill"
description: "What this skill does"
type: "prompt"
args: ["arg1", "arg2"]
keywords: ["keyword1", "keyword2"]
---

# My Custom Skill

You are a specialist in [domain].

Your task is to [goal].

The user will provide:
- arg1 ({{ arg1 }})
- arg2 ({{ arg2 }})

## Process

1. First step: [...]
2. Second step: [...]
3. Final step: [...]

## Deliverables

You should produce:
- [output1]
- [output2]
```

### Advanced: Skill with MCP Services

```markdown
---
name: "database-analyzer"
description: "Analyze database performance"
mcpServers: ["database-inspector"]
args: ["database_url", "query"]
---

# Database Performance Analysis

Using the database-inspector MCP service, analyze the provided query.

Database: {{ database_url }}
Query: {{ query }}

Steps:
1. Connect to database (via MCP)
2. Explain execution plan
3. Identify bottlenecks
4. Suggest optimizations
```

## Skill Discovery & Search

### Local Discovery

Automatic discovery of local skills:

```typescript
// On startup, scan:
// 1. ~/.claude/skills/*.md
// 2. ./claude_skills/*.md
// 3. Built-in skills

// Result: available skills exposed to Claude
```

### Directory Configuration

Control skill search paths:

```bash
# Environment variable
export CLAUDE_CODE_SKILL_DIRS="~/.claude/skills:./my-skills:./src/prompts"

# Searched in order, first match wins
```

## Non-Forked Skills

By default, skills run in subagent contexts (forked=true). To run in parent context:

```markdown
---
name: "quick-calc"
forked: false
---

Simple calculation skill that runs inline.
```

**When to use forked=false:**
- ❌ Simple, fast operations (overhead not worth it)
- ❌ Need to modify parent's state
- ✅ Most skills should be forked (isolation)

## Skill Composition

Skills can call other skills:

```markdown
---
name: "full-feature"
description: "Implement complete feature"
---

# Full Feature Implementation

1. First, run the planning skill:
   Invoke skill "writing-plans" with feature requirements

2. Then, implement using TDD:
   Invoke skill "test-driven-development"

3. Finally, get code review:
   Invoke skill "superpowers:code-review"

Combine results into final feature.
```

## Parameters & Variables

### Template Variables

Use `{{ variableName }}` for parameter injection:

```markdown
Fix the bug in {{ file }} with error: {{ error_message }}

The issue is: {{ issue_description }}
```

### Optional Parameters

Use conditional sections for optional parameters:

```markdown
{{#if testFramework}}
Write tests using: {{ testFramework }}
{{else}}
Choose an appropriate testing framework
{{/if}}
```

## Skill Permissions

Skills inherit parent agent's permissions:

```
User grants permissions to Agent A
    ↓
Agent A spawns Skill B
    ↓
Skill B inherits Agent A's permissions
    ↓
Skill can access what Agent A can access
```

**Note:** Each skill in subagent context is isolated but inherits permission context.

## Performance Optimization

### Prompt Caching in Skills

Skills benefit from prompt caching:

```
First skill execution:
  Parent system prompt: 2000 tokens
  Skill system prompt: 1500 tokens
  Total: 3500 tokens

Second skill execution:
  Parent cache: reused (0 tokens)
  Skill cache: reused (0 tokens)
  Additional: new content only
  Total: ~400 tokens (88% savings!)
```

### Skill Reuse

Define once, use many times:

```
write-tests skill:
  - Used for Python files
  - Used for JavaScript files
  - Used for Go files

Same skill template, different args → efficiency
```

## Use Cases

### 1. Debugging Workflow

```markdown
---
name: "systematic-debug"
---

# Systematic Debugging Process

1. Understand the error
2. Reproduce the issue
3. Narrow down the problem
4. Identify root cause
5. Verify fix
6. Ensure no regressions
```

### 2. Code Review Checklist

```markdown
---
name: "code-review"
args: ["pr_url"]
---

# Code Review Process

Reviewing: {{ pr_url }}

- [ ] Code style consistent?
- [ ] Tests present and passing?
- [ ] Documentation updated?
- [ ] No security issues?
- [ ] Performance acceptable?
```

### 3. Feature Planning

```markdown
---
name: "feature-plan"
args: ["feature_description"]
---

# Feature Planning Workflow

Feature: {{ feature_description }}

## Requirements Analysis
- Parse requirements
- Identify scope
- List acceptance criteria

## Architecture Design
- Design data model
- Design API endpoints
- Design UI components

## Implementation Plan
- Break into tasks
- Estimate effort
- Order by dependency
```

## Key Files

| File | Purpose |
|------|---------|
| `src/tools/SkillTool/SkillTool.ts` | Skill tool implementation |
| `src/tools/SkillTool/built-in/` | Bundled skills |
| `src/commands.ts` | Skill discovery and loading |

## See Also

- [Subagents](./subagents.md) - Skills run in subagents
- [Agent Loop](../core/agent-loop.md) - How skills integrate
- [Tool Use](../core/tool-use.md) - Skills as tools
- [Autonomous Agents](../agents/autonomous-agents.md) - Auto-invoking skills
