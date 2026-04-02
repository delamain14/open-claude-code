# Agent Teams: 多 Agent 协作

## 概述

Agent Teams (Swarms) 允许多个 agent 在一个项目上协作:

- **Team Lead** (队列主管) 协调工作
- **Teammates** (工作者) 并行执行任务
- **Shared Tasks** 对所有成员可见
- **Synchronized Permissions** 由 team lead 管理
- **Message Mailbox** 用于 agent 间通信

## 架构

```
┌──────────────────────────────────────────────────┐
│         Team Lead Agent (Control Session)       │
│                                                  │
│  • 协调工作                                       │
│  • 创建任务                                       │
│  • 管理权限                                       │
│  • 监控进度                                       │
│  • 批准 teammate 决策                             │
└────┬─────────────────┬──────────────┬──────────┘
     │                 │              │
     ↓                 ↓              ↓
 ┌────────────┐  ┌────────────┐  ┌────────────┐
 │ Teammate 1 │  │ Teammate 2 │  │ Teammate 3 │
 │ "Frontend" │  │ "Backend"  │  │ "Database" │
 │            │  │            │  │            │
 │ Session A  │  │ Session B  │  │ Session C  │
 └────────────┘  └────────────┘  └────────────┘
     ↓                 ↓              ↓
 并行执行 (tmux/iTerm2/in-process)

     ↓ Shared Task List ↓ Shared Permissions ↓
```

## Team 生命周期

### 创建 Team

```typescript
// TeamCreate tool
{
  name: "my-team",
  description: "Cross-functional feature team"
}

// 系统:
// 1. 生成唯一的 team 名称
// 2. 创建 ~/.claude/teams/my-team/
// 3. 创建 team.json 元数据
// 4. 初始化共享任务列表
// 5. 返回 team 配置
```

### Team 文件结构

```
~/.claude/teams/my-team/
├── team.json                # Team 元数据
├── tasks/                   # 共享任务目录
│   ├── .lock
│   ├── .highwatermark
│   └── {taskId}.json
├── permissions/             # 共享权限
│   └── allowed-paths.json
└── mailbox/                 # Agent 间消息
    ├── teammate-1.mailbox
    ├── teammate-2.mailbox
    └── teammate-3.mailbox
```

### Team 元数据文件

```json
{
  "name": "my-team",
  "description": "Cross-functional feature team",
  "createdAt": 1712000000000,
  "leadAgentId": "agent-xyz",
  "leadSessionId": "session-123",

  "members": [
    {
      "agentId": "frontend-agent@my-team",
      "name": "frontend",
      "agentType": "general-purpose",
      "model": "claude-3-5-sonnet-20241022",
      "color": "blue",
      "joinedAt": 1712000000000,
      "sessionId": "session-456",
      "tmuxPaneId": "window:pane",
      "cwd": "/path/to/project",
      "backendType": "tmux",
      "isActive": true,
      "mode": "bypassPermissions"
    },
    {
      "agentId": "backend-agent@my-team",
      "name": "backend",
      "agentType": "general-purpose",
      "joinedAt": 1712000000001,
      "sessionId": "session-789",
      "tmuxPaneId": "window:pane",
      "backendType": "tmux",
      "isActive": true,
      "mode": "bypassPermissions"
    }
  ],

  "teamAllowedPaths": [
    {
      "path": "src/**",
      "toolName": "Edit",
      "addedBy": "agent-xyz",
      "addedAt": 1712000000000
    }
  ]
}
```

## 添加 Teammates

### Teammate 初始化

```typescript
// TeamCreateTool 添加 teammates:
{
  teamName: "my-team",
  members: [
    {
      name: "frontend",
      agentType: "general-purpose",
      prompt: "You are frontend specialist..."
    },
    {
      name: "backend",
      agentType: "general-purpose",
      prompt: "You are backend specialist..."
    }
  ]
}

// 系统:
// 1. 使用成员更新 team.json
// 2. 创建后端 sessions (tmux/iTerm2)
// 3. 初始化每个 teammate 的上下文
// 4. 创建 mailbox 文件
// 5. 设置权限模式
```

