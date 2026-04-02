# Skills System: 可重用的 Prompts 和 Tools

## 概述

Skills 是可重用的 prompt 模板,封装专门的工作流。它们可以:

- 由 Claude 或用户触发
- 使用参数自定义
- 从多个来源发现(本地、项目、MCP 服务器)
- 在隔离的 subagent 上下文中执行
- 与主代码分开维护

## 架构

```
用户/Claude 请求
        ↓
┌───────────────────────┐
│  Skill Tool 被调用    │
│  skill="write-tests"  │
│  args={ file: "..." } │
└───────┬───────────────┘
        ↓
┌─────────────────────────────┐
│ Skill 发现                  │
│ • 检查本地 ~/.claude/       │
│ • 检查项目 ./skills/        │
│ • 检查 MCP 服务器           │
└───────┬─────────────────────┘
        ↓
┌─────────────────────────────┐
│ 加载 Skill .md 文件         │
│ 解析 YAML frontmatter       │
│ 提取 prompt 内容            │
└───────┬─────────────────────┘
        ↓
┌─────────────────────────────────┐
│ 创建 Subagent 上下文            │
│ (如果未禁用 forked 模式)        │
│ 继承父级的能力                  │
└───────┬─────────────────────────┘
        ↓
┌─────────────────────────────┐
│ 在 Subagent 中执行          │
│ • Skill prompt 作为系统提示 │
│ • Args 作为消息注入         │
│ • 运行完整的 agent 循环     │
└───────┬─────────────────────┘
        ↓
┌─────────────────────────────┐
│ 将结果返回给调用者          │
│ Skill 输出/发现             │
└─────────────────────────────┘
```

## Skill 文件格式

Skills 存储为带有 YAML frontmatter 的 Markdown 文件:

```yaml
---
name: "write-unit-tests"
description: "Generate unit tests for a given file"
type: "prompt"
source: "user"
args: ["file", "test_framework"]
keywords: ["testing", "jest", "unit-tests"]
---

# Your Skill Prompt Here

You are an expert test writer. Your job is to:
1. Read the provided file
2. Understand its functionality
3. Write comprehensive unit tests

Focus on:
- Edge cases
- Error conditions
- Integration points

The user will provide:
- File path ({{ file }})
- Test framework ({{ test_framework }})

Start by reading the file and analyzing its structure.
```

### Frontmatter 字段

| 字段 | 类型 | 必需 | 用途 |
|-------|------|----------|---------|
| `name` | string | ✅ | 唯一的 skill 标识符 |
| `description` | string | ✅ | 人类可读的描述 |
| `type` | string | ✅ | "prompt" (其他类型未来支持) |
| `source` | string | | "bundled", "project", "user", "mcp" |
| `args` | array | | 要注入的参数名称 |
| `keywords` | array | | 搜索标签 |
| `mcpServers` | array | | 要启用的 MCP 服务器 |
| `forked` | boolean | | 在 subagent 中运行? (默认: true) |

## Skill 来源

### 1. 用户 Skills (`~/.claude/skills/`)

用户创建的本地存储的 skills:

```
~/.claude/skills/
├── write-unit-tests.md
├── refactor-function.md
├── debug-api.md
└── analyze-performance.md
```

### 2. 项目 Skills (`./claude_skills/`)

项目特定的 skills,提交到代码仓库:

```
./claude_skills/
├── setup-db.md
├── run-tests.md
├── deploy.md
└── code-review.md
```

### 3. 捆绑的 Skills

Claude Code 自带的 skills (内置):

```
src/tools/SkillTool/built-in/
├── tdd.md
├── systematic-debugging.md
├── brainstorming.md
└── ...
```

### 4. MCP Server Skills

由 Model Context Protocol 服务器提供的 skills:

```typescript
// MCP 服务器通过 ListPrompts RPC 暴露 skills:
{
  name: "analyze-logs",
  description: "Analyze application logs",
  arguments: [
    { name: "log_file", description: "Path to log" }
  ]
}
```

## Skill Tool 接口

`Skill` tool 执行 skills:

