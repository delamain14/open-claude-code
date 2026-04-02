# Team Protocols: Agent 间通信标准

## 概述

Team Protocols 定义了团队成员之间的通信、同步和协调规则。它们确保即使 agent 在不同进程中并行运行时也能可靠协作。

## 核心协议

### 1. 权限同步协议

确保所有队友遵守团队负责人设置的一致权限规则。

#### 流程: 权限请求

```
队友查询:
  1. 调用 Tool: Edit("/forbidden-file.ts")
  2. 检查: 本地权限规则
  3. 本地规则: 拒绝
  4. 检查: 团队规则 (team.json)
  5. 团队规则: 中立 (未指定)
  6. 操作: 向负责人发送权限请求

发送给负责人的消息:
  {
    id: "perm-req-123",
    from: "frontend-agent",
    type: "permission_request",
    tool: "Edit",
    path: "/forbidden-file.ts",
    timestamp: 1712000000000
  }

负责人处理:
  1. 接收邮箱消息
  2. 评估: 这个路径可以安全编辑吗?
  3. 决策: allow | deny | ask_user
  4. 响应:
     {
       id: "perm-req-123",
       type: "permission_response",
       decision: "allow",
       reason: "集成所需"
     }

队友恢复:
  1. 轮询邮箱获取响应
  2. 接收 permission_response
  3. 决策: allow → 继续执行 Edit
  4. Tool 执行继续
```

#### 权限规则继承

```
负责人授予权限:
  teamAllowedPaths: [
    {
      path: "src/**",
      toolName: "Edit",
      addedBy: "lead-agent"
    }
  ]

队友继承:
  "我可以根据团队规则编辑 src/**"

队友检查权限:
  1. Edit("/src/main.ts")
  2. "src/main.ts" 匹配 "src/**"? 是
  3. 权限: 允许 (无需请求)

队友检查:
  1. Edit("/config/secrets.json")
  2. "config/secrets.json" 匹配 "src/**"? 否
  3. 权限: 询问负责人
```

### 2. Task 通知协议

所有团队成员在 task 变更时接收通知。

#### 流程: Task 状态变更

```
队友更新:
  TaskUpdate({
    taskId: "1",
    status: "in_progress",
    owner: "frontend-agent"
  })

系统广播:
  通知所有队友:
  {
    type: "task_notification",
    taskId: "1",
    change: {
      status: { old: "pending", new: "in_progress" },
      owner: { old: null, new: "frontend-agent" }
    },
    timestamp: 1712000000000
  }

队友处理:
  1. 接收通知
  2. 更新本地 task 缓存
  3. 检查我的任何 task 是否现在解除阻塞
  4. 如果解除阻塞: 记录消息 "Task 2 现在可以开始"
  5. 可以立即认领: TaskUpdate(taskId: 2, in_progress)

示例级联:
  Task 1 完成
    → Task 2 解除阻塞 (被 1 阻塞)
    → Task 3 解除阻塞 (被 1 和 2 阻塞)
    → 多个队友现在可以开始工作
```

### 3. Session 重连协议

允许队友从断开连接中恢复。

#### 流程: Session 恢复

```
队友 Session 活跃:
  Agent 在 tmux pane 中运行
  Session: "session-456"

连接丢失:
  (网络问题、终端关闭等)

负责人检测:
  1. 轮询团队 session 状态
  2. 检测: session-456 不再活跃
  3. 标记: 队友 "inactive"
  4. 日志: "frontend 在 2024-04-01 15:32 离线"

重连:
  1. 用户重连到 tmux pane
  2. 系统检测: 相同 session 恢复
  3. 进程: 仍在运行还是崩溃?
     → 如果崩溃: 重启
     → 如果运行: 恢复正常操作
  4. 标记: 队友 "active"
  5. 重放: 任何错过的消息 (权限更新、task 变更)
```

### 4. 邮箱消息协议

负责人和队友之间的通用消息传递系统。

#### 消息结构

```typescript
interface TeamMessage {
  id: string                 // 唯一消息 ID
  from: AgentId             // 发送者 agent ID
  to: AgentId               // 接收者 agent ID
  type: MessageType
  content: unknown          // 消息特定内容
  timestamp: number         // Unix ms
  acknowledged?: boolean    // 接收者已处理?
}

type MessageType =
  | "permission_request"    // 队友: 询问负责人
  | "permission_response"   // 负责人: 响应请求
  | "task_notification"     // 任何: task 变更
  | "status_update"         // 队友: 报告进度
  | "error_report"          // 队友: 报告失败
  | "instruction"           // 负责人: 指导队友
  | "question"              // 队友: 寻求指导
  | "acknowledgment"        // 任何: 确认收到
```

#### 邮箱存储

