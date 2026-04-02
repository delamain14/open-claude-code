# Worktree + Task Isolation: 隔离的开发环境

## 概述

Git worktrees 为每个 agent 会话提供隔离的开发环境。这允许:

- 在不同的分支上并行工作而不干扰
- 关注点的清晰分离(每个功能一个 worktree)
- 安全的实验而不影响主工作区
- 每个会话的 git 状态隔离
- 轻松的清理和恢复

## 关键文件

| File | 目的 |
|------|---------|
| `src/utils/worktree.ts` | Worktree git 操作 |
| `src/tools/EnterWorktreeTool/` | 进入 worktree |
| `src/tools/ExitWorktreeTool/` | 退出 worktree |
| `src/utils/sessionStorage.ts` | 会话状态(worktree 路径) |
| `src/utils/worktreeModeEnabled.ts` | Feature gate |
| `src/hooks/useSessionBackgrounding.ts` | 会话管理 |

## 另请参阅

- [Background Tasks](../tasks/background-tasks.md) - Task 执行
- [Agent Teams](./agent-teams.md) - 团队协调
- [Autonomous Agents](./autonomous-agents.md) - 自动生成
- [Task System](../core/todowrite.md) - Task 隔离
