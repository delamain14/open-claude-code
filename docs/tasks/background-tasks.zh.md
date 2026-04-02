# Background Tasks: 异步操作执行

## 概述

Background Tasks 允许长时间运行的操作执行而不阻止主 agent。用户可以:

- 使用 Ctrl+B 生成任务
- 继续在新会话中工作
- 监控任务进度
- 准备就绪时检索结果

## 关键文件

| File | 目的 |
|------|---------|
| `src/Task.ts` | Task 类型定义 |
| `src/utils/task/framework.ts` | Task 执行框架 |
| `src/utils/backgroundHousekeeping.ts` | 清理/监控 |
| `src/hooks/useSessionBackgrounding.ts` | 会话后台处理 |
| `src/tools/TaskOutputTool/` | 获取任务输出 |
| `src/tools/KillShellTool/` | 终止任务 |

## 另请参阅

- [Tasks (V2 System)](../core/todowrite.md) - 任务管理
- [Agent Teams](./agent-teams.md) - 后台 teammate 执行
- [Worktrees](./worktree-isolation.md) - 隔离执行环境
