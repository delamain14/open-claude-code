# TodoWrite 和 V2 Task System

## 概述

Claude Code V2 提供了一个全面的任务管理系统,具有持久化存储、依赖跟踪和多 agent 支持。虽然名称 "TodoWrite" 引用了早期的 todo 管理,现代实现是提供完整功能的 **V2 Task System** 任务数据库。

## Task System 架构

```
┌──────────────────────────────────────────┐
│  User/Agent Creates/Updates Task         │
│  (TaskCreate, TaskUpdate, TaskDelete)    │
└──────────────────┬───────────────────────┘
                   ↓
        ┌──────────────────────────┐
        │ V2 Task API (tasks.ts)   │
        │ • Validation             │
        │ • File system locking    │
        │ • ID generation          │
        └──────────────┬───────────┘
                       ↓
        ┌──────────────────────────────────┐
        │ File System Storage              │
        │ ~/.claude/tasks/{sessionId}/     │
        │ ~/.claude/teams/{teamName}/      │
        │                                   │
        │ Structure:                        │
        │ ├── .lock (concurrency control)  │
        │ ├── .highwatermark (next ID)     │
        │ └── {taskId}.json (task data)   │
        └──────────────────────────────────┘
```

## Task 数据模型

### Task 对象

```typescript
interface Task {
  id: string                          // 唯一标识符 (自动递增)
  subject: string                     // 任务标题 (祈使句形式)
  description: string                 // 详细需求
  activeForm?: string                 // 进行时形式用于 spinner
  owner?: string                      // Agent ID 或 agent 名称
  status: 'pending' | 'in_progress' | 'completed'
  blocks: string[]                    // 此任务阻塞的 task ID
  blockedBy: string[]                 // 阻塞此任务的 task ID
  metadata?: Record<string, unknown>  // 任意自定义数据
}
```

### Status 工作流

```
    ┌──────────┐
    │ pending  │  初始状态
    └────┬─────┘
         │ agent 认领任务
         ↓
    ┌──────────────┐
    │ in_progress  │  Agent 工作中
    └────┬─────────┘
         │ agent 完成
         ↓
    ┌──────────┐
    │ completed│  最终状态 (不可变)
    └──────────┘
```

### Task Metadata 示例

Task 可以存储任意 metadata 用于专门的工作流:

```typescript
// 示例: 规划工作流
{
  id: "1",
  subject: "Implement user authentication",
  metadata: {
    priority: "high",
    estimate_hours: 8,
    skills_required: ["auth", "database"],
    related_issues: ["issue#123", "issue#456"]
  }
}

// 示例: Review 任务
{
  id: "2",
  subject: "Code review of PR#789",
  metadata: {
    pr_url: "https://github.com/.../pull/789",
    reviewer: "agent-xyz",
    approval_required: true
  }
}
```

## Task 依赖关系

Task 可以形成依赖图来表达阻塞关系:

```
Task A (blocked by Task B, Task C)
  ↑
  └─ blockedBy: ["B", "C"]

Task B
  ├─ blocks: ["A"]  (B 阻塞 A)

Task C
  ├─ blocks: ["A"]  (C 阻塞 A)

  B 和 C 都必须完成后 A 才能开始
```

### 依赖查询

```typescript
// 获取所有阻塞某个任务的 task
task.blockedBy  // ["B", "C"]

// 获取此任务阻塞的所有 task
task.blocks     // ["A"]

// 检查任务是否可以开始
isBlocked(taskId) // 返回 boolean
```

## File System 存储

### 存储位置

**Session Tasks:**
```
~/.claude/tasks/
├── {sessionId1}/
│   ├── .lock              # 并发锁
│   ├── .highwatermark     # 下一个要分配的 ID
│   ├── 1.json            # Task 1
│   ├── 2.json            # Task 2
│   └── N.json            # Task N
└── {sessionId2}/
    └── ...
```

**Team Tasks:**
```
~/.claude/teams/{teamName}/
├── team.json              # Team metadata
├── tasks/                 # (隐式位置)
│   ├── .lock
│   ├── .highwatermark
│   └── {taskId}.json
└── ...
```

### Task 文件格式

每个 task 存储为 JSON (示例: `1.json`):

