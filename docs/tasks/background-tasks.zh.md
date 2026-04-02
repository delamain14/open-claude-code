# Background Tasks: 异步操作执行

## 概述

Background Tasks 允许长时间运行的操作执行而不阻塞主 agent。用户可以:

- 使用 Ctrl+B 生成任务
- 继续在新会话中工作
- 监控任务进度
- 准备就绪时检索结果

## 架构

```
主会话 (前台)
    ↓
[用户生成任务: Ctrl+B]
    ↓
┌─────────────────────────────┐
│ 创建 Background Task        │
│ - 生成 taskId               │
│ - 初始化状态                │
│ - 设置初始状态              │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 保存任务状态                    │
│ ~/.claude/tasks/{sessionId}/    │
│ {taskId}.state.json             │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 生成后台进程                            │
│ • 分离的会话                            │
│ • 独立终端 (tmux/iTerm2)               │
│ • 重定向 I/O (输出文件)                │
└────────┬────────────────────────────────┘
         ↓
主会话继续
(用户可以创建新会话或在其他地方工作)
         ↓
┌─────────────────────────────────┐
│ Background Task 执行            │
│ • 运行 bash 命令                │
│ • 或生成 subagent               │
│ • 流式输出到文件                │
│ • 更新状态: pending→running     │
└────────┬───────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 任务完成/失败                           │
│ • 完成输出文件                          │
│ • 更新状态: completed/failed            │
│ • 设置 endTime                          │
│ • 存储结果                              │
└─────────────────────────────────────────┘
         ↓
用户稍后可以:
  • TaskOutput 检索结果
  • 如果仍在运行则终止任务
  • 在任务列表中检查状态
```

## Task 类型

Background tasks 支持多种执行类型:

```typescript
type TaskType =
  | "local_bash"              // 执行 bash 命令
  | "local_agent"             // 生成本地 subagent
  | "remote_agent"            // SSH 到远程，生成 agent
  | "in_process_teammate"     // 同一进程中的团队成员
  | "local_workflow"          // 执行 workflow 脚本
  | "monitor_mcp"             // 监控 MCP server
  | "dream"                   // Dream 模式 (特殊)
```

## Task 状态模型

```typescript
interface TaskState {
  id: string                  // b{8chars} 格式
  type: TaskType
  status: TaskStatus          // pending|running|completed|failed|killed
  description: string         // 人类可读

  toolUseId?: string          // 创建它的工具调用
  startTime: number           // Unix 时间戳 (ms)
  endTime?: number            // Unix 时间戳 (ms)
  totalPausedMs?: number      // 暂停持续时间

  // 输出处理
  outputFile: string          // 输出文件路径
  outputOffset: number        // 当前读取位置

  // 通知
  notified: boolean           // 用户已被通知?
}

type TaskStatus =
  | "pending"                 // 已创建，未启动
  | "running"                 // 活动执行
  | "completed"               // 成功
  | "failed"                  // 错误
  | "killed"                  // 用户终止
```

## Background Bash Tasks

### 创建 Bash Task

```bash
# 用户在 agent 执行期间按 Ctrl+B
# 系统提示输入要在后台运行的命令

输入命令: npm run tests
```

### Bash Task 执行

```typescript
interface BashTaskState extends TaskState {
  type: "local_bash"
  command: string
  cwd: string
  env?: Record<string, string>
}

// 执行:
const child = spawn("bash", ["-c", command], {
  detached: true,  // 从父进程分离
  stdio: ["ignore", outputFile, outputFile],  // 重定向到文件
  cwd: cwd
})

// 即使父进程退出，子进程也会继续
process.kill(-child.pid)  // 如果稍后需要，终止进程组
```

### 示例: 测试执行

```
用户正在处理代码
按下 Ctrl+B → 生成后台任务

命令: npm run test
输出文件: ~/.claude/tasks/{sessionId}/b12345678.out

主会话:
  ↓ 在新会话中继续工作

后台进程:
  → npm run test
  → 流式输出到文件
  → 状态: running

30 秒后:
  → 测试完成
  → 状态: completed
  → 输出可通过 TaskOutput 获取
```

## Background Agent Tasks

### 创建 Agent Task

```typescript
// Agent 工具可以生成后台 subagent:
{
  run_in_background: true,
  description: "长时间运行的分析任务",
  subagent_type: "explorer"
}

// 系统:
// 1. 创建 BashTaskState
// 2. 生成子进程
// 3. 子进程运行 agent 循环
// 4. 输出流式传输到文件
// 5. 立即返回 taskId
```

### In-Process Teammate Tasks

对于 Agent Teams，teammates 作为后台任务运行:

```typescript
interface InProcessTeammateTask extends TaskState {
  type: "in_process_teammate"
  agentId: string             // 团队成员 ID
  sessionId: string           // 团队成员会话

  // 进程管理
  subprocess?: ChildProcess
}

// 执行:
// 1. 创建运行 teammate 的子进程
// 2. 通过 pipes/sockets 通信
// 3. 维护消息队列 (mailbox)
// 4. 流式输出
// 5. 跟踪状态
```

## 输出流式传输

### 输出文件格式

Background tasks 以特定格式写入文件:

```
~/.claude/tasks/{sessionId}/
├── b12345678.out            # 原始输出
├── b12345678.state.json     # 状态元数据
└── ...
```

