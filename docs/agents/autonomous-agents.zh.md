# Autonomous Agents: 自主操作

## 概述

Autonomous Agents 通过自动决策以最少的人工干预运行:

- **Coordinator Pattern** - 一个 agent 协调多个 workers
- **Permission Automation** - 规则自动批准/拒绝安全操作
- **Plan Mode** - Agents 创建并执行自己的计划
- **Classifier-Based Safety** - ML 评估操作安全性
- **Swarm Execution** - 多个 agents 并行朝目标工作

## 架构

```
┌──────────────────────────────────────────────┐
│      Main User Prompt: "Build feature X"    │
└──────────────────────┬───────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │  Coordinator Agent (Lead)    │
        │                              │
        │  Strategy:                   │
        │  1. Research problem         │
        │  2. Design solution          │
        │  3. Delegate implementation  │
        │  4. Verify results           │
        └──────────────────┬───────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │  Spawn Worker Agents (Parallel)     │
        │  ├─ Researcher (explore)            │
        │  ├─ Implementer (code)              │
        │  └─ Tester (verify)                 │
        └──────────────────┬───────────────────┘
                           ↓
        ┌─────────────────────────────────────┐
        │  Each Agent Autonomously:           │
        │  • Makes decisions (classifier)     │
        │  • Gets auto-approved permissions   │
        │  • Executes tools                   │
        │  • Reports back                     │
        └──────────────────┬──────────────────┘
                           ↓
        ┌──────────────────────────────┐
        │  Coordinator Synthesizes     │
        │  All findings & decisions    │
        │  Returns final result        │
        └──────────────────────────────┘
```

## 自主机制

### 1. Coordinator Pattern

一个 agent 协调多个专业 agents:

```typescript
// Coordinator System Prompt
你是一个项目协调者。你的工作是:

1. 理解用户的目标
2. 将其分解为子任务
3. 为每个子任务生成专业 agents
4. 协调它们的工作
5. 整合它们的结果
6. 呈现最终解决方案

可用工具:
- Agent: 生成 subagents (researcher, coder, tester 等)
- SendMessage: 检查 subagents，获取更新
- Task*: 创建/跟踪工作项

流程:
1. Research: "查找当前实现模式"
   → 生成 researcher agent
   → 让它探索代码库

2. Plan: "创建实现计划"
   → 获取 researcher 发现
   → 创建详细计划

3. Implement: "构建功能"
   → 生成 implementer agent
   → 监控进度

4. Test: "验证功能"
   → 生成 tester agent
   → 获取测试结果

5. Integration: "确保组件协同工作"
   → 审查所有结果
   → 做出集成决策

6. Deliver: "呈现解决方案"
   → 总结完成的工作
   → 向用户返回解决方案
```

### 2. Permission Automation

权限自动批准/拒绝，无需用户干预:

```typescript
// Permission Rules (定义一次)
{
  rules: [
    // 自动允许安全操作
    {
      toolName: "Read",
      behavior: "allow"              // 始终允许读取
    },
    {
      toolName: "Bash",
      operation: "view",
      pattern: "ls, cat, grep",
      behavior: "allow"              // 安全的只读 bash
    },

    // 拒绝危险操作
    {
      toolName: "Bash",
      operation: "execute",
      pattern: "rm, kill, reboot",
      behavior: "deny"               // 永不运行破坏性操作
    },

    // 针对特定安全上下文自动允许
    {
      toolName: "Edit",
      pathPattern: "src/**",
      fileSize: { maxBytes: 100000 }, // 仅小文件
      behavior: "allow"               // 安全编辑
    },

    // 对不确定的情况使用 classifier
    {
      toolName: "Edit",
      pathPattern: "tests/**",
      behavior: "classify"            // ML 决定
    }
  ]
}

// 当工具被调用时:
// 1. 按顺序检查规则
// 2. 第一个匹配 → 应用行为
// 3. allow → 执行
// 4. deny → 拒绝
// 5. classify → 使用 ML classifier
```

### 3. ML Classifier (YOLO Mode)

基于 ML 的安全 classifier，用于不确定的操作:

```typescript
// YOLO Classifier 评估:
function classifyToolCall(tool, input, context) {
  const signals = {
    // 低风险信号
    + isReadOnlyOperation: input.tool === "Read",
    + isKnownSafeOperation: input.operation in ["ls", "grep"],
    + hasValidationChecks: schema.validateInput(input),

    // 高风险信号
    - isDestructiveOperation: input.command includes "rm",
    - modifiesSystemFiles: input.path.startsWith("/etc/"),
    - executesWithElevation: input.sudo === true,
    - accessesSecrets: input.path.includes("secret"),

    // 上下文信号
    + hasBeenAllowedBefore: input.path in approvedPaths,
    + isInTestContext: context.isRunningTests,
    - isFirstTime: newOperation,
    - userWarningLevel: isHighRisk
  }

  // 分数: 信号总和
  confidence = calculateConfidence(signals)

  // 阈值
  if (confidence > 0.85) {
    return "allow"     // 高置信度: 自动批准
  } else if (confidence < 0.35) {
    return "deny"      // 低置信度: 自动拒绝
  } else {
    return "ask_user"  // 中等置信度: 提示用户
  }
}
```

### 4. Plan Mode

Agents 在实现前创建详细计划:

```
用户: "实现用户认证"

Agent 在 Plan Mode 中:
  1. 分析需求
  2. 研究现有代码
  3. 设计解决方案
  4. 创建分步计划:
     ```
     ## 实现计划

     ### 阶段 1: 基础设施
     步骤 1.1: 创建 User 表
       文件: migrations/001_create_users.sql
       详情: schema 包含 email, password_hash, created_at

     步骤 1.2: 创建 JWT middleware
       文件: src/middleware/auth.ts
       详情: 验证 tokens，附加到 request

     ### 阶段 2: API Endpoints
     步骤 2.1: POST /auth/signup
       文件: src/routes/auth.ts
       Endpoint: 接受 email/password，hash，存储
     ...
     ```

  4. 提交计划给用户审查:
     [批准] [请求更改] [取消]

  5. 用户批准

  6. 逐步执行计划:
     - 对于每个步骤: 创建任务
     - 生成 worker agents
     - 整合结果
     - 验证完整性
```

### 5. 自主决策

Agents 在没有用户输入的情况下做出决策:

```
查询执行循环:
  迭代 1:
    工具调用: Read file
    检查权限: allowed (自动规则)
    立即执行
    无用户提示

  迭代 2:
    工具调用: Edit file
    检查权限: 需要 classify
    ML classifier 评分: 0.92 (高置信度)
    立即执行
    无用户提示

  迭代 3:
    分析结果
    计划下一步
    生成 subagent
    继续自主运行

  迭代 N:
    最终综合
    向用户返回结果
```

## 用例

### 1. 功能实现 (Coordinator)

```
用户: "添加暗黑模式支持"

Coordinator Agent:
  1. 生成 researcher:
     "分析当前主题系统"
     → 发现: CSS variables, Tailwind config 等

  2. 生成 designer:
     "设计暗黑模式实现"
     → 创建: 暗色方案、图标等计划

  3. 生成 implementer:
     "根据设计实现暗黑模式"
     → 创建: CSS, 切换按钮, localStorage

  4. 生成 tester:
     "跨浏览器测试暗黑模式"
     → 验证: 对比度、性能、UX

  5. 整合所有结果:
     → 合并代码
     → 运行测试
     → 生成摘要

结果: 完整的暗黑模式功能，自主实现
```

### 2. Bug 调查 (Autonomy)

```
用户: "应用在登录时崩溃"

Autonomous Agent:
  1. 收集复现信息
     (自动允许: Read logs, check configs)

  2. 分析错误签名
     (自动允许: Grep for error patterns)

  3. 检查相关代码
     (自动允许: Read source files)

  4. 识别根本原因
     (由 classifier 做出决策)

  5. 提出修复
     (自动允许: 在隔离测试文件中创建修复)

  6. 验证修复
     (自动允许: Run tests)

结果: Bug 已修复，全部自主完成 (用户只看到结果)
```

### 3. 多专家 Swarm

```
用户: "为用户管理构建 REST API"

Coordinator 生成团队:
  - Database Specialist: 设计 schema
  - Backend Specialist: 实现 endpoints
  - Test Specialist: 编写测试
  - Documentation Specialist: 编写 API 文档

每个人自主工作:
  - 在其领域内做出决策
  - 遵循自动批准规则
  - 报告进度
  - 与其他人集成

Coordinator 监控:
  - 跟踪任务完成情况
  - 解决跨团队冲突
  - 合并所有结果
```

## 实现细节

### Coordinator System Prompt 注入

```typescript
// 在父 agent 执行中:
const coordinatorPrompt = `
你是一个项目协调 agent。你的角色是:

1. **理解**: 解析用户请求
2. **计划**: 分解为子任务
3. **委派**: 生成专业 agents
4. **监控**: 跟踪进度
5. **整合**: 组合结果
6. **交付**: 呈现解决方案

可用 agents:
- general-purpose: 用于通用任务
- explorer: 用于代码研究
- verifier: 用于测试
- plan-agent: 用于规划

你的工作流程:
步骤 1: 分析任务
  → 读取相关文件
  → 理解约束
  → 识别专家需求

步骤 2: 创建计划
  → 列出子任务
  → 识别依赖关系
  → 估算工作量

步骤 3: 生成 agents
  对于每个任务:
    agent = Agent({
      description: "...",
      subagent_type: "appropriate-type"
    })
    results[task] = agent

步骤 4: 整合
  → 组合所有结果
  → 解决任何冲突
  → 创建统一解决方案

步骤 5: 验证
  → 确保完整性
  → 检查质量
  → 解决差距

步骤 6: 交付
  → 总结过程
  → 呈现最终结果
  → 提供后续步骤

记住: 自主工作，做出安全决策，
自由使用工具，慷慨生成 agents。
`
```

### 自动批准规则

```typescript
// 自主 agents 的权限规则
const autonomousRules = [
  // 读取文件 - 始终 OK
  { toolName: "Read", behavior: "allow" },
  { toolName: "Glob", behavior: "allow" },
  { toolName: "Grep", behavior: "allow" },

  // 编写测试 - 始终 OK
  {
    toolName: "Write",
    pathPattern: "**/*.test.ts",
    behavior: "allow"
  },

  // Bash 只读操作 - 始终 OK
  {
    toolName: "Bash",
    commandPattern: ["ls", "cat", "grep", "git log"],
    behavior: "allow"
  },

  // 编辑已知文件 - OK
  {
    toolName: "Edit",
    pathPattern: ["src/**", "tests/**"],
    behavior: "allow"
  },

  // 危险操作 - 始终拒绝
  {
    toolName: "Bash",
    commandPattern: ["rm -rf", "reboot", "sudo"],
    behavior: "deny"
  },

  // 不确定的情况 - 使用 classifier
  {
    behavior: "classify"  // 默认回退
  }
]
```

## 配置

### 启用自主性

```bash
# Feature flags
export CLAUDE_AUTONOMOUS_AGENTS=true
export CLAUDE_AUTO_PERMISSION=true
export CLAUDE_CLASSIFIER_MODE=true

# 或每个会话
claude-code --autonomous --auto-permission
```

### Coordinator Mode

```bash
# 自动生成 coordinator agent
claude-code --coordinator-mode "Build feature X"

# 或手动调用
/skill coordinating-agents
```

## 安全考虑

### 1. 范围限制

Autonomous agents 在定义的范围内操作:
- 特定项目目录
- 特定文件模式 (src/**, tests/**)
- 特定工具白名单 (Read, Bash view 等)

### 2. 权限边界

即使具有自主性，权限仍受尊重:
- 不能写入 /etc/
- 不能执行 rm/reboot
- 不能访问 secrets
- 所有操作都由权限规则检查

### 3. 人工覆盖

用户可以:
- 随时中断 agent (Ctrl+C)
- 在执行前审查计划 (Plan Mode)
- 设置更严格的权限规则
- 要求对任何高风险操作进行提示

### 4. 审计跟踪

所有自主决策都被记录:
- 调用了哪个工具
- 应用了什么权限规则
- 授予/拒绝了什么权限
- 谁/什么做出了决策

## 最佳实践

### 1. 对复杂任务使用 Coordinator

✅ 好:
```
复杂任务: "使用新错误处理重构 API 层"
→ 使用 coordinator 分解为子任务
→ 为每个部分生成专家
→ 每个人自主工作
```

❌ 坏:
```
简单任务: "读取此文件并告诉我它做什么"
→ 单个 agent，不需要 coordinator
→ 更简单更快
```

### 2. 对重大更改启用 Plan Mode

✅ 好:
```
重大重构:
1. 进入 Plan Mode
2. Agent 创建计划
3. 与团队审查计划
4. 批准
5. Agent 自主执行
```

❌ 坏:
```
没有计划的重大更改
→ 不协调的工作
→ 返工和冲突
```

### 3. 设置清晰的权限边界

✅ 好:
```
自主权限:
- 可以编辑: src/**, tests/**
- 可以执行: npm test, npm build
- 不能: rm, ssh, sudo
```

❌ 坏:
```
所有权限自动批准
→ 意外损坏的风险
→ 没有安全检查
```

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