```typescript
// 输入 schema
{
  skill: string                    // Skill 名称
  args?: Record<string, string>   // 可选参数
}

// 示例
await Skill({
  skill: "write-unit-tests",
  args: {
    file: "src/api.ts",
    test_framework: "jest"
  }
})

// 返回
{
  status: "completed",
  output: "Generated tests...",
  // 完整的 subagent 执行详情
}
```

## Skill 执行流程

### 1. Skill 发现

系统按以下顺序搜索 skill:
1. **捆绑的 skills** - Claude Code 内置
2. **项目 skills** - `./claude_skills/*.md`
3. **用户 skills** - `~/.claude/skills/*.md`
4. **MCP skills** - 已连接的服务器 (通过 ListPrompts)

第一个匹配的获胜。项目可以覆盖内置 skills。

### 2. 参数注入

参数被注入到 skill prompt 中:

```markdown
---
name: "write-tests"
args: ["file", "framework"]
---

Write tests for: {{ file }}
Using framework: {{ framework }}
```

当使用以下参数调用时:
```typescript
await Skill({
  skill: "write-tests",
  args: { file: "app.ts", framework: "vitest" }
})
```

prompt 变成:
```
Write tests for: app.ts
Using framework: vitest
```

### 3. Subagent 执行

默认情况下,skills 在隔离的 subagents 中运行:

```typescript
// 内部实现 (如果 forked=true):
const subagent = createSubagent({
  name: "write-tests-skill",
  prompt: skillContent,
  parentBudget: currentBudget
})

await subagent.query({
  systemPrompt: skillContent,
  messages: [
    {
      role: "user",
      content: "Run this skill with args: " + JSON.stringify(args)
    }
  ]
})
```

### 4. 结果聚合

```typescript
// Subagent 完成,返回结果:
{
  status: "completed",
  sidechain: {
    messages: [...],      // 完整对话
    tokenUsage: {...}
  }
}
```

## 内置 Superpowers Skills

Claude Code 包含可通过 `/skill` 访问的专门 skills:

| Skill | 用途 | 调用方式 |
|-------|---------|-----------|
| `brainstorming` | 在实现前探索设计 | `/skill brainstorming` |
| `systematic-debugging` | 结构化调试流程 | `/skill systematic-debugging` |
| `test-driven-development` | TDD 工作流,先写测试 | `/skill test-driven-development` |
| `code-review` | 代码审查清单 | `/skill code-review` |
| `writing-plans` | 创建详细的实现计划 | `/skill writing-plans` |

### Superpower Skill: TDD

TDD skill 指导测试驱动开发:

```markdown
---
name: "test-driven-development"
description: "Write tests first, then implementation"
type: "prompt"
---

# Test-Driven Development Workflow

## Phase 1: Write Failing Tests
1. Understand requirements
2. Write minimal test that fails
3. Verify test fails for right reason

## Phase 2: Write Minimal Implementation
1. Write simplest code to pass test
2. No over-engineering
3. Code passes test

## Phase 3: Refactor
1. Improve code quality
2. Don't change behavior
3. Tests still pass

## Phase 4: Repeat
For each new feature, repeat phases 1-3
```

## 创建自定义 Skills

### 基础 Skill 模板

```markdown
---
name: "my-skill"
description: "What this skill does"
type: "prompt"
args: ["arg1", "arg2"]
keywords: ["keyword1", "keyword2"]
---

# My Custom Skill

You are a specialist in [domain].

Your task is to [goal].

The user will provide:
- arg1 ({{ arg1 }})
- arg2 ({{ arg2 }})

## Process

1. First step: [...]
2. Second step: [...]
3. Final step: [...]

## Deliverables

You should produce:
- [output1]
- [output2]
```

### 高级: 带 MCP 服务的 Skill

```markdown
---
name: "database-analyzer"
description: "Analyze database performance"
mcpServers: ["database-inspector"]
args: ["database_url", "query"]
---

# Database Performance Analysis

Using the database-inspector MCP service, analyze the provided query.

Database: {{ database_url }}
Query: {{ query }}

Steps:
1. Connect to database (via MCP)
2. Explain execution plan
3. Identify bottlenecks
4. Suggest optimizations
```

## Skill 发现与搜索

### 本地发现

自动发现本地 skills:

```typescript
// 启动时扫描:
// 1. ~/.claude/skills/*.md
// 2. ./claude_skills/*.md
// 3. 内置 skills

// 结果: 可用的 skills 暴露给 Claude
```

