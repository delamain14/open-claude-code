# Context Compaction: 管理对话历史

## 概述

Context Compaction 是对话历史的自动压缩,防止超过 token 预算限制。它允许通过智能总结已完成的工作,同时保留最近的上下文和任务状态来实现无限的对话长度。

## 问题: Token 预算限制

Agent 循环在 token 预算内运行(通常 100k-200k tokens):

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
