# Worktree + Task Isolation: 隔离的开发环境

## 概述

Git worktrees 为每个 agent 会话提供隔离的开发环境。这允许:

- 在不同的分支上并行工作而不干扰
- 关注点的清晰分离(每个功能一个 worktree)
- 安全的实验而不影响主工作区
- 每个会话的 git 状态隔离
- 轻松的清理和恢复

## 架构

```
主 Git Repository
│
├─ 主 Worktree (默认)
│  └─ /path/to/project/
│     └─ 主分支的文件
│
├─ Session 1 Worktree
│  └─ /tmp/claude-abc123/
│     └─ feature-1 分支的文件
│
├─ Session 2 Worktree
│  └─ /tmp/claude-def456/
│     └─ bugfix-2 分支的文件
│
└─ Session 3 Worktree
   └─ /tmp/claude-ghi789/
      └─ docs 分支的文件

每个 worktree:
  ✓ 隔离的 git 状态
  ✓ 独立的分支
  ✓ 独立的文件系统
  ✓ 自己的 git 历史
  ✓ 自动清理
```

## 什么是 Git Worktree?

Git worktree 是链接到同一 repository 的独立工作目录:

```bash
# 列出 worktrees
git worktree list
/path/to/project      abc1234 [main]
/tmp/claude-abc123    def5678 [feature-x]
/tmp/claude-def456    ghi9012 [bugfix-y]

# 每个 worktree:
# - 有自己检出的分支
# - 有独立的工作目录
# - 共享 .git object database (高效)
# - 可以独立删除
```

## Session 工作流

### 进入 Worktree 之前

```
初始状态:
├─ 用户在 /path/to/project 打开 Claude Code
├─ 当前分支: main
├─ Agent 在主目录中读/写
└─ 风险: 意外更改主分支
```

### 进入 Worktree

```typescript
// Agent 调用 EnterWorktreeTool
const result = await EnterWorktree({
  branchName: "feature/user-auth"
})

// 系统:
// 1. 检查: 是 git repo? 是
// 2. 检查: Worktree 模式启用? 是
// 3. 创建 worktree:
//    git worktree add /tmp/claude-{hash} feature/user-auth
// 4. 切换: Agent 的工作目录 → worktree
// 5. 更新: Session 状态与 worktree 路径
// 6. 清除: 任何缓存的系统 prompts
// 7. 返回: Worktree 路径信息

结果:
{
  worktreePath: "/tmp/claude-abc123",
  branch: "feature/user-auth",
  mainRepoRoot: "/path/to/project"
}
```

### 在 Worktree 中工作

```
在 Worktree 中:
├─ Agent 可以自由编辑文件
├─ 更改只影响这个 worktree
├─ Git 操作正常工作:
│  ├─ git add/commit
│  ├─ git log (仅此分支)
│  └─ git push (安全、隔离)
├─ 其他 sessions 不受影响
└─ 主 repo 未触及
```

### 退出 Worktree

```typescript
// Agent 调用 ExitWorktreeTool
const result = await ExitWorktree()

// 系统:
// 1. 检查: 当前在 worktree 中? 是
// 2. Commit/push: 任何更改 (如果未完成)
// 3. 移除: git worktree prune
// 4. 切换: 回到主 repo 目录
// 5. 更新: Session 状态 (清除 worktree 路径)
// 6. 清除: 缓存状态
// 7. 返回: 确认

结果:
{
  status: "exited",
  branch: "feature/user-auth",
  commitsCreated: 3,
  changes: "pushed to origin"
}
```

### 清理

```
自动清理:
├─ Worktree 移除后:
│  └─ 目录 /tmp/claude-abc123/ 被删除
├─ Session 结束后:
│  └─ 悬空的 worktrees 被修剪
└─ 7 天后:
   └─ 孤立的 worktrees 被移除
```

## 数据模型

### Worktree Session 状态

```typescript
interface WorktreeSession {
  worktreePath: string        // /tmp/claude-abc123
  worktreeBranch: string      // feature/user-auth
  mainRepoRoot: string        // /path/to/project
  createdAt: number           // Unix timestamp
  commitsBefore: number       // Worktree 之前主分支的 commits
  commitsCreated?: number     // Worktree 中创建的 commits
}

// 存储在 session storage 中:
appState.worktreeSession = {
  worktreePath: "/tmp/claude-abc123",
  worktreeBranch: "feature/user-auth",
  mainRepoRoot: "/path/to/project"
}
```

