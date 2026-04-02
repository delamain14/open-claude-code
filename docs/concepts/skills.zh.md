# Skills System: 可重用的 Prompts 和 Tools

## 概述

Skills 是可重用的 prompt 模板,封装专门的工作流。它们可以:

- 由 Claude 或用户触发
- 使用参数自定义
- 从多个来源发现(本地、项目、MCP 服务器)
- 在隔离的 subagent 上下文中执行
- 与主代码分开维护

## 关键文件

| File | 目的 |
|------|---------|
| `src/tools/SkillTool/SkillTool.ts` | Skill tool 实现 |
| `src/tools/SkillTool/built-in/` | 捆绑的 skills |
| `src/commands.ts` | Skill 发现和加载 |

## 另请参阅

- [Subagents](./subagents.md) - Skills 在 subagents 中运行
- [Agent Loop](../core/agent-loop.md) - Skills 如何集成
- [Tool Use](../core/tool-use.md) - Skills 作为 tools
- [Autonomous Agents](../agents/autonomous-agents.md) - 自动调用 skills