### 读取输出

```typescript
// 获取任务输出
const result = await TaskOutput({
  taskId: "b12345678",
  block: true,               // 等待完成?
  timeout: 30000            // 最大等待时间 (ms)
})

// 返回:
{
  status: "completed",
  output: "命令输出...",
  exitCode: 0
}
```

### 流式传输 vs. 轮询

用户可以实时监控或稍后获取结果:

```bash
# 实时监控
# 终端监视输出文件并更新 UI

# 稍后检索
> TaskOutput b12345678
# 获取存储的输出
```

## Task 生命周期

### 状态转换

```
pending → running → completed
      ↘    ↗
       failed
      ↙ ↗
      killed (终止状态)
```

### 创建 Task

```typescript
function createTask(config: TaskConfig): TaskState {
  const id = generateTaskId()  // "b" + 8 个随机字符

  return {
    id,
    type: config.type,
    status: "pending",
    description: config.description,
    outputFile: `${tasksDir}/${id}.out`,
    outputOffset: 0,
    startTime: Date.now(),
    notified: false
  }
}
```

### 开始执行

```typescript
async function startTask(task: TaskState) {
  // 更新状态
  task.status = "running"
  task.startTime = Date.now()

  // 生成子进程
  const subprocess = spawn(...)

  // 流式输出
  subprocess.stdout.pipe(fs.createWriteStream(task.outputFile))

  // 监控完成
  subprocess.on("close", (code) => {
    task.status = code === 0 ? "completed" : "failed"
    task.endTime = Date.now()
    notifyUser(task)
  })
}
```

### 跟踪 Tasks

活动任务存储在 AppState 中:

```typescript
interface AppState {
  tasks: {
    [taskId: string]: TaskState
  }
}

// UI 显示任务列表:
"Background Tasks:
  [●] b12345678  npm run tests      (running, 已运行 2m30s)
  [✓] b87654321  npm run build      (completed, 1m12s)
  [●] b11111111  agent research     (running, 已运行 45s)"
```

## 终止 Tasks

用户可以终止正在运行的任务:

```typescript
// KillShell 工具
{
  shell_id: "b12345678"
}

// 内部:
process.kill(-taskProcess.pid)  // 终止进程组
task.status = "killed"
task.endTime = Date.now()
```

## 后台清理

系统定期清理任务:

```typescript
function backgroundHousekeeping() {
  // 1. 扫描 AppState 中的终止任务
  // 2. 对于每个 completed/failed 任务:
  //    - 完成输出文件
  //    - 保留元数据 (用于历史记录)
  //    - 从活动任务列表中删除
  // 3. 清理旧的已完成任务 (> 24 小时)
}

// 运行频率: 每 30 秒
// 非阻塞 (不中断主 agent)
```

## 长时间运行的操作

### 问题: 卡住的 Agents

没有后台处理，长时间操作会阻塞用户:

```
❌ 不好:
用户: "运行完整测试套件"
Agent 启动: pytest (30 分钟)
用户被卡住等待 30 分钟
没有反馈或停止能力
```

### 解决方案: 后台执行

```
✅ 好:
用户: "运行完整测试套件"
Agent: "我将在后台运行测试"
[生成: pytest 在子进程中]
立即返回 taskId: b12345678

用户: 在新会话中继续
  - 可以处理其他任务
  - 检查进度: TaskOutput
  - 如果需要可以终止: KillShell
```

## 与 Agent Loop 集成

```
查询循环迭代:
  ...
  工具: Agent (run_in_background=true)
  → 系统创建任务
  → 生成子进程
  → 立即返回 taskId
  → 循环继续

用户可以:
  → 检查任务列表: TaskList
  → 监控输出: TaskOutput(taskId)
  → 终止任务: KillShell(taskId)
  → 使用新会话进行新工作
```

## Worktree 集成

Background tasks 支持 worktree 隔离:

```
Background Task:
  - 在 git worktree 中生成
  - 与主分支隔离
  - 干净状态
  - 稍后可以合并回来
```

## 最佳实践

### 1. 用于长时间操作

✅ 好:
```bash
# 长时间运行
npm run tests
npm run build
npm run deploy
agent research (30+ 分钟)
```

❌ 不好:
```bash
# 快速操作应该内联运行
cat file.txt
ls directory
echo message
```

### 2. 监控重要任务

```bash
# 检查关键任务状态
TaskOutput b12345678

# 实时监控
# (UI 显示实时进度)
```

### 3. 完成后清理

```bash
# 工作完成后，清理旧任务
# (自动: > 24 小时)
```

## 用例

### 1. 测试执行

```
用户: "运行完整测试套件"
→ 生成后台任务
→ 测试运行 20 分钟
→ 用户继续编码
→ 结果可通过 TaskOutput 获取
```

### 2. 长时间分析

```
Agent: "分析 1000 个文件的模式"
→ 作为后台 subagent 运行
→ 流式传输可用结果
→ 用户可以逐步审查
```

### 3. 部署

```
用户: "部署到生产环境"
→ 后台 bash 任务
→ 构建 → 测试 → 部署
→ 使用 TaskOutput 监控
→ 用户保持响应
```

### 4. 团队成员任务

```
Team Lead: 生成 3 个 teammates
→ 每个作为后台进程运行
→ 任务并行执行
→ 结果由 team lead 合并
```

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
