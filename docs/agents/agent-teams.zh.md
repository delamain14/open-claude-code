# Agent Teams: 多 Agent 协作

## 概述

Agent Teams (Swarms) 允许多个 agent 在一个项目上协作:

- **Team Lead** (队列主管) 协调工作
- **Teammates** (工作者) 并行执行任务
- **Shared Tasks** 对所有成员可见
- **Synchronized Permissions** 由 team lead 管理
- **Message Mailbox** 用于 agent 间通信

## 关键文件

| File | 目的 |
|------|---------|
| `src/tools/TeamCreateTool/` | 创建/管理团队 |
| `src/tools/TeamDeleteTool/` | 删除团队 |
| `src/utils/swarm/teamHelpers.ts` | 团队工具 |
| `src/utils/swarm/permissionSync.ts` | 权限同步 |
| `src/utils/swarm/leaderPermissionBridge.ts` | Lead 权限桥接 |
| `src/utils/swarm/reconnection.ts` | 会话恢复 |
| `src/utils/swarm/inProcessRunner.ts` | 进程内执行 |
| `src/utils/swarm/teammateInit.ts` | Teammate 初始化 |
| `src/utils/swarm/teammateMailbox.ts` | 消息队列系统 |

## 另请参阅

- [Team Protocols](./team-protocols.md) - Agent 间通信
- [Agent Loop](../core/agent-loop.md) - 单个 agent 执行
- [Tasks](../core/todowrite.md) - 共享任务管理
- [Background Tasks](../tasks/background-tasks.md) - 异步 teammate 执行