```
~/.claude/teams/my-team/mailbox/

Frontend 邮箱:
  [
    {
      id: "msg-1",
      from: "lead",
      type: "task_notification",
      content: { taskId: "2", status: "unblocked" }
    },
    {
      id: "msg-2",
      from: "lead",
      type: "permission_response",
      content: { decision: "allow", reason: "..." }
    }
  ]

Backend 邮箱:
  [ ... ]

负责人没有个人邮箱,
而是通过轮询接收消息。
```

#### 消息生命周期

```
1. 创建
   消息创建并写入接收者邮箱

2. 传递
   接收者轮询并读取邮箱
   → 消息加载到内存
   → 根据类型处理

3. 确认
   接收者标记为已处理
   → 从邮箱文件中删除
   → 释放磁盘空间

4. 归档 (可选)
   已处理的消息可以归档以保留历史
```

### 5. 执行同步协议

协调并行工作并防止冲突。

#### 顺序约束: 阻塞的 Task

```
Task DAG:
  数据库 Schema → API 实现 → UI 集成

执行:
  时间 0:
    Frontend: TaskList() → 看到 Task 3 (被 2 阻塞)
    Backend: TaskList() → 看到 Task 2 (被 1 阻塞)
    Database: 认领 Task 1 → in_progress

  时间 5 分钟:
    Database: Task 1 完成
    → 发送通知: Task 1 已完成
    → Task 2 解除阻塞

    Backend: 接收通知
    → 更新本地 TaskList
    → Task 2 不再阻塞
    → 认领 Task 2 → in_progress

    Frontend: Task 3 仍被阻塞 (等待 Task 2)

  时间 15 分钟:
    Backend: Task 2 完成
    → 发送通知: Task 2 已完成
    → Task 3 解除阻塞

    Frontend: 接收通知
    → Task 3 现在可运行
    → 认领 Task 3 → in_progress
```

#### 冲突预防: 文件锁定

```
场景: 两个队友尝试编辑同一文件

Frontend 尝试:
  Edit("/src/api.ts")
  1. 检查: 文件被锁定?
  2. 被锁定者: Backend
  3. 操作: 询问负责人
     "Backend 正在编辑 /src/api.ts, 我应该等待吗?"
  4. 负责人响应: "等待 backend 完成"
  5. Frontend: 等待或处理不同文件

Backend 完成:
  1. 释放锁
  2. 通知: "/src/api.ts 现在可用"

Frontend 恢复:
  1. 获取锁
  2. Edit 继续
```

## 通信渠道

### 1. 邮箱 (异步)

用于权限、task 变更、状态更新:
- 非阻塞
- 持久化 (在断开连接后存活)
- 由队友轮询
- 适用于: 决策、通知

### 2. WebSocket (同步, 可选)

用于实时协调:
- 即时传递
- 需要连接
- 如果可用则使用
- 如果不可用则回退到邮箱

### 3. 共享 Task 列表 (最终一致性)

所有 agent 看到相同的 task 状态 (有轻微延迟):
- 文件系统作为真实来源
- 锁定以保持一致性
- 写入者: TaskUpdateTool
- 读取者: TaskListTool

## 协议示例

### 示例 1: Frontend 和 Backend 竞争

```
场景: Frontend 和 backend 都想编辑相同的 API 响应格式

时间 0:
  Frontend: "我将修改 API 响应以包含用户配置文件"
  Backend: "我将修改 API 响应以添加分页"

流程:
  1. Frontend 尝试: Edit("/src/api.ts")
     → 检查文件锁: 未锁定
     → 获取锁
     → Edit 继续

  2. Backend 尝试: Edit("/src/api.ts")
     → 检查文件锁: 被 Frontend 锁定
     → 发送权限请求: "我可以编辑吗?"
     → 负责人响应: "等待, frontend 正在编辑"
     → Backend: 暂时处理不同文件

  3. Frontend 完成编辑, 释放锁
     → 发送通知: "文件已释放"

  4. Backend 重试: Edit("/src/api.ts")
     → 检查文件锁: 未锁定
     → 获取锁
     → Edit 继续
     → 但现在与 frontend 的更改冲突!

  5. Backend 检测到冲突
     → 发送给负责人: "/src/api.ts 中的合并冲突"
     → 负责人: 审查两个更改, 决定合并策略
     → 负责人: 指导两个队友解决
```

### 示例 2: 权限边界跨越

```
场景: Backend 想编辑 frontend 文件 (通常不应该发生)

流程:
  1. Backend: "我需要修复 UI 组件"
     → Edit("/src/components/Header.tsx")

  2. 系统检查:
     → 本地规则: 拒绝 (backend 不能编辑 src/components)
     → 团队规则: 拒绝 (backend 不在路径允许列表中)

  3. 向负责人发送权限请求:
     {
       tool: "Edit",
       path: "/src/components/Header.tsx",
       reason: "需要更新 API 集成与 UI"
     }

  4. 负责人审查:
     → 需要 backend 专业知识? 是 (API 集成)
     → 为此文件授予临时权限

  5. 响应给 backend:
     {
       decision: "allow",
       reason: "API 集成更改需要 backend 知识",
       scope: "仅限 /src/components/Header.tsx"
     }

  6. Backend: Edit 继续
     → 进行必要的更改
     → 通知 frontend: "为 API 更新了 Header.tsx"

  7. Frontend 审查并批准
     → 集成成功
```