### 环境集成

```bash
# 在 worktree session 期间:
export CLAUDE_WORKTREE_PATH="/tmp/claude-abc123"
export CLAUDE_MAIN_REPO="/path/to/project"
export CLAUDE_WORKTREE_BRANCH="feature/user-auth"

# 所有工具都遵守这些:
cd "${CLAUDE_WORKTREE_PATH}" # 在 worktree 中工作
```

## 使用场景

### 1. 功能开发隔离

```
场景: 开发新功能而不影响主分支

用户: "实现用户认证功能"

Agent:
  1. EnterWorktree({branchName: "feature/auth"})
     → 创建 worktree，切换到功能分支

  2. 开发功能:
     → 创建 auth.ts
     → 创建 auth.test.ts
     → 创建 migrations
     → 全部在 worktree 中

  3. Git 操作:
     git add .
     git commit -m "Implement authentication"
     git push -u origin feature/auth

  4. ExitWorktree()
     → 清理 worktree
     → 回到主目录
     → 主分支未更改

结果:
  - 主分支未触及
  - 功能分支有所有 commits
  - 准备好 pull request
  - Worktree 已清理
```

### 2. 并行实验

```
用户希望多个 agents 在不同功能上工作:

Team Lead:
  Session 1: EnterWorktree("feature/payments")
  Session 2: EnterWorktree("feature/notifications")
  Session 3: EnterWorktree("feature/analytics")

每个 session:
  ✓ 独立的 worktree
  ✓ 不同的分支
  ✓ 并行开发
  ✓ 无干扰

结果:
  - 3 个功能分支准备就绪
  - 每个独立合并
  - 主分支从未触及
```

### 3. 安全重构

```
用户: "重构数据库层"

Agent:
  1. EnterWorktree("refactor/db-layer")
  2. 分析: 读取所有数据库代码
  3. 规划: 创建重构计划
  4. 实现: 重构类
  5. 测试: 运行测试 (在 worktree 中)
  6. 验证: 提交更改
  7. ExitWorktree()

安全优势:
  - 重构期间主分支未触及
  - 可以在隔离环境中彻底测试
  - 轻松回滚 (删除 worktree)
  - 不影响其他开发者
```

### 4. 旧版本的 Hotfix

```
场景: 修复已发布版本中的 bug

主 repo: 在 v2.0
需要修复: v1.5 中的 bug (仍在生产中)

Worktree 工作流:
  1. git tag -l (检查可用版本)
  2. EnterWorktree({branchName: "v1.5-hotfix"})
     → 从 v1.5 tag 创建 worktree
  3. 修复 bug: 编辑 /file.ts
  4. 测试: npm run test
  5. Commit: git commit -m "Fix: XYZ bug"
  6. Push: git push
  7. ExitWorktree()

结果:
  - v1.5 分支上的 hotfix
  - 主 v2.0 未触及
  - 如果需要可以将 hotfix 合并到主分支
  - 旧版本用户可以更新
```

## 技术细节

### 创建 Worktree

```bash
# Claude Code 内部执行的操作:
git worktree add [path] [branch]

# 示例:
git worktree add /tmp/claude-abc123 feature/user-auth

# Git 自动:
# 1. 创建 /tmp/claude-abc123/
# 2. 检出 feature/user-auth 分支
# 3. 设置 worktree 元数据
# 4. 与主 repo 共享 .git/objects
```

### 移除 Worktree

```bash
# Claude Code 执行的操作:
git worktree remove [path]
# 或
git worktree prune

# 清理:
# 1. 移除 /tmp/claude-abc123/
# 2. 移除 worktree 元数据
# 3. 不删除分支 (可以手动删除)
```

### 共享 Objects vs. 独立状态

```
Git Worktree 设计:
├─ .git/objects/      共享 (所有 worktrees 相同)
│  └─ Commits, trees, blobs (高效重用)
├─ .git/refs/heads/   独立 (每个 worktree)
│  └─ 分支指针 (每个独立)
└─ Working tree/      独立 (每个 worktree)
   └─ 实际文件 (隔离)

优势:
  多个 worktrees 不会重复 commits
  但每个都有独立的分支/工作状态
```

## 配置

### 启用 Worktree 模式

```bash
# Feature flag
export CLAUDE_WORKTREE_MODE=true

# 或每个 session
claude-code --worktree-mode

# 检查状态
claude-code --check-worktree-support
# 输出: Git worktrees supported: YES
#       Current worktree: NO
#       Available worktrees: 3
```