### 目录配置

控制 skill 搜索路径:

```bash
# 环境变量
export CLAUDE_CODE_SKILL_DIRS="~/.claude/skills:./my-skills:./src/prompts"

# 按顺序搜索,第一个匹配的获胜
```

## 非 Forked Skills

默认情况下,skills 在 subagent 上下文中运行 (forked=true)。要在父上下文中运行:

```markdown
---
name: "quick-calc"
forked: false
---

Simple calculation skill that runs inline.
```

**何时使用 forked=false:**
- ❌ 简单、快速的操作 (开销不值得)
- ❌ 需要修改父级状态
- ✅ 大多数 skills 应该是 forked 的 (隔离)

## Skill 组合

Skills 可以调用其他 skills:

```markdown
---
name: "full-feature"
description: "Implement complete feature"
---

# Full Feature Implementation

1. First, run the planning skill:
   Invoke skill "writing-plans" with feature requirements

2. Then, implement using TDD:
   Invoke skill "test-driven-development"

3. Finally, get code review:
   Invoke skill "superpowers:code-review"

Combine results into final feature.
```

## 参数与变量

### 模板变量

使用 `{{ variableName }}` 进行参数注入:

```markdown
Fix the bug in {{ file }} with error: {{ error_message }}

The issue is: {{ issue_description }}
```

### 可选参数

对可选参数使用条件部分:

```markdown
{{#if testFramework}}
Write tests using: {{ testFramework }}
{{else}}
Choose an appropriate testing framework
{{/if}}
```

## Skill 权限

Skills 继承父 agent 的权限:

```
用户授予权限给 Agent A
    ↓
Agent A 生成 Skill B
    ↓
Skill B 继承 Agent A 的权限
    ↓
Skill 可以访问 Agent A 能访问的内容
```

**注意:** 每个在 subagent 上下文中的 skill 都是隔离的,但继承权限上下文。

## 性能优化

### Skills 中的 Prompt Caching

Skills 受益于 prompt caching:

```
第一次 skill 执行:
  父系统 prompt: 2000 tokens
  Skill 系统 prompt: 1500 tokens
  总计: 3500 tokens

第二次 skill 执行:
  父 cache: 重用 (0 tokens)
  Skill cache: 重用 (0 tokens)
  额外: 仅新内容
  总计: ~400 tokens (节省 88%!)
```

### Skill 重用

定义一次,多次使用:

```
write-tests skill:
  - 用于 Python 文件
  - 用于 JavaScript 文件
  - 用于 Go 文件

相同的 skill 模板,不同的 args → 高效
```

## 使用场景

### 1. 调试工作流

```markdown
---
name: "systematic-debug"
---

# Systematic Debugging Process

1. Understand the error
2. Reproduce the issue
3. Narrow down the problem
4. Identify root cause
5. Verify fix
6. Ensure no regressions
```

### 2. 代码审查清单

```markdown
---
name: "code-review"
args: ["pr_url"]
---

# Code Review Process

Reviewing: {{ pr_url }}

- [ ] Code style consistent?
- [ ] Tests present and passing?
- [ ] Documentation updated?
- [ ] No security issues?
- [ ] Performance acceptable?
```

### 3. 功能规划

```markdown
---
name: "feature-plan"
args: ["feature_description"]
---

# Feature Planning Workflow

Feature: {{ feature_description }}

## Requirements Analysis
- Parse requirements
- Identify scope
- List acceptance criteria

## Architecture Design
- Design data model
- Design API endpoints
- Design UI components

## Implementation Plan
- Break into tasks
- Estimate effort
- Order by dependency
```

## 关键文件

| 文件 | 用途 |
|------|---------|
| `src/tools/SkillTool/SkillTool.ts` | Skill tool 实现 |
| `src/tools/SkillTool/built-in/` | 捆绑的 skills |
| `src/commands.ts` | Skill 发现和加载 |

## 另请参阅

- [Subagents](./subagents.md) - Skills 在 subagents 中运行
- [Agent Loop](../core/agent-loop.md) - Skills 如何集成
- [Tool Use](../core/tool-use.md) - Skills 作为 tools
- [Autonomous Agents](../agents/autonomous-agents.md) - 自动调用 skills