### 示例 3: 带依赖的并行工作

```
初始 Task 设置:
  Task A: "数据库 schema" (独立)
  Task B: "Backend API" (被 A 阻塞)
  Task C: "Frontend UI" (独立)
  Task D: "集成测试" (被 B, C 阻塞)

时间 0:
  Database: 认领 A → in_progress
  Frontend: 认领 C → in_progress
  Backend: Task B 被阻塞, 等待

时间 5:
  Database: Task A 完成 → 通知
  → Backend: 接收通知
  → Task B 解除阻塞!
  → Backend: 认领 B → in_progress

时间 10:
  Frontend: Task C 完成
  → Database 和 Backend 都在工作 (不需要)

时间 15:
  Backend: Task B 完成
  → Tester: 接收通知
  → Task D 解除阻塞 (A 和 C 都完成)
  → Tester: 认领 D → in_progress

时间 25:
  Tester: Task D 完成
  → 所有工作完成!
```

## 协议合规性

### 保证

✅ **保证:**
- 所有队友看到相同的 task 状态 (最终)
- 权限决策一致
- 不会并发写入同一文件
- 消息按顺序传递

❌ **不保证:**
- 实时同步 (异步)
- 即时消息传递 (依赖轮询)
- 完美的冲突预防 (必须使用锁)

### 权衡

**弹性优于一致性:**
- 队友可以离线工作
- 邮箱在断开连接后持久化
- 重连时赶上

**简单性优于效率:**
- 基于文件的存储 (无数据库)
- 轮询 (无复杂信号)
- 人性化的冲突解决

## 实现细节

### 负责人-队友权限桥接

```typescript
// leaderPermissionBridge.ts
function syncPermissionsToTeammate(lead, teammate) {
  // 1. 队友进行 tool 调用
  // 2. 检查: 这是否被允许?
  // 3. 本地规则: 首先应用
  // 4. 无匹配: 通过桥接查询负责人

  const leadDecision = await askLeadForPermission(tool, input)
  // 桥接查询负责人的权限状态
  // 返回: allow | deny | ask_user

  return leadDecision
}
```

### Task 更新通知

```typescript
// taskNotification.ts
function notifyTasksUpdated(taskId, changes) {
  // 1. Task 文件更新
  // 2. 系统检测: task 变更
  // 3. 广播给所有队友:
  //    - 每个邮箱中的消息
  //    - 本地 task 缓存失效
  //    - UI 刷新
}
```

### 邮箱轮询

```typescript
// teammateMailbox.ts
async function pollMailbox(agentId) {
  // 每 5 秒:
  // 1. 检查此 agent 的邮箱文件
  // 2. 读取新消息
  // 3. 按类型处理:
  //    - task_notification → 更新 task 列表
  //    - permission_response → 解除阻塞等待的 tool
  //    - instruction → 执行负责人的指示
  // 4. 标记已处理的消息
  // 5. 从邮箱中删除
}
```

## 最佳实践

### 1. 清晰的责任边界

✅ 好:
```json
{
  "frontend-agent": {
    "allowedPaths": ["src/components/**", "src/hooks/**"],
    "cannotEdit": ["src/api/**", "src/db/**"]
  }
}
```

❌ 坏:
```json
{
  "all-agents": {
    "allowedPaths": ["**"],
    "cannotEdit": []
  }
}
// 无边界 = 冲突不可避免
```

### 2. 明确的 Task 依赖

✅ 好:
```
Task 1: "Schema 设计" (独立)
Task 2: "API 实现" (被 1 阻塞)
Task 3: "测试" (被 2 阻塞)
```

❌ 坏:
```
所有 task 独立
// 队友猜测顺序
// 返工风险
```

### 3. 定期同步检查

✅ 好:
```
团队负责人: 每次迭代轮询团队状态
→ 检查停滞的队友
→ 解决权限争议
→ 更新阻塞者
```

❌ 坏:
```
团队负责人: 设置后就忘记
// 队友卡住等待
// 问题累积
```

## 关键文件

| 文件 | 用途 |
|------|---------|
| `src/utils/swarm/permissionSync.ts` | 权限协议 |
| `src/utils/swarm/teamHelpers.ts` | 团队工具 |
| `src/utils/swarm/leaderPermissionBridge.ts` | 负责人-队友桥接 |
| `src/utils/swarm/reconnection.ts` | 重连逻辑 |
| `src/utils/swarm/taskNotification.ts` | Task 通知 |
| `src/utils/teammateMailbox.ts` | 邮箱实现 |

## 另见

- [Agent Teams](./agent-teams.md) - 团队结构
- [Tasks](../core/todowrite.md) - Task 管理
- [Permissions](../../architecture/permissions.md) - 权限系统