```json
{
  "id": "1",
  "subject": "Fix authentication bug",
  "description": "JWT tokens expire after 30 minutes. Need to implement refresh token mechanism.",
  "activeForm": "Fixing authentication bug",
  "status": "in_progress",
  "owner": "agent-xyz@my-team",
  "blocks": [],
  "blockedBy": [],
  "metadata": {
    "created_at": 1712000000000,
    "updated_at": 1712001000000,
    "priority": "high"
  }
}
```

### High-Water Mark

`.highwatermark` 文件跟踪下一个要分配的 task ID:

```
1  # 下一个 task ID 是 2
```

这使得可以简单地自动递增 ID 而不会发生冲突。

## Task 管理工具

### TaskCreateTool

创建新任务:

```typescript
// 输入 schema
{
  subject: string              // 必需
  description: string          // 必需
  activeForm?: string         // 可选
  metadata?: object           // 可选自定义数据
}

// 示例
const result = await TaskCreate({
  subject: "Run tests",
  description: "Execute test suite to verify all features",
  activeForm: "Running tests",
  metadata: { test_framework: "jest" }
})

// 返回
{
  id: "1",
  subject: "Run tests",
  // ... 完整的 task 对象
}
```

**行为:**
- 自动分配唯一 ID
- Status 默认为 `pending`
- Owner 未设置 (可以稍后认领)
- 在 task 目录中创建 task 文件

### TaskListTool

列出符合条件的任务:

```typescript
// 输入 schema (全部可选)
{
  // 无参数 - 列出所有任务
}

// 返回
[
  {
    id: "1",
    subject: "Fix auth bug",
    status: "in_progress",
    owner: "agent-xyz",
    blockedBy: [],
    blocks: []
  },
  {
    id: "2",
    subject: "Write tests",
    status: "pending",
    owner: undefined,
    blockedBy: ["1"],  // 被 task 1 阻塞
    blocks: []
  }
]
```

**过滤 (隐式):**
- UI 突出显示 pending/in_progress
- 可视化显示阻塞状态
- 允许 owner 过滤

### TaskGetTool

检索单个任务的完整详情:

```typescript
// 输入 schema
{
  taskId: string  // 必需
}

// 返回
{
  id: "1",
  subject: "Fix auth bug",
  description: "JWT tokens expire too quickly...",
  activeForm: "Fixing authentication bug",
  status: "in_progress",
  owner: "agent-xyz",
  blocks: [],
  blockedBy: [],
  metadata: { /* 自定义数据 */ }
}
```

### TaskUpdateTool

更新任务字段:

```typescript
// 输入 schema (至少需要一个字段)
{
  taskId: string                    // 必需
  status?: 'pending' | 'in_progress' | 'completed'
  subject?: string                  // 更新标题
  description?: string              // 更新描述
  activeForm?: string               // 更新 spinner 文本
  owner?: string                    // 分配给 agent
  metadata?: Record<string, unknown> // 合并 metadata
  addBlocks?: string[]              // 要阻塞的 task ID
  addBlockedBy?: string[]           // 被阻塞的 task ID
}

// 示例: Agent 认领任务
await TaskUpdate({
  taskId: "1",
  status: "in_progress",
  owner: "agent-xyz"
})

// 示例: 建立依赖关系
await TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"]  // Task 2 现在依赖于 task 1
})

// 示例: 完成任务
await TaskUpdate({
  taskId: "1",
  status: "completed"
})
```

### TaskDeleteTool (隐式)

虽然没有显式的删除工具,但可以通过以下方式删除任务:
- 设置 `status: "deleted"` (软删除)
- 或从存储中删除 task 文件

## 并发与锁定

### File System 锁定

多个 agent 可以同时访问任务。锁定防止损坏:

```typescript
// 锁获取 (带重试)
function acquireLock(taskDir: string, maxRetries: number = 10)
  // 1. 检查 .lock 文件是否存在
  // 2. 如果存在且年龄 < 超时: 等待 100ms, 重试
  // 3. 如果不存在或过期: 创建 .lock 文件
  // 4. 返回锁定状态

// 锁释放
function releaseLock(taskDir: string)
  // 1. 删除 .lock 文件
  // 2. 其他等待的 agent 现在可以继续
```

### 并发保证

