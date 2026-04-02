# Context Compaction: 管理对话历史

## 概述

Context Compaction 是对话历史的自动压缩，防止超过 token 预算限制。它允许通过智能总结已完成的工作，同时保留最近的上下文和任务状态来实现无限的对话长度。

## 问题: Token 预算限制

Agent 循环在 token 预算内运行（通常 100k-200k tokens）:

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

**解决方案:** 在预算耗尽之前压缩旧消息。

## Token 预算状态

```
State Indicator    Token Usage    Behavior
─────────────────────────────────────────────
NORMAL             < 80%          Continue normally
WARNING            80-95%         Auto-compact if enabled
CRITICAL           > 95%          May force truncation
EXHAUSTED          >= 100%        Loop terminates
```

系统实时跟踪 tokens 并相应调整行为。

## 自动 Compaction

### 触发条件

自动 compaction 在以下情况发生：

1. **Token 使用进入 WARNING 状态**（预算的 80%+）
   并且
2. **Auto-compact 已启用**（默认：是）

示例：
```
Budget: 100,000 tokens
Current usage: 84,000 tokens (84%)
→ WARNING state → autoCompact() triggered
→ Compress old messages
→ Reclaim 40,000 tokens
→ Continue with 44,000 tokens available
```

### Compaction 算法

`compact()` 函数应用以下策略：

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

## Compaction 示例

### Compaction 之前

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

### Compaction 策略

保留消息 58-61（最近的），总结 1-57（旧的）：

```
Summary:
"The user asked to analyze a bug in src/main.ts.
After investigation, found memory leak in loop variable.
Fixed with variable initialization on line 42.
User then asked for testing. Created 5 new unit tests
covering edge cases. All tests passing."

[300 tokens]
```

### Compaction 之后

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

## 保留的信息

Compaction 保留关键状态：

### 1. Task 状态

所有 task 信息都被保留：
- 当前 tasks 和状态
- 依赖关系（blockedBy, blocks）
- 分配的 agents
- Task metadata

```typescript
// Tasks extracted and preserved in summary
"Active tasks:
  - Task 1 (in_progress): Fix API endpoint
  - Task 2 (pending): Write tests (blocked by Task 1)
  - Task 3 (completed): Database migration"
```

### 2. Permission 规则

所有 permission 上下文都被保留：
- 允许/拒绝的路径
- Tool 访问级别
- Permission 模式

```typescript
"Permissions:
  - Can edit: src/**, tests/**
  - Can execute: npm test, npm run build
  - Cannot execute: rm, destructive commands"
```

### 3. 关键决策

重要的决策和发现：
- 为什么选择某些方法
- 已知问题或约束
- API keys 或配置（如果适当）

```typescript
"Decided: Use React for UI (not Vue) due to existing
codebase. Constraint: Cannot modify database schema
until migration complete."
```

### 4. 最近的上下文

始终保持原样：
- 最后 N 条消息（用户可配置，默认：5）
- 当前状态
- 活动操作

## 手动 Compaction

用户可以手动触发 compaction：

```bash
# Interactive command
> /compact

# Initiates:
// 1. Display token usage
// 2. Show what will be summarized
// 3. Execute compaction
// 4. Display tokens reclaimed
```

## Context Collapse（实验性）

高级功能，可以积极地折叠上下文：

**启用时：** 通过以下方式进一步压缩：
- 合并冗余消息
- 总结 tool 链
- 删除中间步骤

示例：
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

## Reactive Compaction（实验性）

在 WARNING 状态之前主动 compaction：

```
Normal operation: < 80% used
→ Reactive compaction triggers at 70%
→ Preemptively compresses
→ Maintains larger buffer for next iteration
→ Smoother operation, fewer stalls
```

## Compaction 事件和 Hooks

系统在 compaction 期间发出事件：

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

## 配置

### Auto-Compact 设置

控制 compaction 行为：

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

### 禁用 Auto-Compact

用于开发或特定工作流：

```bash
export CLAUDE_AUTO_COMPACT=false

# Now manual /compact only
```

## 性能特征

### Compaction 时间

典型的 compaction 需要 1-5 秒：

```
Time Breakdown:
  Parse old messages:        0.5s
  Generate summary (API):    2-3s
  Build new message list:    0.5s
  Write to disk:             0.1s
  ─────────────────────────────
  Total:                     3-4s
```

### Token 回收

典型回收：压缩消息的 80-90%

```
Messages to compact: 50,000 tokens
Summary generated: 300-500 tokens
Net reclamation: ~49,500 tokens (99% savings!)
```

### 对 Loop 的影响

Compaction 暂停 agent loop：

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

## 边缘情况

### 小型对话

如果压缩内容太少，则跳过 compaction：

```
Messages: 5, total tokens: 3,000
→ All under minCompactSize threshold
→ Compaction skipped
→ No benefit from compacting so little
```

### 最近消息较多的对话

如果许多最近的消息无法压缩：

```
Recent 10 messages: 70,000 tokens (protected)
Older messages: 18,000 tokens (compactible)

→ Compaction only targets 18,000
→ Maybe not enough to drop below WARNING
→ Might need to terminate loop
```

### 循环 Tool 调用

重复的 tool 调用（循环）：

```
Iteration 1: Call Grep
Iteration 2: Call Grep (similar query)
Iteration 3: Call Grep (similar query)

Summary: "Executed similar grep queries N times
          with results: ..."
```

## 最佳实践

### 1. 清晰的 Task 描述

帮助 compaction 保留重要上下文：

✅ 好：
```
Task: "Fix critical security vulnerability in JWT validation.
       Tokens currently don't verify algorithm field.
       See CVE-2023-1234 for details."
```

❌ 差：
```
Task: "Fix security bug"
```

### 2. Checkpoint 完成

将 tasks/milestones 标记为完成：

✅ 好：
```
// Periodically:
TaskUpdate(task, status="completed")  // Clear checkpoint

// New task:
TaskCreate(task)  // Start fresh
```

❌ 差：
```
// One massive conversation:
User: "Do everything..."
// 200+ messages accumulate
// Hard to compact meaningfully
```

### 3. 为长任务使用 Subagents

委托给 subagents 以保持父 loop 清洁：

✅ 好：
```
Parent spawns:
  Subagent-1: "Analyze API"
  Subagent-2: "Analyze Database"

Parent compacts between spawns
Each subagent has fresh budget
```

❌ 差：
```
Single agent does everything
Message history grows unbounded
Compaction becomes very lossy
```

## 关键文件

| File | 目的 |
|------|---------|
| `src/services/compact/autoCompact.ts` | Compaction 触发逻辑 |
| `src/services/compact/compact.ts` | 核心 compaction 算法 |
| `src/services/compact/reactiveCompact.ts` | (experimental) 主动 compaction |
| `src/services/contextCollapse/` | (experimental) 积极 collapse |
| `src/query/tokenBudget.ts` | Token 跟踪和状态 |
| `src/query/transitions.ts` | 状态转换逻辑 |

## 另请参阅

- [Agent Loop](../core/agent-loop.md) - 触发 compaction 的地方
- [Tasks](../core/todowrite.md) - Compaction 期间的任务保存
- [Permissions](../../architecture/permissions.md) - 权限保存
- [Hooks System](../../architecture/application-state.md) - Compaction 事件