### Worktree 目录

```bash
# 配置 worktree 基础路径
export CLAUDE_WORKTREE_BASE="/tmp"  # 默认
export CLAUDE_WORKTREE_BASE="/var/tmp"  # 替代

# 创建的 Worktrees:
/tmp/claude-{hash}/
/tmp/claude-{hash}/  # 不同的 agents 获得不同的 hashes
```

## Worktrees 中的权限

### 自动权限提升

Worktree sessions 可能获得提升的权限:

```typescript
// 在 worktree 中时:
const permissions = {
  default: "bypass",  // 更宽松
  // 或
  default: "ask"      // 仍然询问，但范围限定在 worktree
}

// 原因:
// - 更改隔离在 worktree 中
// - 不会影响主分支
// - 总是可以回滚 (删除 worktree)
// - 实验更安全
```

### 范围限定的权限

即使在 worktrees 中，某些操作仍然受限:

```
始终允许:
  ✓ 在 worktree 内编辑
  ✓ 在 worktree 中执行 Bash 命令
  ✓ Git 操作

始终拒绝 (无论是否在 worktree 中):
  ✗ 执行 sudo/rm -rf
  ✗ 访问 /etc/ 或系统文件
  ✗ 全局安装包
  ✗ 修改 ~/.ssh 或 ~/.git/config
```

## Task 隔离

### Worktrees 中的 Tasks

后台 tasks 可以在 worktrees 中运行:

```typescript
// 在 worktree 中的主 agent
await Agent({
  description: "Long-running analysis",
  run_in_background: true  // 在同一 worktree 中运行
})

// Task 操作在:
// - 同一隔离分支
// - 同一目录
// - 同一 git 状态
// - 完成，结果可用
```

### Worktree + Task 并行化

```
带 worktrees 的 Team:
├─ Session 1: Worktree "feature/1"
│  └─ 生成 task: 长时间分析
│     → Task 在同一 worktree 中运行
│
├─ Session 2: Worktree "feature/2"
│  └─ 生成 task: 测试套件
│     → Task 在同一 worktree 中运行
│
└─ Session 3: Worktree "feature/3"
   └─ 生成 task: 文档
      → Task 在同一 worktree 中运行

全部并行，无干扰
```

## 最佳实践

### 1. 用于任何非平凡的更改

✅ 好:
```
用户: "实现新功能"
→ 自动使用 worktree
→ 安全的开发环境

用户: "修复关键 bug"
→ 自动使用 worktree
→ 与主工作隔离
```

❌ 坏:
```
用户: "读取这个文件"
→ 不需要 worktree
→ 只需读取主目录
```

### 2. 始终显式退出

✅ 好:
```
完成功能:
→ ExitWorktree()
→ 显式清理
→ 清除 session 状态
```

❌ 坏:
```
忘记退出
→ 自动清理 (最终)
→ 但资源暂时被占用
→ 状态混乱
```

### 3. 退出前提交工作

✅ 好:
```
在 worktree 中:
→ 进行更改
→ git add .
→ git commit -m "..."
→ ExitWorktree()
→ 所有工作都被保留
```

❌ 坏:
```
更改未提交
→ ExitWorktree()
→ 更改丢失
→ 未提交的工作被丢弃
```

### 4. 使用有意义的分支名称

✅ 好:
```
feature/user-authentication
bugfix/payment-processing
docs/api-reference
refactor/database-layer
```

❌ 坏:
```
work
temp
fix-stuff
test123
```

## 边缘情况

### 1. 嵌套 Worktrees

不支持 (被 git 阻止):

```
不能: 在已经在 worktree 中时 EnterWorktree
→ 错误: "Already in worktree"
→ 必须: 先 ExitWorktree()
```

### 2. Detached HEAD 上的 Worktree

```
场景: 分支在 origin 上被删除，worktree 仍然存在

解决方案:
  1. 检查 git status
  2. 如果需要，commit/push 工作
  3. 切换分支 (如果需要)
  4. ExitWorktree()
  5. 创建新 worktree
```

### 3. 主分支中的合并冲突

```
场景: 功能分支与主分支有冲突

Worktree 允许:
  1. 本地解决冲突
  2. 创建 pull request
  3. 在 GitHub/Git 中处理合并
  4. 主分支更新
  5. ExitWorktree()
  6. 功能分支可以被删除

不需要特殊处理
```

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