- **多个读取者**: OK (读取 task 文件)
- **单个写入者**: 强制执行 (通过锁)
- **读取者 + 写入者**: 串行化 (写入者等待锁)
- **超时**: 默认 5 秒 (防止死锁)

## 与 Agent Loop 集成

在 agent loop 期间通过工具访问任务:

```
Query Loop 迭代:
  1. 检查可用任务: TaskList
  2. 认领任务: TaskUpdate (status="in_progress", owner=agentId)
  3. 处理任务...
  4. 更新进度: TaskUpdate (metadata.progress=50%)
  5. 完成任务: TaskUpdate (status="completed")
  6. 下一次迭代: TaskList → 获取下一个 pending 任务
```

## 与 Teams 集成

在 team 环境中,任务是共享的:

1. **Team Lead** 创建共享任务列表
   ```typescript
   TaskCreate({
     subject: "Refactor authentication",
     description: "Update auth module for security",
     // 存储在 team task 目录中
   })
   ```

2. **Teammates** 认领并处理任务
   ```typescript
   TaskUpdate({
     taskId: "1",
     owner: "teammate-agent@team-name"  // 完整的 agent ID
   })
   ```

3. **Team Lead** 监控进度
   ```typescript
   TaskList()  // 显示所有 team 任务及当前状态
   ```

## 最佳实践

### Task 命名

任务 subject 使用祈使句形式:

✅ 好的:
- "Fix authentication bug"
- "Add user profile page"
- "Review pull request #123"
- "Write deployment documentation"

❌ 不好的:
- "Authentication bug"
- "User profile feature"
- "Pull request review"

### Task 描述

包含足够的上下文让 agent 理解要做什么:

✅ 好的:
```
Fix JWT token expiration issue. Tokens currently expire
after 30 minutes which interrupts user sessions. Need to
implement refresh token mechanism that allows users to
stay logged in for 7 days. See issue #456 for details.
```

❌ 不好的:
```
Fix bug
```

### 依赖管理

创建依赖关系来表达阻塞关系:

✅ 好的:
```
Task A: "Create database schema"
Task B: "Write database migrations" (depends on A)
Task C: "Implement API endpoints" (depends on B)
Task D: "Write integration tests" (depends on A, B, C)
```

❌ 不好的:
```
所有任务独立,没有跟踪依赖关系
→ Agent 可能会以错误的顺序处理任务
```

### Metadata 使用

使用 metadata 存储结构化的任务属性:

✅ 好的:
```
{
  subject: "Implement feature X",
  metadata: {
    priority: "high",
    estimated_hours: 4,
    assignee_skills: ["frontend", "react"],
    dependencies: ["issue#123"]
  }
}
```

❌ 不好的:
```
{
  subject: "Implement feature X (high priority, 4 hours, requires frontend skills)"
}
```

## 示例工作流

### 简单顺序工作流

```
User 创建任务:
1. "Write API endpoint" (pending)
2. "Write tests" (pending, blocked by 1)
3. "Deploy to staging" (pending, blocked by 2)

Agent 1:
  TaskList() → 看到 task 1 (未被阻塞)
  TaskUpdate(1, in_progress, owner=agent-1)
  → 实现 endpoint
  TaskUpdate(1, completed)

Agent 2:
  TaskList() → 看到 task 2 (被 1 阻塞)
  → 等待 task 1 完成

Agent 1:
  TaskList() → 看到 task 2 (现在未被阻塞)
  TaskUpdate(2, in_progress, owner=agent-1)
  → 编写测试
  TaskUpdate(2, completed)

Agent 3:
  TaskList() → 看到 task 3 (未被阻塞)
  TaskUpdate(3, in_progress, owner=agent-3)
  → 部署
  TaskUpdate(3, completed)
```

### 带依赖的并行工作

```
     Task A (in_progress)
     /                 \
Task B (blocked)    Task C (blocked)
     \                 /
     Task D (blocked by B,C)

Agent-1: 处理 A
Agent-2: 处理 C (一旦 C 解除阻塞)
Agent-3: 处理 B (一旦 B 解除阻塞)
Agent-4: 等待 D (被 B 和 C 阻塞)

一旦 A 完成:
  B 和 C 现在解除阻塞 → agent 2,3 立即开始

一旦 B,C 完成:
  D 解除阻塞 → agent 4 开始
```

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
