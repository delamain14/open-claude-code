# Subagents: 创建隔离的 Agents

## 概述

Subagents 是由父 agent 生成的隔离 agents,用于委托专门的任务。与主 agent 不同,subagents:

- 在同一进程中运行(快速、低开销)
- 通过 `AsyncLocalStorage` 具有隔离的上下文
- 执行自己完整的 agent 循环
- 与父级共享 prompt 缓存(更便宜的 tokens)
- 可以通过 `SendMessage` 恢复
- 可以生成更多 subagents(无限嵌套)

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
