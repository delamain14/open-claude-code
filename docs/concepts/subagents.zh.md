# Subagents: 创建隔离的 Agents

## 概述

Subagents 是由父 agent 生成的隔离 agents,用于委托专门的任务。与主 agent 不同,subagents:

- 在同一进程中运行(快速、低开销)
- 通过 `AsyncLocalStorage` 具有隔离的上下文
- 执行自己完整的 agent 循环
- 与父级共享 prompt 缓存(更便宜的 tokens)
- 可以通过 `SendMessage` 恢复
- 可以生成更多 subagents(无限嵌套)

## 架构

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

### AsyncLocalStorage 隔离

Subagents 使用 `AsyncLocalStorage` 来维护隔离的上下文,而不共享状态:

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

### Context 隔离的好处

- **无共享状态**: 每个 agent 都有自己的消息缓冲区、文件缓存
- **并发安全**: 多个 agents 运行时互不干扰
- **清晰分离**: 上下文之间没有交叉污染
- **自动清理**: 当 agent 退出时,context 被销毁

## 生成 Subagents

### Agent Tool (主要机制)

`Agent` tool 用于生成 subagents:

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

### 内置 Subagent 类型

Claude Code 提供 5 种专门的 subagent 类型:

| Type | 目的 | 使用场景 |
|------|---------|----------|
| `general-purpose` | 通用任务助手 | 重构、编写代码、分析 |
| `explorer` | 代码研究专家 | 查找文件、理解结构 |
| `verifier` | 测试与验证 | 运行测试、验证实现 |
| `plan-agent` | 规划专家 | 创建详细计划 |
| `claude-code-guide` | 文档参考 | 回答 Claude Code 问题 |

### 自定义 Subagent 类型

项目可以定义自定义 subagent 类型:

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

然后生成:
```typescript
await Agent({
  description: "Find all singleton patterns",
  subagent_type: "my-analyzer"
})
```

## Subagent 生命周期

### 1. 创建

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

### 2. 初始化

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

### 3. 执行

Subagent 运行自己完整的 agent 循环:
- 构建自己的 system prompt
- 进行 API 调用(使用父级的 prompt cache)
- 在自己的 context 中执行 tools
- 管理自己的 token budget
- 累积自己的消息历史

```
Subagent Query Loop:
  Iteration 1: API call → tool calls (Read, Grep)
  Iteration 2: Tool results → synthesis → API call
  Iteration 3: Final analysis → stop
```

### 4. 完成

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

### 5. 可选的恢复

已完成的 subagent 可以被恢复:

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

## Prompt Caching (优化)

Subagents 与父级共享 prompt cache 以降低 token 成本:

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

**Token 节省示例:**
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

## File State 隔离

每个 subagent 都获得一个克隆的 file state cache:

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

每个 subagent 维护自己的 message sidechain:

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

## 嵌套 Subagents (无限深度)

Subagents 可以生成其他 subagents:

```
Level 0 (Main Agent)
  └─ Level 1 (Subagent #1: "explorer")
      ├─ Level 2 (Subagent #1.1: "general-purpose")
      │   └─ Level 3 (Subagent #1.1.1: "verifier")
      │       └─ Level 4 (Subagent #1.1.1.1: custom)
      │           └─ ... (unlimited nesting)
      └─ Level 2 (Subagent #1.2: "general-purpose")
```

**约束:**
- 共享的父级 budget 被分割
- 嵌套越深 = 每个 agent 的 budget 越少
- 深度没有硬性限制
- 实际限制: ~5-7 层(budget 耗尽)

**级联示例:**
```
Main Agent (100k tokens):
  1. Spawns researcher (50k)
     └─ Spawns analyzer (25k)
        └─ Spawns verifier (12.5k)
           └─ Uses remaining budget for testing
```

## Agents 之间的通信

### Subagent 到 Parent (返回)

Subagent 结果作为 tool result 返回:

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

### 恢复 Subagents (消息发送)

向 subagents 发送后续消息:

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

### Parent 到 Subagent (任务描述)

通过任务描述进行初始指导:

```typescript
await Agent({
  description: "Find all Python files that import tensorflow",
  subagent_type: "explorer"
})

// Subagent receives as user message in its loop
```

## 使用场景

### 1. 并行研究

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

### 2. 分而治之的实现

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

### 3. 验证与测试

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

### 4. 专门分析

```typescript
// Create custom subagent for domain-specific task
await Agent({
  description: "Analyze SQL queries for N+1 problems",
  subagent_type: "performance-analyzer",
  prompt: `You are a database performance specialist.
           Look for N+1 queries, missing indices, etc.`
})
```

## 最佳实践

### 何时使用 Subagents

✅ **好的使用场景:**
- 并行独立任务
- 专门的子任务(explore、verify)
- 长时间运行的研究
- 隔离风险操作
- 分而治之的方法

❌ **不好的使用场景:**
- 单个顺序任务(开销不值得)
- 简单的一次性 tools
- 紧密循环(在循环中生成 agents)

### Budget 管理

始终注意 budget 约束:

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

### 命名与描述

明确 subagent 的目的:

✅ 好的:
```typescript
Agent({
  description: "Find all TypeScript files that import React hooks"
})
```

❌ 不好的:
```typescript
Agent({
  description: "Look at stuff"
})
```

## 关键文件

| File | 目的 |
|------|---------|
| `src/tools/AgentTool/` | Agent tool 实现 |
| `src/tools/AgentTool/runAgent.ts` | 生成新 subagent |
| `src/tools/AgentTool/resumeAgent.ts` | 恢复现有 subagent |
| `src/utils/agentContext.ts` | AsyncLocalStorage 设置 |
| `src/utils/forkedAgent.ts` | Subagent 参数处理 |
| `src/tools/SendMessageTool/` | 恢复 subagent 通信 |

## 另请参阅

- [Agent Loop](../core/agent-loop.md) - 主执行循环
- [Skills](./skills.md) - 可重用 skill 执行
- [Agent Teams](../agents/agent-teams.md) - 多 agent 协作
- [Autonomous Agents](../agents/autonomous-agents.md) - 自动生成模式
