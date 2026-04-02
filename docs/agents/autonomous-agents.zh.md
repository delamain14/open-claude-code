# Autonomous Agents: 自主操作

## 概述

Autonomous Agents 通过自动决策以最少的人工干预运行:

- **Coordinator Pattern** - 一个 agent 协调多个 workers
- **Permission Automation** - 规则自动批准/拒绝安全操作
- **Plan Mode** - Agents 创建并执行自己的计划
- **Classifier-Based Safety** - ML 评估操作安全性
- **Swarm Execution** - 多个 agents 并行朝目标工作

## 关键文件

| File | 目的 |
|------|---------|
| `src/coordinator/coordinatorMode.ts` | Coordinator 模式 |
| `src/utils/permissions/yoloClassifier.ts` | ML classifier |
| `src/tools/EnterPlanModeTool/` | Plan 模式进入 |
| `src/tools/ExitPlanModeTool/` | Plan 模式退出 |
| `src/tools/AgentTool/` | Subagent 生成 |

## 另请参阅

- [Agent Loop](../core/agent-loop.md) - 基本执行
- [Subagents](../concepts/subagents.md) - Agent 生成
- [Agent Teams](./agent-teams.md) - 团队协调
- [Permissions](../../architecture/permissions.md) - 权限系统