### Backend 类型

Teams 支持不同的执行后端:

| Backend | 平台 | 优点 | 缺点 |
|---------|----------|------|------|
| `tmux` | Linux/macOS | 持久化、可见 | 需要 tmux |
| `iTerm2` | macOS | 原生集成 | 仅 macOS |
| `in-process` | 全部 | 无子进程开销 | 隔离性有限 |

## Shared Task List

所有 team 成员访问相同的任务列表:

```typescript
// Team Lead 创建任务:
TaskCreate({
  subject: "Implement user profile page",
  description: "Frontend component + backend API + database"
})
// 存储: ~/.claude/teams/my-team/tasks/1.json

// Frontend teammate 看到:
TaskList() → 包含上述任务

// Frontend 认领任务:
TaskUpdate({
  taskId: "1",
  status: "in_progress",
  owner: "frontend-agent@my-team"
})

// Backend 可以看到:
TaskList() → 显示 "1" 由 frontend 拥有, 状态为 in_progress
```

### Team 中的任务依赖

任务可以表达 team 级别的依赖关系:

```
Frontend Task: "Create profile UI"
  blocks: ["Backend Task 1"]

Backend Task 1: "Implement profile API"
  blockedBy: ["Frontend Task"]
  blocks: ["Backend Task 2"]

Database Task: "Create profile table"
  blocks: ["Backend Task 1"]

执行:
  Frontend 立即开始
  Database 立即开始 (并行)
  Backend 等待 Database (强制依赖)
  Database 完成后, Backend 可以开始
  Frontend 不等待 (独立的 UI 工作)
```

## 权限同步

### Team Lead 权限管理

Team lead 定义共享权限:

```typescript
// Team lead 授予路径
{
  teamAllowedPaths: [
    {
      path: "src/**",
      toolName: "Edit",
      addedBy: "agent-xyz",
      reason: "Core feature implementation"
    },
    {
      path: "tests/**",
      toolName: "Write",
      addedBy: "agent-xyz"
    }
  ]
}

// 所有 teammates 获得这些权限
```

### 权限继承

Teammates 从 team lead 继承并请求权限:

```
Teammate: "Can I edit /src/main.ts?"

流程:
  1. 检查本地规则: 拒绝 (不在允许列表中)
  2. 检查 team 规则: 允许 (匹配 src/**)
  3. 继续操作

或:

  1. 检查 team 规则: 拒绝
  2. 询问 team lead (通过 mailbox)
  3. Team lead 响应: 允许/拒绝
  4. 继续或拒绝
```

### 权限模式

每个 teammate 都有一个控制权限行为的模式:

| 模式 | 行为 |
|------|----------|
| `default` | 每个决策都询问 lead |
| `bypass` | 自动允许所有操作 |
| `deferToClassifier` | ML 分类器决定 |
| `delegatedByTeamLead` | Lead 发送权限批次 |

## Agent 间通信

### Mailbox 系统

Teammates 通过 JSON mailbox 文件通信:

```
~/.claude/teams/my-team/mailbox/
├── frontend.mailbox
├── backend.mailbox
└── database.mailbox
```

### 消息格式

```json
{
  "id": "msg-12345",
  "from": "lead-agent",
  "to": "frontend-agent",
  "type": "permission_request",
  "content": {
    "tool": "Edit",
    "path": "/src/new-feature.ts",
    "action": "allow" | "deny"
  },
  "timestamp": 1712000000000
}
```

### 消息类型

| 类型 | 发送者 | 目的 |
|------|--------|---------|
| `task_notification` | Lead/Teammate | 任务状态改变 |
| `permission_request` | Teammate | 向 lead 请求权限 |
| `permission_response` | Lead | 授予/拒绝权限 |
| `status_update` | Teammate | 报告进度 |
| `error_report` | Teammate | 报告失败 |
| `question` | Teammate | 向 lead 请求指导 |

## 监控与控制

