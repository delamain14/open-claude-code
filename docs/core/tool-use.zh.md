# Tool Use System

## 概述

Tool Use System 是 Claude Code 公开能力并从 Claude 接收指令的机制。Tools 是 Claude 在系统中采取行动的主要界面 - 执行命令、读取文件、调用 APIs、生成 agents 等等。

## 关键文件

| File | 目的 |
|------|---------|
| `src/Tool.ts` | Tool 接口和基础实现 |
| `src/tools/BashTool/` | Shell 命令执行 |
| `src/tools/FileReadTool/` | 文件读取 |
| `src/tools/FileEditTool/` | 文件中的文本替换 |
| `src/tools/GrepTool/` | 内容搜索 |
| `src/tools/AgentTool/` | Subagent 生成 |
| `src/tools/SkillTool/` | Skill 执行 |
| `src/tools/TaskListTool/` | 任务管理 |
| `src/hooks/toolPermission/` | 权限检查 |

## 另请参阅

- [Agent Loop](./agent-loop.md) - Tools 在主循环中如何被调用
- [Subagents](../concepts/subagents.md) - Agent Tool 详情
- [Skills](../concepts/skills.md) - Skill Tool 机制
- [Tasks](../tasks/tasks.md) - Task tool 生态系统
- [Permissions](../../architecture/permissions.md) - 权限系统详情
