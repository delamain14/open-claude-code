# TodoWrite 和 V2 Task System

## 概述

Claude Code V2 提供了一个全面的任务管理系统,具有持久化存储、依赖跟踪和多 agent 支持。虽然名称 "TodoWrite" 引用了早期的 todo 管理,现代实现是提供完整功能的 **V2 Task System** 任务数据库。

## 关键文件

| File | 目的 |
|------|---------|
| `src/utils/tasks.ts` | 核心任务系统实现 |
| `src/tools/TaskListTool/` | 列表任务 |
| `src/tools/TaskCreateTool/` | 创建任务 |
| `src/tools/TaskGetTool/` | 获取单个任务 |
| `src/tools/TaskUpdateTool/` | 更新任务 |
| `src/utils/swarm/taskNotification.ts` | 任务状态事件 |

## 另请参阅

- [Tasks (Advanced)](../tasks/background-tasks.md) - 后台任务执行
- [Autonomous Agents](../agents/autonomous-agents.md) - 使用任务的 agent 团队
- [Agent Teams](../agents/agent-teams.md) - 团队任务共享
- [Subagents](../concepts/subagents.md) - 每个 agent 的任务隔离