### Team Lead Dashboard

Team lead 可以监控所有 teammates:

```typescript
// 获取所有 team 成员的状态
const status = {
  "frontend": {
    sessionId: "session-456",
    status: "active",
    lastMessage: "Implementing header component",
    currentTask: "1",
    tokensUsed: 45000
  },
  "backend": {
    sessionId: "session-789",
    status: "idle",
    currentTask: "none",
    tokensUsed: 2000
  }
}
```

### 任务重新分配

Team lead 可以重新分配任务:

```typescript
// 从一个 teammate 重新分配给另一个
TaskUpdate({
  taskId: "1",
  owner: "backend-agent@my-team"
})

// 通过 mailbox 消息通知
// Teammate 确认或拒绝
```

### 移除 Teammate

```typescript
// 从 team 中移除 teammate
TeamDeleteMember({
  teamName: "my-team",
  agentId: "frontend-agent@my-team"
})

// 系统:
// 1. 更新 team.json
// 2. 终止后端 session
// 3. 归档任务/消息
// 4. 清理资源
```

## 实际工作流程

### Sprint 示例: 多功能开发

```
Team Lead:
  1. 创建包含 3 个 teammates 的 team (frontend, backend, db)
  2. 创建 3 个任务 (每个专家一个):
     - Task 1: Frontend UI
     - Task 2: Backend API
     - Task 3: Database schema

Frontend Teammate:
  TaskList() → 看到 3 个任务
  TaskUpdate(Task 1, in_progress)
  → 开发 React 组件
  → 提交代码
  → TaskUpdate(Task 1, completed)

Backend Teammate:
  TaskList() → 看到 Task 2 未被阻塞 (可以开始)
  TaskUpdate(Task 2, in_progress)
  → 等待数据库 (Task 3 阻塞器)
  → 询问 lead: "Database table ready?"
  → Lead: "Almost done, 10 mins"
  → 处理 API 脚手架

Database Teammate:
  TaskList() → 看到 Task 3
  TaskUpdate(Task 3, in_progress)
  → 创建数据库 schema
  → 运行 migrations
  → TaskUpdate(Task 3, completed)

Backend Teammate (恢复):
  → 数据库现在完成
  → 与数据库集成
  → 实现完整 API
  → 与 frontend 测试
  → TaskUpdate(Task 2, completed)

Team Lead:
  TaskList() → 所有 3 个任务完成
  → 验证集成
  → 准备发布
```

## 最佳实践

### 1. 清晰的角色定义

✅ 好:
```
Frontend Team:
  - React 组件实现
  - CSS 样式
  - 客户端验证

Backend Team:
  - REST API 端点
  - 数据库查询
  - 认证逻辑

Database Team:
  - Schema 设计
  - Migration 管理
  - 性能优化
```

❌ 坏:
```
Team 1: "做所有事情"
Team 2: "做所有事情"
→ 职责不明确, 冲突
```

### 2. 依赖声明

✅ 好:
```
Task 1: "Design database schema"
Task 2: "Implement API" (blockedBy: 1)
Task 3: "Build UI" (独立)

→ 清晰的依赖关系防止瓶颈
```

❌ 坏:
```
Task 1, 2, 3: 无依赖
→ Teammates 猜测顺序
→ 可能返工
```

### 3. 权限边界

✅ 好:
```
Frontend 可以编辑: src/components/**, tests/ui/**
Backend 可以编辑: src/api/**, src/db/**, tests/backend/**
Database 可以编辑: migrations/**, src/db/schema/**
```

❌ 坏:
```
所有 teammates: bypassPermissions 模式
→ 意外编辑错误代码
→ 冲突
```

### 4. 定期检查

✅ 好:
```
Team lead: 定期检查 TaskList
→ 更新阻塞器: "Task 1 complete, Task 2 unblocked"
→ 根据需要重定向 teammates
→ 解决权限争议
```

❌ 坏:
```
Team lead: 设置后放手
→ Teammates 卡住等待
→ 未解决的冲突
→ 浪费时间
```

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
